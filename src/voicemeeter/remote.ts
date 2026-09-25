import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import koffi from "koffi";

import type { Bus, Routing, VoicemeeterPlayer, VoicemeeterStatus } from "./types";

type Log = (level: "debug" | "info" | "warn" | "error", message: string) => void;

const UNINSTALL_KEY = "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VB:Voicemeeter {17359A74-1236-5467}";
const DEFAULT_DIR = "C:\\Program Files (x86)\\VB\\Voicemeeter";
const DLL_NAME = "VoicemeeterRemote64.dll";

type Api = {
	login: () => number;
	logout: () => number;
	getType: (out: number[]) => number;
	setFloat: (name: string, value: number) => number;
	setStringW: (name: string, value: string) => number;
};

/** Locates VoicemeeterRemote64.dll via the uninstall registry key, falling back to the default install dir. */
export function findDll(log: Log): string | undefined {
	try {
		const out = execFileSync("reg.exe", ["query", UNINSTALL_KEY, "/v", "UninstallString"], { encoding: "utf8", windowsHide: true });
		const match = /UninstallString\s+REG_SZ\s+(.+)/.exec(out);
		if (match) {
			const dll = path.win32.join(path.win32.dirname(match[1].trim().replace(/^"|"$/g, "")), DLL_NAME);
			if (existsSync(dll)) {
				return dll;
			}
			log("warn", `DLL from registry does not exist: ${dll}`);
		}
	} catch (err) {
		log("debug", `Registry lookup failed: ${String(err)}`);
	}
	const fallback = path.win32.join(DEFAULT_DIR, DLL_NAME);
	return existsSync(fallback) ? fallback : undefined;
}

/**
 * Controls the Voicemeeter built-in player through VoicemeeterRemote64.dll.
 * Every call logs its return code, so the plugin log doubles as the API spike protocol.
 */
export class RemoteVoicemeeter implements VoicemeeterPlayer {
	#api: Api | undefined;
	#loggedIn = false;

	constructor(private readonly log: Log) {}

	status(): VoicemeeterStatus {
		const api = this.#init();
		if (!api) {
			return "notInstalled";
		}

		let type = this.#queryType(api);
		if (type === undefined) {
			// Voicemeeter may have been started after our login – log in again and retry once.
			this.#relogin(api);
			type = this.#queryType(api);
		}

		switch (type) {
			case undefined:
				return "notRunning";
			case 1:
				return "standard";
			case 2:
				return "banana";
			default:
				// 3 = Potato (and newer variants, e.g. 6 = Potato x64)
				return "potato";
		}
	}

	stop(): void {
		this.#setFloat("Recorder.stop", 1);
	}

	setRouting(buses: readonly Bus[], routing: Routing): void {
		for (const bus of buses) {
			this.#setFloat(`Recorder.${bus}`, routing[bus] ? 1 : 0);
		}
	}

	setGain(db: number): void {
		this.#setFloat("Recorder.Gain", db, false);
	}

	load(file: string): void {
		const rc = this.#require().setStringW("Recorder.load", file);
		this.log(rc === 0 ? "debug" : "error", `SetParameterStringW(Recorder.load, ${file}) -> ${rc}`);
		if (rc !== 0) {
			throw new Error(`Recorder.load failed with code ${rc}`);
		}
	}

	play(): void {
		this.#setFloat("Recorder.play", 1);
	}

	dispose(): void {
		if (this.#api && this.#loggedIn) {
			const rc = this.#api.logout();
			this.log("info", `VBVMR_Logout -> ${rc}`);
			this.#loggedIn = false;
		}
	}

	#setFloat(name: string, value: number, strict = true): void {
		const rc = this.#require().setFloat(name, value);
		this.log(rc === 0 ? "debug" : strict ? "error" : "warn", `SetParameterFloat(${name}, ${value}) -> ${rc}`);
		if (rc !== 0 && strict) {
			throw new Error(`Setting ${name} failed with code ${rc}`);
		}
	}

	#require(): Api {
		const api = this.#init();
		if (!api) {
			throw new Error("Voicemeeter Remote API not available");
		}
		return api;
	}

	#queryType(api: Api): number | undefined {
		const out = [0];
		const rc = api.getType(out);
		this.log("debug", `VBVMR_GetVoicemeeterType -> ${rc}, type=${out[0]}`);
		return rc === 0 ? out[0] : undefined;
	}

	#relogin(api: Api): void {
		if (this.#loggedIn) {
			api.logout();
		}
		const rc = api.login();
		this.#loggedIn = rc >= 0;
		this.log("debug", `VBVMR_Login (retry) -> ${rc}`);
	}

	#init(): Api | undefined {
		if (this.#api) {
			return this.#api;
		}

		const dll = findDll(this.log);
		if (!dll) {
			this.log("warn", `${DLL_NAME} not found`);
			return undefined;
		}

		try {
			const lib = koffi.load(dll);
			const api: Api = {
				login: lib.func("long __stdcall VBVMR_Login(void)"),
				logout: lib.func("long __stdcall VBVMR_Logout(void)"),
				getType: lib.func("long __stdcall VBVMR_GetVoicemeeterType(_Out_ long *pType)"),
				setFloat: lib.func("long __stdcall VBVMR_SetParameterFloat(const char *szParamName, float value)"),
				setStringW: lib.func("long __stdcall VBVMR_SetParameterStringW(const char *szParamName, const char16_t *wszString)"),
			};
			// 0 = OK, 1 = OK but Voicemeeter not running, < 0 = error
			const rc = api.login();
			this.#loggedIn = rc >= 0;
			this.log("info", `Loaded ${dll}; VBVMR_Login -> ${rc}`);
			this.#api = api;
			return api;
		} catch (err) {
			this.log("error", `Loading ${dll} failed: ${String(err)}`);
			return undefined;
		}
	}
}
