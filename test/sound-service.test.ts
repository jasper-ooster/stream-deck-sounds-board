import { beforeEach, describe, expect, it } from "vitest";

import { SoundService } from "../src/sound-service";
import { FakeVoicemeeter } from "./fake-voicemeeter";

const FILE = "C:\\Sounds\\applaus.mp3";

describe("SoundService.play", () => {
	let vm: FakeVoicemeeter;
	let existing: Set<string>;
	let service: SoundService;

	beforeEach(() => {
		vm = new FakeVoicemeeter("banana");
		existing = new Set([FILE]);
		service = new SoundService(vm, (p) => existing.has(p));
	});

	it("stops, enforces routing, sets gain, loads and plays – in this order", () => {
		const result = service.play({ file: FILE, volume: 100 }, undefined);

		expect(result).toEqual({ ok: true });
		expect(vm.calls).toEqual(["stop", "routing A1=1,A2=0,A3=0,B1=1,B2=0", "gain 0", `load ${FILE}`, "play"]);
	});

	it("uses the globally configured buses", () => {
		service.play({ file: FILE }, { buses: { A2: true, B2: true } });

		expect(vm.calls[1]).toBe("routing A1=0,A2=1,A3=0,B1=0,B2=1");
	});

	it("falls back to A1 + B1 when all buses are switched off", () => {
		service.play({ file: FILE }, { buses: { A1: false, B1: false } });

		expect(vm.calls[1]).toBe("routing A1=1,A2=0,A3=0,B1=1,B2=0");
	});

	it("switches off the extra Potato buses", () => {
		vm.currentStatus = "potato";
		service.play({ file: FILE }, undefined);

		expect(vm.calls[1]).toBe("routing A1=1,A2=0,A3=0,A4=0,A5=0,B1=1,B2=0,B3=0");
	});

	it("maps the volume to gain", () => {
		service.play({ file: FILE, volume: 50 }, undefined);

		expect(vm.calls[2]).toBe("gain -6");
	});

	it("replaces a running sound on every press", () => {
		service.play({ file: FILE }, undefined);
		service.play({ file: FILE }, undefined);

		expect(vm.calls.filter((c) => c === "stop")).toHaveLength(2);
		expect(vm.calls.at(-1)).toBe("play");
	});

	it.each(["notInstalled", "notRunning", "standard"] as const)("refuses to play when Voicemeeter is %s", (status) => {
		vm.currentStatus = status;

		const result = service.play({ file: FILE }, undefined);

		expect(result).toMatchObject({ ok: false, reason: status });
		expect(vm.calls).toEqual([]);
	});

	it("reports a missing file setting", () => {
		expect(service.play({}, undefined)).toMatchObject({ ok: false, reason: "noFile" });
		expect(service.play({ file: "  " }, undefined)).toMatchObject({ ok: false, reason: "noFile" });
		expect(vm.calls).toEqual([]);
	});

	it("reports a file that does not exist", () => {
		const result = service.play({ file: "C:\\gone.mp3" }, undefined);

		expect(result).toMatchObject({ ok: false, reason: "fileNotFound" });
		expect(vm.calls).toEqual([]);
	});

	it("turns API errors into a failed result", () => {
		vm.failOn = "load";

		expect(service.play({ file: FILE }, undefined)).toMatchObject({ ok: false, reason: "error" });
	});
});

describe("SoundService.stop", () => {
	it("stops the player", () => {
		const vm = new FakeVoicemeeter("banana");

		expect(new SoundService(vm, () => true).stop()).toEqual({ ok: true });
		expect(vm.calls).toEqual(["stop"]);
	});

	it("fails when Voicemeeter is not running", () => {
		const vm = new FakeVoicemeeter("notRunning");

		expect(new SoundService(vm, () => true).stop()).toMatchObject({ ok: false, reason: "notRunning" });
		expect(vm.calls).toEqual([]);
	});
});
