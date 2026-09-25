import streamDeck, { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

import type { SoundService } from "../sound-service";

/** Stops whatever the Voicemeeter player is currently playing. */
@action({ UUID: "de.atacama-blooms.soundboard.stop" })
export class StopSound extends SingletonAction {
	constructor(private readonly sounds: SoundService) {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const result = this.sounds.stop();
		if (!result.ok) {
			streamDeck.logger.warn(`Stop failed (${result.reason}): ${result.message}`);
			await ev.action.showAlert();
		}
	}
}
