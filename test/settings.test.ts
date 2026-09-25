import { describe, expect, it } from "vitest";

import { volumeToDb } from "../src/settings";

describe("volumeToDb", () => {
	it.each([
		[100, 0],
		[50, -6],
		[25, -12],
		[10, -20],
		[0, -60],
		[undefined, 0],
		[150, 0],
		[-5, -60],
	])("maps %s %% to %s dB", (volume, db) => {
		expect(volumeToDb(volume)).toBe(db);
	});
});
