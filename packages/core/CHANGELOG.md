# dispersa

## 1.6.0

### Minor Changes

- [#78](https://github.com/dispersa-core/dispersa/pull/78) [`2b89519`](https://github.com/dispersa-core/dispersa/commit/2b8951967220996c0d6391d564f1b338e325bd05) Thanks [@timges](https://github.com/timges)! - Fix `generateTypes` type mapping to reflect real DTCG value shapes, add in-memory `renderTypes()`, and wire a `types` build config into `dispersa build`.
  - **Generated value types now reference the real DTCG value types** (`ColorValueObject`, `DimensionValue`, `DurationValue`, `TypographyValue`, `BorderValue`, `StrokeStyleValue`, `TransitionValue`, `GradientValue`, `ShadowValue`, `FontFamilyValue`, `FontWeightValue`) emitted via an `import type { ... } from 'dispersa'` statement, instead of a blanket `string`. Token names and structure keys are emitted in sorted order for stable, deterministic diffs.
  - **Behavior change for existing `generateTypes()` callers:** the hardcoded `includeValues: true` was removed. `generateTypes(tokens, file, options)` now honors `TypeGeneratorOptions` (`exportType`, `includeValues`, `moduleName`) and defaults `includeValues` to `false` like `TypeGenerator` does. Existing callers relying on value types in the `.d.ts` should pass `includeValues: true`.
  - **New `renderTypes(tokens, options?)` function** (exported from the package root) renders the definitions in memory without any file I/O.
  - **New `types` key on `BuildConfig`** (`{ file, modifierInputs?, exportType?, includeValues?, moduleName? }`) emits a `.d.ts` during `dispersa build`. It resolves tokens through an independent, transform-free pipeline call, so DTCG-shaped types stay accurate even when global `transforms`/`filters` are configured. `modifierInputs` selects a specific permutation; omitted, the base permutation is used. The file is reported in the build/CLI output like any other output.

### Patch Changes

- [#71](https://github.com/dispersa-core/dispersa/pull/71) [`fa13f8c`](https://github.com/dispersa-core/dispersa/commit/fa13f8cc25f47d80902137bc108f4e5c83a43216) Thanks [@timges](https://github.com/timges)! - Fix inconsistent gamut mapping for wide-gamut color inputs. `colorToHsl` and `colorToHwb` now clamp to the sRGB gamut before formatting, so display-p3 (and other wide-gamut) reds resolve to the same color across hex/rgb/hsl/hwb instead of emitting divergent or invalid values (e.g. negative hwb percentages).

- [#76](https://github.com/dispersa-core/dispersa/pull/76) [`879bc8f`](https://github.com/dispersa-core/dispersa/commit/879bc8fe5a12252275507ce9218c9467500a2767) Thanks [@timges](https://github.com/timges)! - Align gradient stop `position` handling with DTCG Format §9.7: out-of-range values are now accepted during validation (schema keeps `type: number` only) and clamped to [0, 1] at render in the iOS, Android, CSS, and Tailwind renderers. Also repoint the create-dispersa scaffolder at `dispersa-core/dispersa` instead of the personal `timges/dispersa` fork.

- [#72](https://github.com/dispersa-core/dispersa/pull/72) [`571338f`](https://github.com/dispersa-core/dispersa/commit/571338f2f3df6dec206b36cb372674f11e28c44b) Thanks [@timges](https://github.com/timges)! - Enforce inherited group `$type` on child token values during validation. Tokens without a local `$type` under a typed group are now schema-validated against the inherited type, so a mismatched value (e.g. a dimension-shaped value in a `color` group) is rejected instead of silently passing. Alias references and token-level `$ref`s remain exempt from parse-time validation.

- [#69](https://github.com/dispersa-core/dispersa/pull/69) [`3e6892a`](https://github.com/dispersa-core/dispersa/commit/3e6892a6dba3ba8b6546c8f9b0973a5821f2b019) Thanks [@timges](https://github.com/timges)! - Resolve sibling array `$ref` elements sequentially so two array items referencing the same JSON pointer no longer throw a false "Circular reference detected" error (previously caused by concurrent `Promise.all` resolution over a shared visited-set).

- [#73](https://github.com/dispersa-core/dispersa/pull/73) [`7fc2c02`](https://github.com/dispersa-core/dispersa/commit/7fc2c024c0097d043946fe0010c21153f8102a95) Thanks [@timges](https://github.com/timges)! - Fix three processing bugs: case name transforms now derive from the current `token.name` instead of the original `path`, so `namePrefix`/`nameSuffix` compose correctly with `nameKebabCase` and friends; the `byPath` filter matches string patterns on segment boundaries instead of substrings (`byPath('color')` no longer matches `colors.blue`); and the `case-check` lint rule no longer re-applies a per-segment custom `pattern` to the full dotted token name, eliminating spurious `INVALID_FORMAT` reports.

- [#70](https://github.com/dispersa-core/dispersa/pull/70) [`4f611e8`](https://github.com/dispersa-core/dispersa/commit/4f611e87cde9a26a04388b790aae4d3b81742e29) Thanks [@timges](https://github.com/timges)! - Fix the `path-schema` lint rule rejecting its own documented multi-segment patterns. Literals in path patterns are now split on `.` into one part per segment at compile time, so patterns like `color.base.{brand}` and `color.semantic.{element}.{role}` match valid tokens instead of reporting `INVALID_PATH`.

- [#74](https://github.com/dispersa-core/dispersa/pull/74) [`ec90a4e`](https://github.com/dispersa-core/dispersa/commit/ec90a4eb4f426fabb54a467d3ffce8d2ec78b4a1) Thanks [@timges](https://github.com/timges)! - Fix public API/type hygiene and lint option validation. `LintResult`/`LintIssue` are now exported from the package root so `lint()`'s return type is importable from `dispersa`; the `tailwind()` builder now auto-injects `nameKebabCase()` like `css()` so both CSS-emitting builders case custom-property names identically; `lint()` validates its config against the lint config schema so an invalid rule severity (e.g. `'warning'`) throws a `ConfigurationError` instead of being silently counted as neither error nor warning; and the `case-check` rule throws on an unknown `format` (without a custom `pattern`) instead of silently validating against kebab-case.

- [#77](https://github.com/dispersa-core/dispersa/pull/77) [`52a5285`](https://github.com/dispersa-core/dispersa/commit/52a52855ab5a652bec72501720b16c0ee096ba29) Thanks [@timges](https://github.com/timges)! - Extract the `LintIssue` type to `shared/types/lint-issue` so `LintError.issues` no longer duplicates its shape inline. The lint module re-exports `LintIssue` from the shared type, keeping the public import path (`@lint/types` / `dispersa`) unchanged. No behavior change.

- [#67](https://github.com/dispersa-core/dispersa/pull/67) [`dbbd3b4`](https://github.com/dispersa-core/dispersa/commit/dbbd3b41efe2ef7872edd0b25754f02dda076366) Thanks [@timges](https://github.com/timges)! - Scale DTCG hsl and hwb percentage components (S/L, W/B, defined 0-100) to culori's 0-1 range in the color converter. hsl(210 50 40) now resolves to [#336699](https://github.com/timges/dispersa/issues/336699) and hwb(0 25 0) to #ff4040 across all output formats instead of #ffff00 / white.

- [#75](https://github.com/dispersa-core/dispersa/pull/75) [`cb9dfc5`](https://github.com/dispersa-core/dispersa/commit/cb9dfc5309705a3b8d5e142fd247056a0b923a35) Thanks [@timges](https://github.com/timges)! - Fix test type-safety: repoint 29 test files importing types from the removed `src/tokens` and `src/config` modules to the current homes (`@shared/token-types`, `@outputs/types`, `@engine/types`), and delete the dead `@tokens` path alias from tsconfig, vitest, and tsup configs.

## 1.5.0

### Minor Changes

- [#18](https://github.com/dispersa-core/dispersa/pull/18) [`1302020`](https://github.com/dispersa-core/dispersa/commit/13020205a68426f6571b1c45e3b8cf9d05290b3b) Thanks [@timges](https://github.com/timges)! - Surface detailed lint issues on build errors. `BuildError` now includes a `LINT` error code with a `lintIssues` array (rule id, severity, message, token name, and path), and the CLI prints each issue in verbose mode.

- [#18](https://github.com/dispersa-core/dispersa/pull/18) [`1302020`](https://github.com/dispersa-core/dispersa/commit/13020205a68426f6571b1c45e3b8cf9d05290b3b) Thanks [@timges](https://github.com/timges)! - `BuildResult` now includes an optional `lintResult` field, populated whenever `lint.enabled` is true (on both successful and failed builds), so consumers can inspect lint issues and counts programmatically instead of relying on `console.warn` output.

### Patch Changes

- [#26](https://github.com/dispersa-core/dispersa/pull/26) [`a7669b3`](https://github.com/dispersa-core/dispersa/commit/a7669b31911e5246d4da31e4b2ccbc9e5441ea59) Thanks [@timges](https://github.com/timges)! - Fix CSS renderer emitting unescaped `*/` in set and modifier description comments, which could terminate the comment early and corrupt the generated stylesheet.

## 1.4.0

### Minor Changes

- [`59f2d12`](https://github.com/dispersa-core/dispersa/commit/59f2d1249cd5c8fb78083c1fb5e7620f55db3d44) Thanks [@timges](https://github.com/timges)! - Improved the path based lint rule. Optional segments are now flagged via `{segment}?`. Further, support for logical OR was added for segments like `{segmentA|segmentB}`

- [`baccbbd`](https://github.com/dispersa-core/dispersa/commit/baccbbd4240bee14cab4eb55c00560657202a205) Thanks [@timges](https://github.com/timges)! - rename naming-conventions lint rule to case-check

## 1.3.0

### Minor Changes

- [`1a587ad`](https://github.com/dispersa-core/dispersa/commit/1a587ad19cf68968cbe94168fa1dbe0d63a58e93) Thanks [@timges](https://github.com/timges)! - rework and clean up project file and folder structure

## 1.2.0

### Minor Changes

- [`12a257a`](https://github.com/dispersa-core/dispersa/commit/12a257a9b211509e034e99f41bfab09736915992) Thanks [@timges](https://github.com/timges)! - fix lint issues:
  - finding duplication
  - skipped permutations

## 1.1.0

### Minor Changes

- [`e5a0e72`](https://github.com/dispersa-core/dispersa/commit/e5a0e721aacf1ec0ffc7d9976efd98a9b2be4f39) Thanks [@timges](https://github.com/timges)! - fix linting rule bugs

## 1.0.0

### Major Changes

- [`6db9b0e`](https://github.com/dispersa-core/dispersa/commit/6db9b0e1f0246ea9579812bf469d532a3e8a340c) Thanks [@timges](https://github.com/timges)! - - [BREAKING] rework dispersa api to be functional insted of class based. The classbased approach was unnecessary, cause consecutive builds with the same instance are unlikely + the state the instance holds is very little. Functional exposure improves the DX by a lot.

### Minor Changes

- [`6db9b0e`](https://github.com/dispersa-core/dispersa/commit/6db9b0e1f0246ea9579812bf469d532a3e8a340c) Thanks [@timges](https://github.com/timges)! - - introduce comprehensive linting api

- [`6db9b0e`](https://github.com/dispersa-core/dispersa/commit/6db9b0e1f0246ea9579812bf469d532a3e8a340c) Thanks [@timges](https://github.com/timges)! - - unifiy metadata rendering (description, deprecation, ...) and resolve inconsistencies between output targets

- [`6db9b0e`](https://github.com/dispersa-core/dispersa/commit/6db9b0e1f0246ea9579812bf469d532a3e8a340c) Thanks [@timges](https://github.com/timges)! - - improve path-schema linting rule. It's stable now and offers good performance [O(2 * n]) through DP processing

## 0.4.3

### Patch Changes

- - feat: made `nameKebabCase` default behavior since we were having a weird hybrid. `--` prefix was added but token was in dot notatin. Now it's proper css custom property syntax by default
  - feat: removed `nameCssVar` transformer, as it's not really needed at all
  - refactor: fixed som stale links in the docs

  this is actually breaking, but since we're still sub v1 we'll only do a `minor` bump

## 0.4.2

### Patch Changes

- - refactor and cleanup - update stale readmes

## 0.4.1

### Patch Changes

- fix missing type export

## 0.4.0

### Minor Changes

- [`81faacd`](https://github.com/dispersa-core/dispersa/commit/81faacdfdd26a7b112cf2880cb673364b7527b37) Thanks [@timges](https://github.com/timges)! - - implement `$root` stripping in token pipeline for clean DTCG group default values in output
  - replace semantic token layer with alias tokens across example starters

## 0.3.1

### Patch Changes

- update package metadata

## 0.3.0

### Minor Changes

- [`ad99ecd`](https://github.com/dispersa-core/dispersa/commit/ad99ecdf436eeafe24da56adb3ec1ff17b1b2027) Thanks [@timges](https://github.com/timges)! - - improve stability of inbuilt css output renderer
  - improve create script scaffold example

## 0.2.0

### Minor Changes

- [`61707da`](https://github.com/timges/dispersa/commit/61707da2e5eacc5eca5d939bb413238348be0736) Thanks [@timges](https://github.com/timges)! - implement experimental ios, android and tailwind output targets, add create script

## 0.1.3

### Patch Changes

- 2c9a814: update readme

## 0.1.2

### Patch Changes

- include readme

## 0.1.1

### Patch Changes

- first alpha release of Dispersa
