# Custom Plugins Example - Token Forge

This example demonstrates how to extend Token Forge with **custom plugins**: custom filters, custom renderers, and custom transforms. Learn how to create your own output formats, transformation logic, and filtering rules.

## What's Included

- **Custom Filter** - Filter tokens by type (colors only)
- **Custom Renderer** - YAML output format with flat/nested structure options
- **Custom Transform** - Transform token names to uppercase
- **Token files** - Simple base and alias tokens for demonstration
- **Build script** - Shows how to implement and use custom plugins

## Why Custom Plugins?

Token Forge includes built-in filters, renderers, and transforms, but every design system has unique needs. Custom plugins let you:

- **Output any format** - SCSS, LESS, XML, protobuf, or proprietary formats
- **Apply custom transformations** - Add prefixes, wrap values, compute derived values
- **Filter with complex logic** - Combine multiple criteria, context-aware filtering

## Project Structure

```
custom-plugins/
├── tokens.resolver.json          # Simple resolver config
├── tokens/
│   ├── base.json                  # Foundation tokens
│   └── alias.json                 # Semantic tokens
├── build.ts                       # Build script with custom plugins
└── output/
    └── tokens.yaml                # Generated YAML (created after build)
```

## Quick Start

```bash
cd custom-plugins
pnpm install
pnpm build
```

This will generate `output/tokens.yaml` with only color tokens in uppercase names.

## Understanding Custom Plugins

### 1. Custom Filter

Filters determine which tokens are included in the output. They receive each token and return `true` (include) or `false` (exclude).

**Interface:**

```typescript
type Filter = {
  name: string
  filter: (token: ResolvedToken) => boolean
}
```

**Example - Color tokens only:**

```typescript
const colorOnlyFilter: Filter = {
  name: 'custom-color-filter',
  filter: (token) => token.$type === 'color',
}
```

**Use cases:**

- Filter by token type (color, dimension, typography)
- Filter by path pattern (only tokens under `component.*`)
- Filter by metadata (only tokens with specific `$extensions`)
- Complex filtering logic (combine multiple conditions)

### 2. Custom Transform

Transforms modify tokens during processing. They can change names, values, or any token property.

**Interface:**

```typescript
type Transform = {
  name: string
  matcher?: (token: ResolvedToken) => boolean // Optional: which tokens to transform
  transform: (token: ResolvedToken) => ResolvedToken
}
```

**Example - Uppercase names:**

```typescript
const uppercaseNamesTransform: Transform = {
  name: 'custom-uppercase-names',
  matcher: (token) => true, // Apply to all tokens
  transform: (token) => ({
    ...token,
    name: token.name.toUpperCase(),
  }),
}
```

**Use cases:**

- Name transformations (prefixes, suffixes, case conversions)
- Value transformations (unit conversions, color space changes)
- Add computed metadata
- Wrap values in functions

### 3. Custom Renderer

Renderers convert resolved tokens into the final output format.

**Interface:**

```typescript
type Renderer = {
  name: string
  format: (tokens: ResolvedTokens, options?: FormatOptions) => string | Promise<string>
}
```

**Example - YAML renderer:**

```typescript
import yaml from 'yaml'

const yamlRenderer: Renderer = {
  name: 'yaml',
  format: (tokens, options) => {
    const structure = options?.structure || 'flat'

    if (structure === 'flat') {
      const flatTokens: Record<string, any> = {}

      for (const [name, token] of Object.entries(tokens)) {
        flatTokens[name] = {
          value: token.$value,
          type: token.$type,
        }
      }

      return yaml.stringify(flatTokens, { indent: 2 })
    }

    // ... nested structure logic
  },
}
```

**Use cases:**

- Output formats not built into Token Forge (SCSS, LESS, XML, TOML)
- Proprietary formats for specific tools
- Custom JSON structures for APIs
- Documentation generation
- Platform-specific formats (Android XML, iOS plist)

## Using Custom Plugins

In your build script:

```typescript
import { TokenForge, type Filter, type Transform, type Renderer } from '@token-forge/core'

// 1. Define your custom plugins
const myFilter: Filter = {
  /* ... */
}
const myTransform: Transform = {
  /* ... */
}
const myRenderer: Renderer = {
  /* ... */
}

// 2. Use them in platform config
const forge = new TokenForge({
  /* ... */
})

await forge.build({
  platforms: [
    {
      name: 'my-platform',
      renderer: myRenderer, // Custom renderer
      filters: [myFilter], // Custom filter
      transforms: [myTransform], // Custom transform
      outputPath: 'tokens.yaml',
      options: {
        // Renderer-specific options
        structure: 'flat',
      },
    },
  ],
})
```

## Generated Output

With the custom plugins in this example, the output looks like:

```yaml
BUTTON-PRIMARY-BACKGROUND:
  value: '#2196f3'
  type: color
BUTTON-PRIMARY-TEXT:
  value: '#f5f5f5'
  type: color
BUTTON-DANGER-BACKGROUND:
  value: '#f44336'
  type: color
TEXT-PRIMARY:
  value: '#212121'
  type: color
# ... (only color tokens, all uppercase names)
```

Notice:

- ✅ Only color tokens (filter applied)
- ✅ Uppercase names (transform applied)
- ✅ YAML format (renderer applied)

## Customization Ideas

### Different Output Formats

**SCSS Variables:**

```typescript
const scssRenderer: Renderer = {
  name: 'scss',
  format: (tokens) => {
    return Object.entries(tokens)
      .map(([name, token]) => `$${name}: ${token.$value};`)
      .join('\n')
  },
}
```

**Android XML:**

```typescript
const androidRenderer: Renderer = {
  name: 'android-xml',
  format: (tokens) => {
    const colors = Object.entries(tokens)
      .filter(([_, token]) => token.$type === 'color')
      .map(([name, token]) => `    <color name="${name}">${token.$value}</color>`)
      .join('\n')

    return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${colors}\n</resources>`
  },
}
```

### Different Filters

**Multiple types:**

```typescript
const colorAndSpacingFilter: Filter = {
  name: 'color-and-spacing',
  filter: (token) => token.$type === 'color' || token.$type === 'dimension',
}
```

**Path-based:**

```typescript
const componentTokensFilter: Filter = {
  name: 'components-only',
  filter: (token) => token.path[0] === 'button' || token.path[0] === 'card',
}
```

**Metadata-based:**

```typescript
const platformFilter: Filter = {
  name: 'web-only',
  filter: (token) => {
    const platforms = token.$extensions?.platforms
    return !platforms || platforms.includes('web')
  },
}
```

### Different Transforms

**Add prefix:**

```typescript
const addPrefixTransform: Transform = {
  name: 'add-ds-prefix',
  transform: (token) => ({
    ...token,
    name: `ds-${token.name}`,
  }),
}
```

**Convert colors to RGB:**

```typescript
const colorToRgbTransform: Transform = {
  name: 'color-to-rgb',
  matcher: (token) => token.$type === 'color',
  transform: (token) => {
    // Convert color to RGB string
    const rgb = convertToRgb(token.$value)
    return { ...token, $value: rgb }
  },
}
```

**Add metadata:**

```typescript
const addCategoryTransform: Transform = {
  name: 'add-category',
  transform: (token) => ({
    ...token,
    $extensions: {
      ...token.$extensions,
      category: token.path[0], // First part of path
    },
  }),
}
```

## Advanced: Combining Plugins

You can use multiple filters, transforms, and even switch renderers per platform:

```typescript
await forge.build({
  platforms: [
    {
      name: 'web-colors',
      renderer: cssRenderer,
      filters: [colorOnlyFilter, webPlatformFilter],
      transforms: [nameKebabCase, colorToRgb],
      outputPath: 'web-colors.css',
    },
    {
      name: 'mobile-spacing',
      renderer: jsonRenderer,
      filters: [spacingOnlyFilter, mobilePlatformFilter],
      transforms: [dimensionToPx, addPrefixTransform],
      outputPath: 'mobile-spacing.json',
    },
  ],
})
```

## Key Points

1. **Plugins are composable** - Mix built-in and custom plugins freely
2. **Type-safe** - TypeScript provides full IntelliSense for plugin APIs
3. **Order matters** - Transforms run in array order, filters run after transforms
4. **Options are flexible** - Pass any options to renderers via `options` object
5. **Async supported** - Renderers can be async (e.g., for Prettier formatting)

## Next Steps

- Explore the [advanced](../advanced/) example for multi-platform builds
- Check the [basic](../basic/) example for a simple starting point
- Review Token Forge's [built-in plugins](../../packages/core/src/index.ts)
- Read about [DTCG token types](https://www.designtokens.org/)

## Learn More

- [Token Forge Documentation](../../README.md)
- [Plugin API Reference](../../packages/core/src/index.ts)
- [DTCG Specification](https://www.designtokens.org/)
