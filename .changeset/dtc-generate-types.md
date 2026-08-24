---
'dispersa': minor
---

Fix `generateTypes` type mapping to reflect real DTCG value shapes, add in-memory `renderTypes()`, and wire a `types` build config into `dispersa build`.

- **Generated value types now reference the real DTCG value types** (`ColorValueObject`, `DimensionValue`, `DurationValue`, `TypographyValue`, `BorderValue`, `StrokeStyleValue`, `TransitionValue`, `GradientValue`, `ShadowValue`, `FontFamilyValue`, `FontWeightValue`) emitted via an `import type { ... } from 'dispersa'` statement, instead of a blanket `string`. Token names and structure keys are emitted in sorted order for stable, deterministic diffs.
- **Behavior change for existing `generateTypes()` callers:** the hardcoded `includeValues: true` was removed. `generateTypes(tokens, file, options)` now honors `TypeGeneratorOptions` (`exportType`, `includeValues`, `moduleName`) and defaults `includeValues` to `false` like `TypeGenerator` does. Existing callers relying on value types in the `.d.ts` should pass `includeValues: true`.
- **New `renderTypes(tokens, options?)` function** (exported from the package root) renders the definitions in memory without any file I/O.
- **New `types` key on `BuildConfig`** (`{ file, modifierInputs?, exportType?, includeValues?, moduleName? }`) emits a `.d.ts` during `dispersa build`. It resolves tokens through an independent, transform-free pipeline call, so DTCG-shaped types stay accurate even when global `transforms`/`filters` are configured. `modifierInputs` selects a specific permutation; omitted, the base permutation is used. The file is reported in the build/CLI output like any other output.
