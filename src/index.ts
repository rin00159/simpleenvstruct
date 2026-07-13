/** 環境変数1件のマッピング。`key` の環境変数を、結果では `as` の名前で受け取る */
export type EnvVarSpec = {
	/** 結果オブジェクト側のプロパティ名 (例: "apiKey") */
	as: string;
	/** 読み出す環境変数のキー名 (例: "VITE_FIREBASE_API_KEY") */
	key: string;
};

/** 環境変数の入力元。`process.env` や `import.meta.env` をそのまま渡せる */
export type EnvSource = Record<string, string | undefined>;

/**
 * spec 配列から、`as` をプロパティ名とする構造体型を組み立てる。
 * 未設定の環境変数はキーごと省かれるため、全プロパティが optional になる。
 */
export type EnvStruct<T extends readonly EnvVarSpec[]> = {
	[K in T[number] as K["as"]]: string;
} extends infer O
	? { [P in keyof O]?: O[P] }
	: never;

/**
 * spec に沿って環境変数を読み出し、`as` を名前とする構造体にして返す。
 * 未設定・空文字列の変数はキーごと省く(throw しない)。必須チェックは呼び出し側の責務。
 */
export function parseEnv<const T extends readonly EnvVarSpec[]>(
	spec: T,
	env: EnvSource,
): EnvStruct<T> {
	const result: Record<string, string> = {};

	for (const { as, key } of spec) {
		const value = env[key];
		if (value !== undefined && value !== "") {
			result[as] = value;
		}
	}

	return result as EnvStruct<T>;
}
