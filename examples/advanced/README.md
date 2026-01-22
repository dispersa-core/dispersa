# Advanced Example - Multi-Platform Design System

This example demonstrates the **Large Scale** Token Forge structure with base tokens, alias tokens, component tokens, multiple themes, and platform-specific delivery.

## What's Included

- **Base tokens** - Foundational values (colors, spacing, typography, effects)
- **Alias tokens** - Semantic references to base tokens
- **Component tokens** - Button and card component compositions
- **Theme modifiers** - Light, dark, and high-contrast themes
- **Platform modifiers** - Web, mobile, and desktop platform overrides
- **Multi-format output** - CSS (bundled), JSON (standalone), JS modules, Figma Variables
- **TypeScript types** - Auto-generated type definitions

## Project Structure

```
advanced/
├── tokens.resolver.json          # Resolver with theme + platform modifiers
├── tokens/
│   ├── base/                      # Base foundational values
│   │   ├── colors.json            # Color palette (all color spaces)
│   │   ├── spacing.json           # Spacing scale
│   │   ├── typography.json        # Font properties
│   │   ├── primitives.json        # Numbers, durations, easing
│   │   └── effects.json           # Shadow composite tokens
│   ├── alias/                     # Alias tokens (semantic references)
│   │   ├── colors.json            # Semantic color mappings
│   │   ├── spacing.json           # Semantic spacing
│   │   └── components/            # Component tokens
│   │       ├── button.json        # Button-specific tokens
│   │       └── card.json          # Card-specific tokens
│   └── modifiers/
│       ├── themes/                # Theme variations
│       │   ├── light.json
│       │   ├── dark.json
│       │   └── high-contrast.json
│       └── platforms/             # Platform-specific overrides
│           ├── web.json
│           ├── mobile.json
│           └── desktop.json
├── build.ts                       # Build script with advanced features
├── demo.html                      # Interactive demo page
└── output/                        # Generated files (created by build)
```

## Quick Start

```bash
cd advanced
pnpm install
pnpm build
```

This will generate tokens for all combinations of themes and platforms:

- 3 themes × 3 platforms = 9 permutations
- CSS (bundled): All themes in one file with selectors
- JSON (standalone): Separate file per theme
- JS module (bundled): All themes in one module
- Figma Variables (standalone): Separate file per theme
- TypeScript types

## Architecture

### Layered Token Structure

```
Base → Alias → Modifiers
 ↓       ↓         ↓
Foundation  Semantic  Variants
```

### Resolution Order

1. **Base** - Foundational values (colors, spacing, typography, effects)
2. **Alias** - Semantic tokens + components (referencing base)
3. **Platform** - Platform-specific overrides (web/mobile/desktop)
4. **Theme** - Theme variations (light/dark/high-contrast)

Platform comes before theme to ensure platform adjustments are themeable.

## Understanding the Structure

### 1. Base Tokens (`tokens/base/`)

Absolute values - no references. These are your design system's foundation.

**Example** (`base/colors.json`):

```json
{
  "color": {
    "base": {
      "blue": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0, 0.4, 1]
        }
      },
      "gray": {
        "900": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [0.067, 0.094, 0.153]
          }
        }
      }
    }
  }
}
```

### 2. Alias Tokens (`tokens/alias/`)

Semantic references to base tokens - contextual meaning.

**Example** (`alias/colors.json`):

```json
{
  "color": {
    "alias": {
      "primary": {
        "$type": "color",
        "$value": "{color.base.blue}"
      },
      "text": {
        "$type": "color",
        "$value": "{color.base.gray.900}"
      }
    }
  }
}
```

### 3. Component Tokens (`tokens/alias/components/`)

Component-specific tokens that compose multiple base/alias tokens.

**Example** (`alias/components/button.json`):

```json
{
  "button": {
    "primary": {
      "background": {
        "$type": "color",
        "$value": "{color.alias.primary}"
      },
      "backgroundHover": {
        "$type": "color",
        "$value": "{color.alias.primary-hover}"
      },
      "text": {
        "$type": "color",
        "$value": "{color.base.white}"
      },
      "padding": {
        "$type": "dimension",
        "$value": "{spacing.alias.medium}"
      }
    }
  }
}
```

### 4. Platform Modifiers (`tokens/modifiers/platforms/`)

Platform-specific overrides for web, mobile, and desktop delivery.

**Example** (`modifiers/platforms/mobile.json`):

```json
{
  "spacing": {
    "alias": {
      "small": {
        "$type": "dimension",
        "$value": { "value": 12, "unit": "px" }
      }
    }
  },
  "button": {
    "primary": {
      "padding": {
        "$type": "dimension",
        "$value": { "value": 16, "unit": "px" }
      }
    }
  }
}
```

### 5. Theme Modifiers (`tokens/modifiers/themes/`)

Theme variations that override alias tokens for different color schemes.

**Example** (`modifiers/themes/dark.json`):

```json
{
  "color": {
    "alias": {
      "text": {
        "$type": "color",
        "$value": "{color.base.white}"
      },
      "background": {
        "$type": "color",
        "$value": "{color.base.black}"
      }
    }
  }
}
```

## Generated Output

### CSS (Bundled Mode)

All themes in one file with attribute selectors:

```css
/* Default theme (light) */
:root {
  --color-base-blue: rgb(0, 102, 255);
  --color-alias-primary: var(--color-base-blue);
  --color-alias-text: rgb(17, 24, 39);
  --button-primary-background: var(--color-alias-primary);
}

/* Dark theme */
[data-color-scheme='dark'] {
  --color-alias-text: rgb(255, 255, 255);
  --color-alias-background: rgb(0, 0, 0);
}

/* High contrast theme */
[data-color-scheme='high-contrast'] {
  --color-alias-text: rgb(255, 255, 255);
  --color-alias-background: rgb(0, 0, 0);
}
```

### JSON (Standalone Mode)

Separate files per theme with platform-specific values:

- `tokens-theme-light-platform-web.json`
- `tokens-theme-dark-platform-mobile.json`
- etc.

### JavaScript Module (Bundled Mode)

All themes in one ES module:

```javascript
export default {
  Light: {
    colorAliasP

rimary: "rgb(0, 102, 255)",
    // ...
  },
  Dark: {
    colorAliasPrimary: "rgb(77, 154, 255)",
    // ...
  }
}
```

## Using the Tokens

### In HTML/CSS

```html
<!-- Default theme (light) -->
<body>
  <button
    style="
    background: var(--button-primary-background);
    color: var(--button-primary-text);
    padding: var(--button-primary-padding);
  "
  >
    Click me
  </button>
</body>

<!-- Dark theme -->
<body data-color-scheme="dark">
  <!-- Same markup, different colors -->
</body>
```

### In JavaScript

```javascript
import tokens from './output/tokens.js'

// Access theme-specific tokens
const lightTokens = tokens.Light
const darkTokens = tokens.Dark

// Use in code
element.style.background = lightTokens.buttonPrimaryBackground
```

### In TypeScript

```typescript
import type { DesignTokens } from './output/tokens.d.ts'
import tokens from './output/tokens.js'

const lightTokens: DesignTokens = tokens.Light
```

## Advanced Features

### Multi-Dimensional Modifiers

This example demonstrates 2D token generation:

- **Theme** (light, dark, high-contrast)
- **Platform** (web, mobile, desktop)

= 3 × 3 = **9 permutations**

### Output Modes

1. **Bundle** - All themes in one file (CSS, JS)
   - Smaller number of files
   - Runtime theme switching
   - Attribute-based selectors

2. **Standalone** - Separate file per permutation (JSON, Figma)
   - One file per theme/platform combo
   - Build-time selection
   - Smaller file sizes per variant

### Custom Renderers

The build script includes a custom renderer example:

```typescript
const myRenderer = {
  name: 'my-renderer',
  format: (tokens, options) => {
    return JSON.stringify(
      Object.entries(tokens).map(([name, token]) => ({
        name: token.name,
        value: token.$value,
        altName: `${token.name}-alt`,
      })),
      null,
      2,
    )
  },
}
```

## Advanced Reference Features

### Property-Level References (DTCG Section 7.3)

Property-level references allow you to reference specific properties within a token's value, not just the entire token. This is useful for reusing individual components of composite tokens.

**Important:** Property-level references MUST use JSON Pointer syntax (`$ref`) and CANNOT be expressed using curly brace syntax.

#### Syntax Comparison

✅ **Correct (JSON Pointer syntax):**

```json
{
  "base": {
    "blue": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.2, 0.4, 0.9]
      }
    }
  },
  "semantic": {
    "primary": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [
          { "$ref": "#/base/blue/$value/components/0" },
          { "$ref": "#/base/blue/$value/components/1" },
          0.7
        ]
      }
    }
  }
}
```

❌ **Incorrect (curly brace syntax - NOT supported):**

```json
{
  "semantic": {
    "red-component": {
      "$value": "{base.blue.components.0}" // This won't work!
    }
  }
}
```

#### Common Use Cases

1. **Color Component Reuse** - Share red/green/blue components between colors
2. **Dimension Value Access** - Reference just the numeric value or unit
3. **Shadow Property Access** - Reference specific shadow properties like alpha

**Example:** See `tokens/base/property-references.json` for working examples.

### Array Aliasing in Composite Types (DTCG Section 9.1)

Arrays in composite types (like shadow tokens) can mix references to other tokens with explicit values. References always resolve to single values and do not cause array flattening.

#### Key Principles

1. **Single Value Resolution** - References in arrays resolve to single values, never to arrays themselves
2. **No Flattening** - Referenced arrays are treated as single elements
3. **Mixed Composition** - Arrays may freely mix explicit values and references
4. **Both Syntaxes Work** - Unlike property-level references, array aliasing works with both `{token}` and `$ref` syntax

#### Example: Layered Shadows

```json
{
  "shadow": {
    "base": {
      "$type": "shadow",
      "$value": {
        "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.1 },
        "offsetX": { "value": 0, "unit": "px" },
        "offsetY": { "value": 2, "unit": "px" },
        "blur": { "value": 4, "unit": "px" }
      }
    },
    "accent": {
      "$type": "shadow",
      "$value": {
        "color": "{color.brand.blue}",
        "offsetX": { "value": 0, "unit": "px" },
        "offsetY": { "value": 4, "unit": "px" },
        "blur": { "value": 8, "unit": "px" }
      }
    },
    "layered": {
      "$type": "shadow",
      "$value": [
        "{shadow.base}", // Reference to another shadow
        "{shadow.accent}", // Another reference
        {
          // Explicit shadow value
          "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.05 },
          "offsetX": { "value": 0, "unit": "px" },
          "offsetY": { "value": 8, "unit": "px" },
          "blur": { "value": 16, "unit": "px" }
        }
      ]
    }
  }
}
```

**Result:** The `layered` shadow will have 3 distinct shadow layers - two from references and one explicit.

**Example:** See `tokens/alias/advanced-shadows.json` for working examples.

#### Font Family Example

```json
{
  "font": {
    "brand": {
      "$type": "fontFamily",
      "$value": "Inter"
    },
    "fallback": {
      "$type": "fontFamily",
      "$value": "system-ui"
    },
    "stack": {
      "$type": "fontFamily",
      "$value": [
        "{font.brand}", // Reference
        "{font.fallback}", // Reference
        "sans-serif" // Explicit value
      ]
    }
  }
}
```

**Result:** `font.stack` resolves to `["Inter", "system-ui", "sans-serif"]`

#### Reference Documentation

- [DTCG Section 7.3: Property-Level References](https://design-tokens.github.io/community-group/format/#property-level-references)
- [DTCG Section 9.1: Array Aliasing](https://design-tokens.github.io/community-group/format/#array-aliasing)

## Key Concepts

### Base vs Alias

| Aspect      | Base Tokens                  | Alias Tokens             |
| ----------- | ---------------------------- | ------------------------ |
| **Purpose** | Foundation                   | Context                  |
| **Values**  | Absolute                     | References               |
| **Naming**  | Descriptive (blue, gray-900) | Semantic (primary, text) |
| **Changes** | Rare                         | Frequent                 |

### When to Use Component Tokens

Create component tokens when:

- Component has multiple states (hover, active, disabled)
- Component combines 3+ tokens consistently
- Component is reused across applications

This example includes minimal component tokens (button, card) as recommended for the Large Scale structure.

## Demo

Open `demo.html` to see the tokens in action with:

- Interactive theme switcher
- Color swatches
- Typography samples
- Spacing visualization
- Component examples

```bash
pnpm start  # Builds and opens demo
```

## Next Steps

Once you understand this advanced structure:

- **Scale down** to [basic](../basic/) for simpler projects
- **Scale up** to [enterprise](../enterprise/) for complex multi-brand systems
- **Extend** with your own modifiers (density, brand, accessibility)
- **Customize** renderers for your design tools

## Learn More

- [Token Forge Documentation](../../README.md)
- [DTCG Specification](https://www.designtokens.org/)
- [Best Practices Guide](../../docs/best-practices.md)
