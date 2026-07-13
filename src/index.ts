/**
 * One declared value. The value read at `key` is returned under the name `as`.
 * When `as` is omitted, `key` itself becomes the property name in the result.
 */
export type EnvVarSpec = {
	/** Key to read from the source (e.g. "VITE_FIREBASE_API_KEY") */
	key: string;
	/** Property name in the result (e.g. "apiKey"). Defaults to `key` */
	as?: string;
};

/** The source to read from. `process.env` and `import.meta.env` can be passed as-is */
export type EnvSource = Record<string, string | undefined>;

/** Property name in the result for a single spec entry */
type NameOf<S extends EnvVarSpec> = S extends { as: string }
	? S["as"]
	: S["key"];

/**
 * Builds the struct type from the spec array.
 * Unresolved values are dropped entirely, so every property is optional.
 */
export type EnvStruct<T extends readonly EnvVarSpec[]> = {
	[S in T[number] as NameOf<S>]: string;
} extends infer O
	? { [P in keyof O]?: O[P] }
	: never;

/**
 * Reads values per the spec and returns them as a struct keyed by `as` (or `key` when omitted).
 * Values that are unset or empty are dropped from the result; this never throws.
 * Enforcing required keys is the caller's job.
 */
export function parseEnv<const T extends readonly EnvVarSpec[]>(
	spec: T,
	env: EnvSource,
): EnvStruct<T> {
	const result: Record<string, string> = {};

	for (const { key, as } of spec) {
		const value = env[key];
		if (value !== undefined && value !== "") {
			result[as ?? key] = value;
		}
	}

	return result as EnvStruct<T>;
}
