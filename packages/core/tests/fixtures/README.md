# Test Fixtures

This directory contains comprehensive test fixtures that demonstrate all features of the DTCG specification (2025.10).

## Structure

### Resolver File

- `tokens.resolver.json` - Main resolver configuration with:
  - Two sets: `base` (primitives) and `semantic` (aliases)
  - Two modifiers: `theme` (light/dark) and `scale` (mobile/tablet/desktop)
  - Resolution order that applies base → scale → theme → semantic

### Token Files

#### Base Tokens

- `tokens/colors.json` - Color tokens in hex, rgb, and hsl formats with aliases
- `tokens/dimensions.json` - Dimensions in px and rem units
- `tokens/typography.json` - Font families, weights, sizes, and composite typography tokens
- `tokens/spacing.json` - Spacing scale with semantic aliases
- `tokens/shadows.json` - Shadow tokens (single and multiple)
- `tokens/borders.json` - Border composite tokens
- `tokens/effects.json` - Duration, cubic-bezier, gradient, and opacity tokens
- `tokens/semantic.json` - Semantic layer with deep alias chains

#### Modifier Context Tokens

##### Theme Modifier

- `tokens/theme-light.json` - Light theme overrides (white background, dark text)
- `tokens/theme-dark.json` - Dark theme overrides (dark background, light text)

##### Scale Modifier

- `tokens/scale-mobile.json` - Mobile-specific sizing (smaller fonts and spacing)
- `tokens/scale-desktop.json` - Desktop-specific sizing (larger fonts and spacing)

## Features Demonstrated

### Token Types

All DTCG token types are included:

- ✅ Color (hex, rgb, hsl)
- ✅ Dimension (px, rem, vh, vw, em)
- ✅ Font Family (string and array)
- ✅ Font Weight (numeric and named)
- ✅ Duration (ms, s)
- ✅ Cubic Bezier
- ✅ Number
- ✅ Stroke Style
- ✅ Typography (composite)
- ✅ Border (composite)
- ✅ Shadow (single and multiple)
- ✅ Gradient

### Resolver Features

- ✅ Sets with multiple source files
- ✅ Modifiers with multiple contexts
- ✅ Default values for modifiers
- ✅ File references ($ref with relative paths)
- ✅ JSON Pointer references ($ref with #/)
- ✅ Resolution order (sets and modifiers)
- ✅ Token merging (last-wins strategy)

### Alias Features

- ✅ Simple aliases ({token.name})
- ✅ Deep alias chains (alias → alias → value)
- ✅ Aliases in composite tokens
- ✅ Aliases across modifier contexts

## Permutations

The resolver can generate 6 permutations:

1. theme=light, scale=mobile
2. theme=light, scale=tablet (default scale)
3. theme=light, scale=desktop
4. theme=dark, scale=mobile
5. theme=dark, scale=tablet
6. theme=dark, scale=desktop

## Usage in Tests

```typescript
import { Dispersa } from 'dispersa'
import * as path from 'node:path'

const fixturesDir = path.join(__dirname, 'fixtures')
const resolverPath = path.join(fixturesDir, 'tokens.resolver.json')

// Resolve with specific modifiers
const tokens = await dispersa.resolveTokens(resolverPath, {
  theme: 'dark',
  scale: 'mobile',
})

// Generate all permutations
const engine = new ResolutionEngine(resolver, refResolver)
const permutations = engine.generatePermutations()
```
