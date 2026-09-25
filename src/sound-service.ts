import { routingFrom, volumeToDb, type GlobalSettings, type PlaySoundSettings } from "./settings";
import { BANANA_BUSES, POTATO_BUSES, type VoicemeeterPlayer, type VoicemeeterStatus } from "./voicemeeter/types";

export type PlayResult =
	| { ok: true }
	| { ok: false; reason: "noFile" | "fileNotFound" | "error" | Exclude<VoicemeeterStatus, "banana" | "potato">; message: string };

export type StopResult = { ok: true } | { ok: false; reason: VoicemeeterStatus | "error"; message: string };

/** Human-readable (English) status line, shown in the property inspector and logs. */
export function describeStatus(status: VoicemeeterStatus): string {
	switch (status) {
		case "notInstalled":
			return "Voicemeeter not found. Please install Voicemeeter Banana.";
		case "notRunning":
			return "Voicemeeter is not running.";
		case "standard":
			return "Voicemeeter Standard has no player. Please use Voicemeeter Banana or Potato.";
		case "banana":
			return "Voicemeeter Banana connected.";
		case "potato":
			return "Voicemeeter Potato connected.";
	}
}

export function isSupported(status: VoicemeeterStatus): status is "banana" | "potato" {
	return status === "banana" || status === "potato";
}

/**
 * Action logic, independent of Stream Deck and the DLL so it can be unit-tested.
 */
export class SoundService {
	constructor(
		private readonly player: VoicemeeterPlayer,
		private readonly fileExists: (path: string) => boolean,
	) {}

	status(): VoicemeeterStatus {
		return this.player.status();
	}

	/**
	 * Plays the key's sound, replacing whatever is currently playing (decision D4).
	 * Routing is enforced on every play (D6).
	 */
	play(settings: PlaySoundSettings, global: GlobalSettings | undefined): PlayResult {
		const status = this.player.status();
		if (!isSupported(status)) {
			return { ok: false, reason: status, message: describeStatus(status) };
		}

		const file = settings.file?.trim();
		if (!file) {
			return { ok: false, reason: "noFile", message: "No sound file selected." };
		}
		if (!this.fileExists(file)) {
			return { ok: false, reason: "fileNotFound", message: `Sound file not found: ${file}` };
		}

		try {
			this.player.stop();
			this.player.setRouting(status === "potato" ? POTATO_BUSES : BANANA_BUSES, routingFrom(global));
			this.player.setGain(volumeToDb(settings.volume));
			this.player.load(file);
			this.player.play();
			return { ok: true };
		} catch (err) {
			return { ok: false, reason: "error", message: `Playback failed: ${String(err)}` };
		}
	}

	stop(): StopResult {
		const status = this.player.status();
		if (!isSupported(status)) {
			return { ok: false, reason: status, message: describeStatus(status) };
		}
		try {
			this.player.stop();
			return { ok: true };
		} catch (err) {
			return { ok: false, reason: "error", message: `Stop failed: ${String(err)}` };
		}
	}
}
