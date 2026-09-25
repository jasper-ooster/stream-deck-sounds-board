import { existsSync } from "node:fs";

import streamDeck from "@elgato/streamdeck";

import { PlaySound } from "./actions/play-sound";
import { StopSound } from "./actions/stop-sound";
import { describeStatus, SoundService } from "./sound-service";
import { RemoteVoicemeeter } from "./voicemeeter/remote";

streamDeck.logger.setLevel("debug");

const voicemeeter = new RemoteVoicemeeter((level, message) => streamDeck.logger[level](`[voicemeeter] ${message}`));
const sounds = new SoundService(voicemeeter, existsSync);

streamDeck.actions.registerAction(new PlaySound(sounds));
streamDeck.actions.registerAction(new StopSound(sounds));

// Log in to Voicemeeter early: parameters set right after login can get lost.
streamDeck.logger.info(`Startup: ${describeStatus(sounds.status())}`);

process.on("exit", () => voicemeeter.dispose());

streamDeck.connect();
