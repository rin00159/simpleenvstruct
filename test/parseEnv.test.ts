import { expect, test } from "bun:test";
import { type EnvStruct, type EnvVarSpec, parseEnv } from "../src/index.ts";

const spec = [
	{ as: "apiKey", key: "VITE_FIREBASE_API_KEY" },
	{ as: "projectId", key: "VITE_FIREBASE_PROJECT_ID" },
	{ as: "emulatorHost", key: "VITE_FIRESTORE_EMULATOR_HOST" },
] as const satisfies EnvVarSpec[];

test("`as` の名前で詰め直す(環境変数のキー名は結果に残らない)", () => {
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

test("未設定の変数はキーごと省く", () => {
	const config = parseEnv(spec, { VITE_FIREBASE_API_KEY: "abc" });

	expect(config).toEqual({ apiKey: "abc" });
	expect("emulatorHost" in config).toBe(false);
});

test("空文字列は未設定として扱う", () => {
	const config = parseEnv(spec, {
		VITE_FIREBASE_API_KEY: "abc",
		VITE_FIRESTORE_EMULATOR_HOST: "",
	});

	expect(config).toEqual({ apiKey: "abc" });
});

test("spec にない環境変数は無視する", () => {
	const config = parseEnv(spec, {
		VITE_FIREBASE_API_KEY: "abc",
		AWS_SECRET_ACCESS_KEY: "leaked",
	});

	expect(config).toEqual({ apiKey: "abc" });
});

test("spec が空なら空オブジェクト", () => {
	expect(parseEnv([], { VITE_FIREBASE_API_KEY: "abc" })).toEqual({});
});

// ─── 型レベルのテスト(typecheck が通ること自体が検証) ───

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

test("型: 環境変数のキー名ではアクセスできない", () => {
	const config = parseEnv(spec, {});

	// @ts-expect-error 結果のキーは `as` の別名のみ
	config.VITE_FIREBASE_API_KEY;
	// @ts-expect-error spec にない別名は生えない
	config.nonExistent;

	expect(config).toEqual({});
});
