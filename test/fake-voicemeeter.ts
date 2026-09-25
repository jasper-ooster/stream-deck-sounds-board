import type { Bus, Routing, VoicemeeterPlayer, VoicemeeterStatus } from "../src/voicemeeter/types";

/** Records every call so tests can assert on order and arguments. */
export class FakeVoicemeeter implements VoicemeeterPlayer {
	calls: string[] = [];
	failOn: string | undefined;

	constructor(public currentStatus: VoicemeeterStatus = "banana") {}

	status(): VoicemeeterStatus {
		return this.currentStatus;
	}

	stop(): void {
		this.#record("stop");
	}

	setRouting(buses: readonly Bus[], routing: Routing): void {
		this.#record(`routing ${buses.map((b) => `${b}=${routing[b] ? 1 : 0}`).join(",")}`);
	}

	setGain(db: number): void {
		this.#record(`gain ${db}`);
	}

	load(file: string): void {
		this.#record(`load ${file}`);
	}

	play(): void {
		this.#record("play");
	}

	#record(call: string): void {
		if (this.failOn && call.startsWith(this.failOn)) {
			throw new Error(`${this.failOn} failed`);
		}
		this.calls.push(call);
	}
}
