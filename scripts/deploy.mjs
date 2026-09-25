// Builds output -> Windows: copies the .sdPlugin folder into the Stream Deck plugins directory and restarts the plugin.
// Runs in WSL; talks to Windows only via interop (cmd.exe) and /mnt/c. No Node or Git needed on Windows.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vendorKoffi } from "./vendor-koffi.mjs";

const UUID = "de.atacama-blooms.soundboard";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, `${UUID}.sdPlugin`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function windowsAppData() {
	const win = execFileSync("cmd.exe", ["/c", "echo %APPDATA%"], { encoding: "utf8", cwd: "/mnt/c" }).trim();
	return execFileSync("wslpath", ["-u", win], { encoding: "utf8" }).trim();
}

function deepLink(command) {
	// `start` needs an empty window title before the URL.
	execFileSync("cmd.exe", ["/c", "start", "", `streamdeck://plugins/${command}/${UUID}`], { cwd: "/mnt/c", stdio: "ignore" });
}

async function removeWithRetry(dir) {
	// koffi.node stays locked by Windows until the plugin process has exited.
	for (let attempt = 1; ; attempt++) {
		try {
			rmSync(dir, { recursive: true, force: true });
			return;
		} catch (err) {
			if (attempt >= 10) throw err;
			await sleep(500);
		}
	}
}

if (!existsSync(path.join(source, "bin", "plugin.js"))) {
	console.error("bin/plugin.js missing – run `npm run build` first.");
	process.exit(1);
}

vendorKoffi();

const target = path.join(windowsAppData(), "Elgato", "StreamDeck", "Plugins", `${UUID}.sdPlugin`);
const installed = existsSync(target);

if (installed) {
	deepLink("stop");
	await sleep(1000);
	for (const entry of ["bin", "imgs", "ui", "manifest.json"]) {
		await removeWithRetry(path.join(target, entry));
	}
}

cpSync(source, target, { recursive: true, filter: (src) => !src.startsWith(path.join(source, "logs")) });
deepLink("restart");

console.log(`Deployed to ${target}${installed ? "" : " (first install – if the actions don't show up, restart the Stream Deck app)"}`);
