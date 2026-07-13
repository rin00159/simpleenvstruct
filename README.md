# simpleenvstruct

Read values out of a flat string map into a typed struct, following a declarative spec.

The intended use — the one it is named and designed for — is **environment variables**:
renaming `SCREAMING_SNAKE_CASE` keys into the property names your code actually wants,
and getting a precise TypeScript type for the result. Nothing in the implementation is
specific to them, though. The source is just a `Record<string, string | undefined>`, so
`process.env`, `import.meta.env`, a parsed `.env`, or any flat string map works the same.

One file, zero dependencies, no globals.

```ts
import { parseEnv, type EnvVarSpec } from "simpleenvstruct";

const spec = [
  { key: "VITE_FIREBASE_API_KEY", as: "apiKey" },
  { key: "VITE_FIREBASE_PROJECT_ID", as: "projectId" },
  { key: "VITE_FIRESTORE_EMULATOR_HOST", as: "emulatorHost" },
] as const satisfies EnvVarSpec[];

const config = parseEnv(spec, import.meta.env);
//    ^? { apiKey?: string; projectId?: string; emulatorHost?: string }

initializeApp({ apiKey: config.apiKey, projectId: config.projectId });
```

`as` is optional. Omit it and the key is used as the property name as-is:

```ts
const config = parseEnv([{ key: "PORT" }, { key: "HOME" }] as const, process.env);
//    ^? { PORT?: string; HOME?: string }
```

`as const satisfies EnvVarSpec[]` is what makes the names survive into the type.
Without `as const` the spec widens to `string` and you get `{}`.

## Install

```sh
npm install simpleenvstruct   # or: pnpm add simpleenvstruct
```

## API

### `parseEnv(spec, env)`

| Param  | Type                                  | Meaning                                                        |
| ------ | ------------------------------------- | -------------------------------------------------------------- |
| `spec` | `readonly EnvVarSpec[]`               | `{ key, as? }` entries — `as` is the output property name       |
| `env`  | `Record<string, string \| undefined>` | The source: `process.env`, `import.meta.env`, or a plain object |

Returns an object keyed by `as`, falling back to `key` where `as` is omitted.

The source is always an explicit argument — the library never reaches for `process.env`
or `import.meta` on its own, so the same build runs in Node, in the browser, and in tests
where you hand it a fixture object.

### Behavior

- A value that is **unset or an empty string is omitted from the result entirely** —
  `parseEnv` never throws. Every property is therefore optional in the returned type.
- Keys that are not in the spec are ignored, so unrelated secrets sitting in `process.env`
  can't leak into the struct by accident.
- Values are returned as-is: no trimming, no coercion to number/boolean, no parsing.

### `EnvVarSpec` / `EnvStruct<T>` / `EnvSource`

```ts
type EnvVarSpec = { key: string; as?: string };
type EnvSource = Record<string, string | undefined>;
type EnvStruct<T extends readonly EnvVarSpec[]>; // the struct type parseEnv returns
```

Use `EnvStruct<typeof spec>` when you want to name the config type in a signature.

## Non-goals

Required-key enforcement, default values, `.env` file loading, and type coercion are all
deliberately absent — they are what makes a library like this grow. Validate what you need
at the call site:

```ts
const config = parseEnv(spec, process.env);
if (!config.apiKey) throw new Error("VITE_FIREBASE_API_KEY is not set");
```

If you want required / default / fallback declarations handled *inside* the spec, use
[envstruct](https://www.npmjs.com/package/envstruct) instead — same spec shape, one level up.

## Development

Built with [Bun](https://bun.sh). `tsc` is used only to emit `dist` and the `.d.ts`.

```sh
bun install
bun test          # unit tests
bun run typecheck # includes the type-level tests in test/
bun run build     # emit dist/
```

## License

MIT

---

# simpleenvstruct（日本語）

宣言的な spec に従って、フラットな文字列マップから値を読み出し、型のついた構造体にして返す。

**主に想定している用途は環境変数**で、名前も設計もそこに合わせてある。
`VITE_FIREBASE_API_KEY` のようなキー名を、コード側で使いたいプロパティ名（`apiKey`）に
付け替え、その結果に正確な TypeScript の型を与える。
ただし実装に環境変数固有の処理はない。読み出し元は `Record<string, string | undefined>` に
過ぎないので、`process.env` でも `import.meta.env` でも、パース済みの `.env` でも、
任意のフラットな文字列マップでも同じように動く。

1ファイル・依存ゼロ・グローバル参照なし。

```ts
const spec = [
  { key: "VITE_FIREBASE_API_KEY", as: "apiKey" },
  { key: "VITE_FIRESTORE_EMULATOR_HOST", as: "emulatorHost" },
] as const satisfies EnvVarSpec[];

const config = parseEnv(spec, import.meta.env);
// 型: { apiKey?: string; emulatorHost?: string }
```

`as` は省略可能で、省いた場合は `key` がそのままプロパティ名になる。

```ts
const config = parseEnv([{ key: "PORT" }, { key: "HOME" }] as const, process.env);
// 型: { PORT?: string; HOME?: string }
```

`as const satisfies EnvVarSpec[]` を付けることで名前がリテラル型として型に残る。
`as const` がないと spec が `string` に広がり、結果の型は `{}` になる。

## 振る舞い

- **未設定・空文字列の値はキーごと省く。throw はしない。** そのため返り値の全プロパティが optional。
- spec にないキーは無視するので、`process.env` の無関係な秘密情報が構造体に紛れ込まない。
- 値は加工しない（trim もしないし、number/boolean への変換もしない）。
- 読み出し元は必ず引数で渡す。ライブラリ側からグローバルを触らないため、Node・ブラウザ・
  テスト（フィクスチャを渡す）で同じコードが動く。

## やらないこと

必須チェック・デフォルト値・`.env` の読み込み・型変換は意図的に持たない。必要なら呼び出し側で書く。

```ts
const config = parseEnv(spec, process.env);
if (!config.apiKey) throw new Error("VITE_FIREBASE_API_KEY is not set");
```

必須・デフォルト・フォールバックを spec の中で宣言したい場合は
[envstruct](https://www.npmjs.com/package/envstruct) を使う（spec の形は同じで、一段上）。
