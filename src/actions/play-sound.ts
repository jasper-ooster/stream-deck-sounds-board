import streamDeck, { action, type KeyDownEvent, type SendToPluginEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";

import type { GlobalSettings, PlaySoundSettings } from "../settings";
import { describeStatus, isSupported, type SoundService } from "../sound-service";

/** Plays the key's sound file through the Voicemeeter player (headphones + virtual mic). */
@action({ UUID: "de.atacama-blooms.soundboard.play" })
export class PlaySound extends SingletonAction<PlaySoundSettings> {
	constructor(private readonly sounds: SoundService) {
		super();
	}

	override async onKeyDown(ev: KeyDownEvent<PlaySoundSettings>): Promise<void> {
		const global = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		const result = this.sounds.play(ev.payload.settings, global);
		if (!result.ok) {
			streamDeck.logger.warn(`Play failed (${result.reason}): ${result.message}`);
			await ev.action.showAlert();
		}
	}

	/** The property inspector asks for the Voicemeeter status when it opens. */
	override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, PlaySoundSettings>): Promise<void> {
		if (isStatusRequest(ev.payload)) {
			const status = this.sounds.status();
			await streamDeck.ui.sendToPropertyInspector({
				type: "status",
				ok: isSupported(status),
				status,
				message: describeStatus(status),
			});
		}
	}
}

function isStatusRequest(payload: JsonValue): boolean {
	return typeof payload === "object" && payload !== null && !Array.isArray(payload) && payload.type === "getStatus";
}
