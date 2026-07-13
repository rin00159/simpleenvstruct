import { expect, test } from "bun:test";
import { type EnvStruct, type EnvVarSpec, parseEnv } from "../src/index.ts";

const spec = [
	{ key: "VITE_FIREBASE_API_KEY", as: "apiKey" },
	{ key: "VITE_FIREBASE_PROJECT_ID", as: "projectId" },
	{ key: "VITE_FIRESTORE_EMULATOR_HOST", as: "emulatorHost" },
] as const satisfies EnvVarSpec[];

test("renames keys to `as` (the source key does not survive into the result)", () => {
	const config = parseEnv(spec, {
		VITE_FIREBASE_API_KEY: "abc",
		VITE_FIREBASE_PROJECT_ID: "demo-app",
		VITE_FIRESTORE_EMULATOR_HOST: "localhost:8080",
	});

	expect(config).toEqual({
		apiKey: "abc",
		projectId: "demo-app",
		emulatorHost: "localhost:8080",
	});
});

test("drops unset values entirely", () => {
	const config = parseEnv(spec, { VITE_FIREBASE_API_KEY: "abc" });

	expect(config).toEqual({ apiKey: "abc" });
	expect("emulatorHost" in config).toBe(false);
});

test("treats an empty string as unset", () => {
	const config = parseEnv(spec, {
		VITE_FIREBASE_API_KEY: "abc",
		VITE_FIRESTORE_EMULATOR_HOST: "",
	});

	expect(config).toEqual({ apiKey: "abc" });
});

test("ignores keys that are not in the spec", () => {
	const config = parseEnv(spec, {
		VITE_FIREBASE_API_KEY: "abc",
		AWS_SECRET_ACCESS_KEY: "leaked",
	});

	expect(config).toEqual({ apiKey: "abc" });
});

test("returns an empty object for an empty spec", () => {
	expect(parseEnv([], { VITE_FIREBASE_API_KEY: "abc" })).toEqual({});
});

// ─── `as` omitted ───

const bareSpec = [
	{ key: "HOME" },
	{ key: "PORT" },
	{ key: "USER", as: "user" },
] as const satisfies EnvVarSpec[];

test("falls back to `key` as the property name when `as` is omitted", () => {
	const config = parseEnv(bareSpec, {
		HOME: "/Users/rin",
		PORT: "3000",
		USER: "rin",
	});

	expect(config).toEqual({ HOME: "/Users/rin", PORT: "3000", user: "rin" });
});

// ─── Type-level tests (a passing typecheck is the assertion) ───

type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;
type Expect<T extends true> = T;

type _StructKeysAreAliases = Expect<
	Equal<
		EnvStruct<typeof spec>,
		{ apiKey?: string; projectId?: string; emulatorHost?: string }
	>
>;

type _StructFallsBackToKey = Expect<
	Equal<
		EnvStruct<typeof bareSpec>,
		{ HOME?: string; PORT?: string; user?: string }
	>
>;

test("type: a renamed key is not reachable under its source name", () => {
	const config = parseEnv(spec, {});

	// @ts-expect-error the result is keyed by `as` only
	config.VITE_FIREBASE_API_KEY;
	// @ts-expect-error names outside the spec do not exist
	config.nonExistent;

	expect(config).toEqual({});
});
