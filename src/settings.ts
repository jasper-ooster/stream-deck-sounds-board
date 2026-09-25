import type { Routing } from "./voicemeeter/types";

/** Per-key settings of the "Play Sound" action. */
export type PlaySoundSettings = {
	file?: string;
	/** Volume in percent (0–100). */
	volume?: number;
};

/** Plugin-wide settings, shared by all keys. */
export type GlobalSettings = {
	buses?: Routing;
};

export const DEFAULT_VOLUME = 100;
export const DEFAULT_ROUTING: Routing = { A1: true, B1: true };

/** Lowest gain of the Voicemeeter player; used for 0 %. */
export const MIN_GAIN_DB = -60;

/**
 * Maps a volume in percent to player gain in dB (100 % = 0 dB, 50 % ≈ -6 dB, 0 % = -60 dB).
 */
export function volumeToDb(volume: number | undefined): number {
	const percent = Math.min(100, Math.max(0, volume ?? DEFAULT_VOLUME));
	if (percent === 0) {
		return MIN_GAIN_DB;
	}
	const db = 20 * Math.log10(percent / 100);
	return Math.max(MIN_GAIN_DB, Math.round(db * 10) / 10);
}

/** Routing from global settings, falling back to A1 + B1 when nothing is configured. */
export function routingFrom(settings: GlobalSettings | undefined): Routing {
	const buses = settings?.buses;
	if (!buses || !Object.values(buses).some(Boolean)) {
		return DEFAULT_ROUTING;
	}
	return buses;
}
