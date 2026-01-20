# Basic Example - Token Forge

A simple Token Forge setup demonstrating the **Small/Medium Scale** structure with base tokens, alias tokens, and theme modifiers.

## What's Included

- **Base tokens** (`tokens/base.json`) - Foundational color and spacing values
- **Alias tokens** (`tokens/alias.json`) - Semantic tokens that reference base values
- **Theme modifiers** (`tokens/themes/`) - Light and dark theme variations
- **Resolver** (`tokens.resolver.json`) - Configuration for token resolution
- **Build script** (`build.ts`) - Generates CSS with theme support
- **Output** (`output/tokens.css`) - Generated CSS file with both themes

## Project Structure

```
basic/
├── tokens.resolver.json          # Simple resolver with theme modifier
├── tokens/
│   ├── base.json                  # Base values (colors, spacing)
│   ├── alias.json                 # Alias tokens (referencing base)
│   └── themes/
│       ├── light.json             # Light theme overrides
│       └── dark.json              # Dark theme overrides
├── build.ts                       # Build script
└── output/
    └── tokens.css                 # Generated CSS (created after build)
```

## Quick Start

```bash
cd basic
pnpm install
pnpm build
```

This will generate `output/tokens.css` with your design tokens as CSS custom properties, including both light and dark themes.

## Understanding the Architecture

### Layered Token Structure

```
Base → Alias → Modifiers
 ↓       ↓         ↓
Values  Context  Themes
```

### 1. Base Tokens (`tokens/base.json`)

Foundational values - no references to other tokens:

```json
{
  "color": {
    "base": {
      "blue": {
        "$type": "color",
        "$value": { "colorSpace": "srgb", "components": [0, 0.4, 0.8] }
      }
    }
  }
}
```

### 2. Alias Tokens (`tokens/alias.json`)

Semantic tokens that reference base tokens:

```json
{
  "color": {
    "alias": {
      "primary": {
        "$type": "color",
        "$value": "{color.base.blue}"
      }
    }
  }
}
```

### 3. Theme Modifiers (`tokens/themes/`)

Override alias (or base) tokens for different themes:

**Light theme** (`light.json`):

```json
{
  "color": {
    "alias": {
      "text": { "$value": "{color.base.black}" },
      "background": { "$value": "{color.base.white}" }
    }
  }
}
```

**Dark theme** (`dark.json`):

```json
{
  "color": {
    "alias": {
      "text": { "$value": "{color.base.white}" },
      "background": { "$value": "{color.base.black}" }
    }
  }
}
```

### 4. Resolver (`tokens.resolver.json`)

Configures how tokens are loaded and merged:

```json
{
  "sets": {
    "core": {
      "sources": [{ "$ref": "./tokens/base.json" }, { "$ref": "./tokens/alias.json" }]
    }
  },
  "modifiers": {
    "theme": {
      "default": "light",
      "contexts": {
        "light": [{ "$ref": "./tokens/themes/light.json" }],
        "dark": [{ "$ref": "./tokens/themes/dark.json" }]
      }
    }
  },
  "resolutionOrder": [{ "$ref": "#/sets/core" }, { "$ref": "#/modifiers/theme" }]
}
```

## Generated Output

The build generates a single CSS file with both themes:

```css
/* Light theme (default) */
:root {
  --color-base-blue: rgb(0, 102, 204);
  --color-alias-primary: var(--color-base-blue);
  --color-alias-text: rgb(0, 0, 0);
  --color-alias-background: rgb(255, 255, 255);
  --spacing-alias-small: 8px;
  /* ... */
}

/* Dark theme */
[data-theme='dark'] {
  --color-alias-text: rgb(255, 255, 255);
  --color-alias-background: rgb(0, 0, 0);
}
```

## Using Themes in HTML

```html
<!-- Light theme (default) -->
<body>
  <h1 style="color: var(--color-alias-text)">Light Theme</h1>
</body>

<!-- Dark theme -->
<body data-theme="dark">
  <h1 style="color: var(--color-alias-text)">Dark Theme</h1>
</body>
```

## Key Concepts

### Base vs Alias Tokens

| Aspect             | Base Tokens                             | Alias Tokens                           |
| ------------------ | --------------------------------------- | -------------------------------------- |
| **Purpose**        | Foundational values                     | Contextual meaning                     |
| **Values**         | Absolute (e.g., `rgb(0, 102, 204)`)     | References (e.g., `{color.base.blue}`) |
| **Naming**         | Descriptive (e.g., `blue`, `spacing-4`) | Semantic (e.g., `primary`, `medium`)   |
| **When to change** | Rarely - affects entire system          | Frequently - adapts to context         |

### Why This Structure?

1. **Separation of Concerns** - Base defines what exists, alias defines what it means
2. **Theme Flexibility** - Only override semantic meanings, not base values
3. **Maintainability** - Change one base color, update everywhere
4. **Scalability** - Easy to add more themes or modifiers

## Next Steps

Once you understand this basic setup, explore:

- **[advanced](../advanced/)** - Multi-platform delivery, component tokens
- **[enterprise](../enterprise/)** - Full feature coverage with multiple modifier dimensions
- **[in-memory-example](../in-memory-example/)** - Working without files

## Learn More

- [Token Forge Documentation](../../README.md)
- [DTCG Specification](https://www.designtokens.org/)
- [Best Practices Guide](../../docs/best-practices.md)
