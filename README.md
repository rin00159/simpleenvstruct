# simpleenvstruct

Read environment variables into a typed struct from a declarative spec.

One file, zero dependencies, no globals. It renames `SCREAMING_SNAKE_CASE` env keys
into the property names your code actually wants to use, and gives you a precise
TypeScript type for the result — nothing more.

```ts
import { parseEnv, type EnvVarSpec } from "simpleenvstruct";

const spec = [
  { as: "apiKey", key: "VITE_FIREBASE_API_KEY" },
  { as: "projectId", key: "VITE_FIREBASE_PROJECT_ID" },
  { as: "emulatorHost", key: "VITE_FIRESTORE_EMULATOR_HOST" },
] as const satisfies EnvVarSpec[];

const config = parseEnv(spec, import.meta.env);
//    ^? { apiKey?: string; projectId?: string; emulatorHost?: string }

initializeApp({ apiKey: config.apiKey, projectId: config.projectId });
```

`as const satisfies EnvVarSpec[]` is what makes the alias names survive into the
type. Without `as const` the spec widens to `string` and you get `{}`.

## Install

```sh
npm install simpleenvstruct   # or: pnpm add simpleenvstruct
```

## API

### `parseEnv(spec, env)`

| Param  | Type                              | Meaning                                                     |
| ------ | --------------------------------- | ----------------------------------------------------------- |
| `spec` | `readonly EnvVarSpec[]`           | Mappings of `{ as, key }` — `as` is the output property name |
| `env`  | `Record<string, string \| undefined>` | The source: `process.env`, `import.meta.env`, or a plain object |

Returns an object whose keys are the `as` names.

The `env` source is always an explicit argument — the library never touches
`process.env` or `import.meta` on its own, so the same build works in Node, in the
browser, and in tests where you hand it a fixture object.

### Behavior

- A variable that is **unset or an empty string is omitted from the result entirely** —
  `parseEnv` never throws. Every property is therefore optional in the returned type.
- Env keys that are not in the spec are ignored, so unrelated secrets in `process.env`
  can't leak into the struct by accident.
- Values are returned as-is: no trimming, no coercion to number/boolean, no parsing.

### `EnvVarSpec` / `EnvStruct<T>` / `EnvSource`

```ts
type EnvVarSpec = { as: string; key: string };
type EnvSource = Record<string, string | undefined>;
type EnvStruct<T extends readonly EnvVarSpec[]>; // the struct type parseEnv returns
```

Use `EnvStruct<typeof spec>` when you want to name the config type in a signature.

## Non-goals

Required-key enforcement, default values, `.env` file loading, and type coercion are all
deliberately absent — they are what makes an env library grow. Validate what you need at
the call site:

```ts
const config = parseEnv(spec, process.env);
if (!config.apiKey) throw new Error("VITE_FIREBASE_API_KEY is not set");
```

If you want required/default/fallback declarations handled *inside* the spec, this
library is the wrong size for you.

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

宣言的な spec から環境変数を読み出し、型のついた構造体にして返すだけのライブラリ。
1ファイル・依存ゼロ・グローバル参照なし。

`VITE_FIREBASE_API_KEY` のような環境変数のキー名を、コード側で使いたいプロパティ名
（`apiKey`）に付け替え、その結果に正確な TypeScript の型を与える。それ以上のことはしない。

```ts
const spec = [
  { as: "apiKey", key: "VITE_FIREBASE_API_KEY" },
  { as: "emulatorHost", key: "VITE_FIRESTORE_EMULATOR_HOST" },
] as const satisfies EnvVarSpec[];

const config = parseEnv(spec, import.meta.env);
// 型: { apiKey?: string; emulatorHost?: string }
```

`as const satisfies EnvVarSpec[]` を付けることで別名がリテラル型として型に残る。
`as const` がないと spec が `string` に広がり、結果の型は `{}` になる。

## 振る舞い

- **未設定・空文字列の変数はキーごと省く。throw はしない。** そのため返り値の全プロパティが optional。
- spec にない環境変数は無視するので、`process.env` の無関係な秘密情報が構造体に紛れ込まない。
- 値は加工しない（trim もしないし、number/boolean への変換もしない）。
- 入力元（`process.env` / `import.meta.env`）は必ず引数で渡す。ライブラリ側からグローバルを
  触らないため、Node・ブラウザ・テスト（フィクスチャを渡す）で同じコードが動く。

## やらないこと

必須チェック・デフォルト値・`.env` の読み込み・型変換は意図的に持たない。必要なら呼び出し側で書く。

```ts
const config = parseEnv(spec, process.env);
if (!config.apiKey) throw new Error("VITE_FIREBASE_API_KEY is not set");
```

必須・デフォルト・フォールバックを spec の中で宣言したい場合、このライブラリはサイズが合わない。
