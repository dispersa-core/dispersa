# Multi-Platform Design Tokens

One source of truth, four platform outputs. This example demonstrates how a single set of [Adobe Spectrum](https://spectrum.adobe.com/) design tokens can be transformed by Dispersa into CSS custom properties, Tailwind v4 `@theme`, SwiftUI (Swift), and Jetpack Compose (Kotlin).

> **Note:** The iOS (SwiftUI) and Android (Jetpack Compose) output targets are **experimental**. Their APIs and generated code may change in future releases.

## Token Source

All values are sourced from the public [adobe/spectrum-design-data](https://github.com/adobe/spectrum-design-data) repository and translated to DTCG format. The token set covers:

- **Colors** — Gray, blue, red, green, orange palettes with light/dark variants
- **Semantic aliases** — Accent, negative, positive, notice, neutral, disabled, focus, text, border
- **Spacing** — 2px–40px scale
- **Typography** — Font families, weights, sizes
- **Layout** — Corner radii, border widths
- **Shadows** — Three elevation levels
- **Motion** — Duration scale

## Quick Start

```bash
# From this directory:
pnpm install
pnpm build
```

This generates four outputs in `output/`:

| File                              | Platform       | Format                      |
| --------------------------------- | -------------- | --------------------------- |
| `web/tokens.css`                  | Web            | CSS custom properties       |
| `tailwind/theme.css`              | Web + Tailwind | Tailwind v4 `@theme` block  |
| `ios/DesignTokens-{theme}.swift`  | iOS            | SwiftUI `Color`, `CGFloat`  |
| `android/DesignTokens-{theme}.kt` | Android        | Compose `Color`, `Dp`, `Sp` |

## Preview Apps

Each platform has a visual preview app in `previews/`. Use the `preview:*` scripts to build tokens and launch the preview in a single command.

### Web (CSS Custom Properties)

```bash
pnpm preview:web
```

Builds tokens, then opens a Vite dev server with a Spectrum-inspired showcase page. Uses `var(--token-name)` for all styling. Toggle dark mode with the button in the header.

If you've already built and just want to (re)start the dev server: `pnpm dev:web`.

**Prerequisites:** Node.js

### Tailwind v4

```bash
pnpm preview:tailwind
```

Builds tokens, then opens a Vite dev server. Same showcase, built entirely with Tailwind utility classes referencing the generated `@theme` variables.

If you've already built: `pnpm dev:tailwind`.

**Prerequisites:** Node.js

### iOS (SwiftUI)

```bash
pnpm preview:ios
```

Builds tokens, copies the generated Swift file into the preview project, and opens `Package.swift` in Xcode. Use the SwiftUI canvas (Editor > Canvas, or `⌥⌘↩`) to see the `#Preview` live.

NavigationStack with color swatches, spacing bars, and shadow cards using `SpectrumTokens.Colors.*` and `SpectrumTokens.Spacing.*`.

To verify compilation without Xcode: `pnpm verify:ios`.

**Prerequisites:** macOS, Xcode 15+ (or Xcode Command Line Tools for compile-only)

### Android (Jetpack Compose)

```bash
pnpm preview:android
```

Builds tokens, copies the generated Kotlin file into the preview project, and opens it in Android Studio. Use the Compose `@Preview` pane (split editor view) to see `TokenShowcasePreview` without running an emulator.

LazyColumn with color cards, spacing bars, and shadow elevation cards using `SpectrumTokens.Colors.*` and `SpectrumTokens.Spacing.*`.

To verify compilation without Android Studio: `pnpm verify:android`.

**Prerequisites:** JDK 17+, Android SDK, Android Studio

## Project Structure

```
multi-platform/
├── build.ts                   # Dispersa build → 4 outputs
├── tokens.resolver.json       # DTCG resolver config
├── tokens/
│   ├── base.json              # Primitives (colors, spacing, type, layout, shadows, motion)
│   ├── alias.json             # Semantic aliases
│   └── themes/
│       ├── light.json         # Light theme (identity — base is light)
│       └── dark.json          # Dark overrides
├── output/                    # Generated (gitignored)
│   ├── web/tokens.css
│   ├── tailwind/theme.css
│   ├── ios/DesignTokens-{theme}.swift
│   └── android/DesignTokens-{theme}.kt
└── previews/
    ├── web/                   # Vite (vanilla HTML/CSS)
    ├── tailwind/              # Vite + Tailwind v4
    ├── ios/                   # Swift Package + SwiftUI
    └── android/               # Gradle + Jetpack Compose
```

## Key Decisions

- **One example, not four** — a single directory drives home the "single source of truth" value proposition
- **Real Spectrum values** — all values from `adobe/spectrum-design-data`, not invented
- **Generated files are gitignored** — run `pnpm build` to regenerate
- **Copy scripts for native** — iOS and Android need token files in specific source directories, so `copy-tokens.sh` scripts handle that
- **Tailwind v4 only** — the renderer targets v4's native `@theme` block
