/**
 * Connection state of Voicemeeter as seen by the plugin.
 * - notInstalled: VoicemeeterRemote64.dll could not be found/loaded.
 * - notRunning:   DLL loaded, but no Voicemeeter instance is running.
 * - standard:     Voicemeeter (Standard) is running – it has no built-in player.
 * - banana/potato: supported variants with a player.
 */
export type VoicemeeterStatus = "notInstalled" | "notRunning" | "standard" | "banana" | "potato";

/** Output buses the player can be routed to. */
export const BANANA_BUSES = ["A1", "A2", "A3", "B1", "B2"] as const;
export const POTATO_BUSES = ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3"] as const;

export type Bus = (typeof POTATO_BUSES)[number];

/** Routing that should be applied to the player; buses not listed are switched off. */
export type Routing = Partial<Record<Bus, boolean>>;

/**
 * Narrow interface around the Voicemeeter built-in player (a.k.a. "Recorder").
 * The real implementation talks to VoicemeeterRemote64.dll; tests use a fake.
 */
export interface VoicemeeterPlayer {
	status(): VoicemeeterStatus;
	stop(): void;
	setRouting(buses: readonly Bus[], routing: Routing): void;
	setGain(db: number): void;
	load(file: string): void;
	play(): void;
}
