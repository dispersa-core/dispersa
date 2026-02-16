import { useState, type CSSProperties } from 'react'

type Example = {
  name: string
  description: string
  tokens: string
  resolver: string
  outputs: Record<string, string>
}

const EXAMPLES: Example[] = [
  {
    name: 'Basic Colors',
    description: 'Simple color tokens with hex output',
    tokens: `{
  "color": {
    "$type": "color",
    "brand": {
      "primary": {
        "$value": {
          "colorSpace": "srgb",
          "components": [0.2, 0.4, 0.9]
        }
      },
      "secondary": {
        "$value": {
          "colorSpace": "srgb",
          "components": [0.9, 0.3, 0.5]
        }
      }
    }
  }
}`,
    resolver: `{
  "version": "2025.10",
  "sets": {
    "core": {
      "sources": [{ "$ref": "./colors.json" }]
    }
  },
  "resolutionOrder": [
    { "$ref": "#/sets/core" }
  ]
}`,
    outputs: {
      CSS: `:root {
  --color-brand-primary: #3366e6;
  --color-brand-secondary: #e64d80;
}`,
      JSON: `{
  "color-brand-primary": "#3366e6",
  "color-brand-secondary": "#e64d80"
}`,
      JavaScript: `export default {
  color: {
    brand: {
      primary: '#3366e6',
      secondary: '#e64d80',
    },
  },
}`,
      Swift: `import SwiftUI

public enum DesignTokens {
  public enum Color {
    public enum Brand {
      public static let primary = Color(
        red: 0.2, green: 0.4, blue: 0.9
      )
      public static let secondary = Color(
        red: 0.9, green: 0.3, blue: 0.5
      )
    }
  }
}`,
      Kotlin: `package com.example.tokens

import androidx.compose.ui.graphics.Color

object DesignTokens {
  object Colors {
    object Brand {
      val primary = Color(0xFF3366E6)
      val secondary = Color(0xFFE64D80)
    }
  }
}`,
    },
  },
  {
    name: 'Themed Tokens',
    description: 'Light/dark theme with modifier overrides',
    tokens: `{
  "color": {
    "$type": "color",
    "neutral": {
      "white": {
        "$value": {
          "colorSpace": "srgb",
          "components": [1, 1, 1]
        }
      },
      "black": {
        "$value": {
          "colorSpace": "srgb",
          "components": [0, 0, 0]
        }
      }
    }
  }
}`,
    resolver: `{
  "version": "2025.10",
  "sets": {
    "core": {
      "sources": [{ "$ref": "./colors.json" }]
    }
  },
  "modifiers": {
    "theme": {
      "default": "light",
      "contexts": {
        "light": [{
          "semantic": {
            "background": {
              "$type": "color",
              "$value": "{color.neutral.white}"
            },
            "text": {
              "$type": "color",
              "$value": "{color.neutral.black}"
            }
          }
        }],
        "dark": [{
          "semantic": {
            "background": {
              "$type": "color",
              "$value": "{color.neutral.black}"
            },
            "text": {
              "$type": "color",
              "$value": "{color.neutral.white}"
            }
          }
        }]
      }
    }
  },
  "resolutionOrder": [
    { "$ref": "#/sets/core" },
    { "$ref": "#/modifiers/theme" }
  ]
}`,
    outputs: {
      CSS: `:root {
  --color-neutral-white: #ffffff;
  --color-neutral-black: #000000;
  --semantic-background: #ffffff;
  --semantic-text: #000000;
}

[data-theme="dark"] {
  --semantic-background: #000000;
  --semantic-text: #ffffff;
}`,
      JSON: `{
  "light": {
    "color-neutral-white": "#ffffff",
    "color-neutral-black": "#000000",
    "semantic-background": "#ffffff",
    "semantic-text": "#000000"
  },
  "dark": {
    "color-neutral-white": "#ffffff",
    "color-neutral-black": "#000000",
    "semantic-background": "#000000",
    "semantic-text": "#ffffff"
  }
}`,
      Tailwind: `@theme {
  --color-neutral-white: #ffffff;
  --color-neutral-black: #000000;
  --color-semantic-background: #ffffff;
  --color-semantic-text: #000000;
}

@custom-variant dark {
  [data-theme="dark"] & {
    --color-semantic-background: #000000;
    --color-semantic-text: #ffffff;
  }
}`,
    },
  },
  {
    name: 'Spacing & Typography',
    description: 'Dimension and font tokens',
    tokens: `{
  "spacing": {
    "$type": "dimension",
    "xs": {
      "$value": { "value": 4, "unit": "px" }
    },
    "sm": {
      "$value": { "value": 8, "unit": "px" }
    },
    "md": {
      "$value": { "value": 16, "unit": "px" }
    },
    "lg": {
      "$value": { "value": 32, "unit": "px" }
    }
  },
  "font": {
    "family": {
      "$type": "fontFamily",
      "sans": {
        "$value": ["Inter", "system-ui", "sans-serif"]
      },
      "mono": {
        "$value": ["JetBrains Mono", "monospace"]
      }
    },
    "weight": {
      "$type": "fontWeight",
      "regular": { "$value": 400 },
      "bold": { "$value": 700 }
    }
  }
}`,
    resolver: `{
  "version": "2025.10",
  "sets": {
    "core": {
      "sources": [{ "$ref": "./tokens.json" }]
    }
  },
  "resolutionOrder": [
    { "$ref": "#/sets/core" }
  ]
}`,
    outputs: {
      CSS: `:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
}`,
      JSON: `{
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "32px",
  "font-family-sans": "'Inter', system-ui, sans-serif",
  "font-family-mono": "'JetBrains Mono', monospace",
  "font-weight-regular": 400,
  "font-weight-bold": 700
}`,
      Swift: `import SwiftUI

public enum DesignTokens {
  public enum Spacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 32
  }

  public enum Font {
    public enum Family {
      public static let sans = "Inter"
      public static let mono = "JetBrains Mono"
    }
    public enum Weight {
      public static let regular = Font.Weight.regular
      public static let bold = Font.Weight.bold
    }
  }
}`,
    },
  },
]

const styles = {
  container: {
    border: '1px solid var(--sl-color-gray-5, #374151)',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'var(--sl-font-system, system-ui)',
  } satisfies CSSProperties,
  header: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--sl-color-gray-5, #374151)',
    background: 'var(--sl-color-gray-7, #111827)',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } satisfies CSSProperties,
  exampleBtn: (active: boolean) =>
    ({
      padding: '6px 14px',
      border: '1px solid',
      borderColor: active ? 'var(--sl-color-accent, #6366f1)' : 'var(--sl-color-gray-5, #374151)',
      borderRadius: '6px',
      background: active ? 'var(--sl-color-accent-low, rgba(99,102,241,0.15))' : 'transparent',
      color: active ? 'var(--sl-color-accent-high, #a5b4fc)' : 'var(--sl-color-gray-2, #9ca3af)',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    }) satisfies CSSProperties,
  body: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '400px',
  } satisfies CSSProperties,
  bodyMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    minHeight: '400px',
  } satisfies CSSProperties,
  pane: {
    display: 'flex',
    flexDirection: 'column' as const,
  } satisfies CSSProperties,
  paneHeader: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--sl-color-gray-2, #9ca3af)',
    borderBottom: '1px solid var(--sl-color-gray-5, #374151)',
    background: 'var(--sl-color-gray-6, #1f2937)',
  } satisfies CSSProperties,
  code: {
    flex: 1,
    padding: '16px',
    margin: 0,
    fontFamily: 'var(--sl-font-system-mono, monospace)',
    fontSize: '13px',
    lineHeight: 1.6,
    overflow: 'auto',
    background: 'var(--sl-color-gray-7, #111827)',
    color: 'var(--sl-color-gray-1, #d1d5db)',
    whiteSpace: 'pre' as const,
    borderRight: '1px solid var(--sl-color-gray-5, #374151)',
    maxHeight: '500px',
  } satisfies CSSProperties,
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid var(--sl-color-gray-5, #374151)',
    background: 'var(--sl-color-gray-6, #1f2937)',
  } satisfies CSSProperties,
  tab: (active: boolean) =>
    ({
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      border: 'none',
      borderBottom: active ? '2px solid var(--sl-color-accent, #6366f1)' : '2px solid transparent',
      background: 'transparent',
      color: active ? 'var(--sl-color-accent-high, #a5b4fc)' : 'var(--sl-color-gray-2, #9ca3af)',
      transition: 'all 0.15s',
    }) satisfies CSSProperties,
  desc: {
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--sl-color-gray-3, #6b7280)',
    borderBottom: '1px solid var(--sl-color-gray-5, #374151)',
    background: 'var(--sl-color-gray-6, #1f2937)',
  } satisfies CSSProperties,
}

export default function TokenPlayground() {
  const [exampleIdx, setExampleIdx] = useState(0)
  const [inputTab, setInputTab] = useState<'tokens' | 'resolver'>('tokens')
  const [outputTab, setOutputTab] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const example = EXAMPLES[exampleIdx]
  const outputFormats = Object.keys(example.outputs)
  const activeOutput = outputFormats[outputTab] ?? outputFormats[0]

  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches !== isMobile) {
      setIsMobile(mq.matches)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontSize: '13px', color: 'var(--sl-color-gray-2)', marginRight: '8px' }}>
          Example:
        </span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.name}
            style={styles.exampleBtn(i === exampleIdx)}
            onClick={() => {
              setExampleIdx(i)
              setOutputTab(0)
            }}
          >
            {ex.name}
          </button>
        ))}
      </div>
      <div style={styles.desc}>{example.description}</div>
      <div style={isMobile ? styles.bodyMobile : styles.body}>
        <div style={styles.pane}>
          <div style={styles.tabs}>
            <button style={styles.tab(inputTab === 'tokens')} onClick={() => setInputTab('tokens')}>
              tokens.json
            </button>
            <button
              style={styles.tab(inputTab === 'resolver')}
              onClick={() => setInputTab('resolver')}
            >
              resolver.json
            </button>
          </div>
          <pre style={styles.code}>{inputTab === 'tokens' ? example.tokens : example.resolver}</pre>
        </div>
        <div style={styles.pane}>
          <div style={styles.tabs}>
            {outputFormats.map((fmt, i) => (
              <button key={fmt} style={styles.tab(i === outputTab)} onClick={() => setOutputTab(i)}>
                {fmt}
              </button>
            ))}
          </div>
          <pre style={{ ...styles.code, borderRight: 'none' }}>{example.outputs[activeOutput]}</pre>
        </div>
      </div>
    </div>
  )
}
