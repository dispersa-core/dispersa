/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useMemo, useState } from 'react'

type Source = 'core' | 'theme' | 'density'

const SETS = {
  core: {
    'color.brand.primary': '#3366e6',
    'color.neutral.white': '#ffffff',
    'spacing.medium': '16px',
  },
} as const

const MODIFIERS = {
  theme: {
    light: {
      'color.bg': '#ffffff',
      'color.text': '#1a1a1a',
    },
    dark: {
      'color.bg': '#1a1a1a',
      'color.text': '#ffffff',
    },
  },
  density: {
    comfortable: { 'spacing.component': '16px' },
    compact: { 'spacing.component': '8px' },
  },
} as const

const SOURCE_COLORS: Record<Source, string> = {
  core: 'var(--sl-color-blue, #3b82f6)',
  density: 'var(--sl-color-amber, #f59e0b)',
  theme: 'var(--sl-color-green, #22c55e)',
}

function resolve(
  theme: 'light' | 'dark',
  density: 'comfortable' | 'compact',
): Array<{ path: string; value: string; source: Source }> {
  const result: Array<{ path: string; value: string; source: Source }> = []

  // core first
  for (const [path, value] of Object.entries(SETS.core)) {
    result.push({ path, value, source: 'core' })
  }

  // density second
  const densityTokens = MODIFIERS.density[density]
  for (const [path, value] of Object.entries(densityTokens)) {
    const existing = result.findIndex((r) => r.path === path)
    if (existing >= 0) {
      result[existing] = { path, value, source: 'density' }
    } else {
      result.push({ path, value, source: 'density' })
    }
  }

  // theme third
  const themeTokens = MODIFIERS.theme[theme]
  for (const [path, value] of Object.entries(themeTokens)) {
    const existing = result.findIndex((r) => r.path === path)
    if (existing >= 0) {
      result[existing] = { path, value, source: 'theme' }
    } else {
      result.push({ path, value, source: 'theme' })
    }
  }

  return result.sort((a, b) => a.path.localeCompare(b.path))
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    width: '100%',
    maxWidth: '100%',
    fontFamily: 'var(--sl-font-system, ui-sans-serif, system-ui, sans-serif)',
    fontSize: 14,
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
    alignItems: 'center',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    color: 'var(--sl-color-text, #1a1a1a)',
    fontWeight: 500,
    fontSize: 13,
  },
  pillGroup: {
    display: 'flex',
    gap: 4,
    padding: 4,
    borderRadius: 8,
    background: 'var(--sl-color-bg-inline-code, rgba(0,0,0,0.05))',
    border: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
  },
  pill: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--sl-color-text, #1a1a1a)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pillActive: {
    background: 'var(--sl-color-accent, #5468ff)',
    color: 'var(--sl-color-text-invert, #fff)',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    minHeight: 200,
  },
  panelsMobile: {
    gridTemplateColumns: '1fr',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: 8,
    border: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
    overflow: 'hidden',
    background: 'var(--sl-color-surface-1, #fafafa)',
  },
  panelHeader: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
    background: 'var(--sl-color-surface-2, #f0f0f0)',
    color: 'var(--sl-color-text, #1a1a1a)',
    fontWeight: 600,
    fontSize: 13,
  },
  panelContent: {
    flex: 1,
    padding: 12,
    overflowY: 'auto' as const,
    fontFamily: 'var(--sl-font-system-mono, ui-monospace, monospace)',
    fontSize: 12,
    lineHeight: 1.7,
  },
  tokenRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px',
    borderRadius: 6,
    marginBottom: 4,
  },
  tokenRowHighlight: {
    background: 'var(--sl-color-accent-low, rgba(84,104,255,0.12))',
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  tokenPath: {
    flex: 1,
    color: 'var(--sl-color-text, #1a1a1a)',
    wordBreak: 'break-all' as const,
  },
  tokenValue: {
    color: 'var(--sl-color-text-2, #666)',
    flexShrink: 0,
  },
  structureKey: {
    color: 'var(--sl-color-orange, #f97316)',
  },
  structureValue: {
    color: 'var(--sl-color-green, #22c55e)',
  },
}

export default function ResolverVisualizer() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [mobile, setMobile] = useState(false)

  const resolved = useMemo(() => resolve(theme, density), [theme, density])

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>Theme:</span>
          <div style={styles.pillGroup}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                ...styles.pill,
                ...(theme === 'light' ? styles.pillActive : {}),
              }}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                ...styles.pill,
                ...(theme === 'dark' ? styles.pillActive : {}),
              }}
            >
              Dark
            </button>
          </div>
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>Density:</span>
          <div style={styles.pillGroup}>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              style={{
                ...styles.pill,
                ...(density === 'comfortable' ? styles.pillActive : {}),
              }}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              style={{
                ...styles.pill,
                ...(density === 'compact' ? styles.pillActive : {}),
              }}
            >
              Compact
            </button>
          </div>
        </div>
        <div
          style={{
            ...styles.controlGroup,
            marginLeft: 'auto',
            fontSize: 12,
            color: 'var(--sl-color-text-2, #666)',
          }}
        >
          <span
            style={{
              ...styles.sourceDot,
              ...styles.panel,
              display: 'inline-block',
              marginRight: 4,
              background: SOURCE_COLORS.core,
            }}
          />
          core
          <span
            style={{
              ...styles.sourceDot,
              ...styles.panel,
              display: 'inline-block',
              marginLeft: 12,
              marginRight: 4,
              background: SOURCE_COLORS.density,
            }}
          />
          density
          <span
            style={{
              ...styles.sourceDot,
              ...styles.panel,
              display: 'inline-block',
              marginLeft: 12,
              marginRight: 4,
              background: SOURCE_COLORS.theme,
            }}
          />
          theme
        </div>
      </div>

      <div
        style={{
          ...styles.panels,
          ...(mobile ? styles.panelsMobile : {}),
        }}
      >
        <div style={styles.panel}>
          <div style={styles.panelHeader}>Document structure</div>
          <div style={styles.panelContent}>
            <div style={{ marginBottom: 12 }}>
              <span style={styles.structureKey}>sets.core</span>
              <br />
              <span style={{ marginLeft: 12, ...styles.structureValue }}>
                color.brand.primary, color.neutral.white, spacing.medium
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={styles.structureKey}>modifiers.density</span>
              <br />
              <span style={{ marginLeft: 12, ...styles.structureValue }}>comfortable, compact</span>
            </div>
            <div>
              <span style={styles.structureKey}>modifiers.theme</span>
              <br />
              <span style={{ marginLeft: 12, ...styles.structureValue }}>light, dark</span>
            </div>
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
                fontSize: 11,
                color: 'var(--sl-color-text-2, #666)',
              }}
            >
              resolutionOrder: core → density → theme
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            Resolved tokens ({theme} + {density})
          </div>
          <div style={styles.panelContent}>
            {resolved.map(({ path, value, source }) => (
              <div
                key={path}
                style={{
                  ...styles.tokenRow,
                  ...(source !== 'core' ? styles.tokenRowHighlight : {}),
                }}
              >
                <span
                  style={{
                    ...styles.sourceDot,
                    background: SOURCE_COLORS[source],
                  }}
                  title={source}
                  aria-hidden
                />
                <span style={styles.tokenPath}>{path}</span>
                <span style={styles.tokenValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
