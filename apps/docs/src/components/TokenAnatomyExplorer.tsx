/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'

const ANNOTATIONS: Record<string, string> = {
  $type: "Defines the token's type. Can be set on a group to apply to all children.",
  $value: "The token's value. Format varies by type (color object, dimension object, etc.).",
  $description: 'Human-readable description. Appears in docs and generated code comments.',
  $deprecated: 'Marks the token as deprecated. Can be a boolean or a message string.',
  __group__: 'Group name. Nests tokens and defines the dot-path hierarchy.',
  colorSpace: 'CSS Color 4 color space (srgb, display-p3, oklch, etc.).',
  components: 'Color channel values, typically 0-1 for each channel.',
  value: 'Numeric value of the dimension.',
  unit: 'CSS unit (px, rem, em, etc.).',
}

const TOKEN_EXAMPLES: Record<string, unknown> = {
  Color: {
    color: {
      brand: {
        $type: 'color',
        primary: {
          $value: {
            colorSpace: 'srgb',
            components: [0.2, 0.4, 0.9],
          },
          $description: 'Primary brand color',
        },
      },
    },
  },
  Dimension: {
    spacing: {
      $type: 'dimension',
      medium: {
        $value: { value: 16, unit: 'px' },
        $description: 'Default spacing',
      },
    },
  },
  Shadow: {
    shadow: {
      card: {
        $type: 'shadow',
        $value: {
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 2, unit: 'px' },
          blur: { value: 8, unit: 'px' },
          spread: { value: 0, unit: 'px' },
          color: {
            colorSpace: 'srgb',
            components: [0, 0, 0],
            alpha: 0.1,
          },
        },
      },
    },
  },
  Typography: {
    typography: {
      heading: {
        $type: 'typography',
        $value: {
          fontFamily: ['Inter', 'sans-serif'],
          fontSize: { value: 24, unit: 'px' },
          fontWeight: 700,
          letterSpacing: { value: 0, unit: 'px' },
          lineHeight: 1.2,
        },
      },
    },
  },
}

const styles = {
  container: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.6,
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    maxWidth: '100%',
  } as const,
  toolbar: {
    display: 'flex',
    gap: 6,
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 500 as const,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as const,
  buttonActive: {
    background: 'rgba(99, 102, 241, 0.25)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
    color: '#a5b4fc',
  } as const,
  codeBlock: {
    padding: '16px 18px',
    overflowX: 'auto' as const,
    minHeight: 120,
  } as const,
  key: { color: '#7dd3fc' },
  string: { color: '#86efac' },
  number: { color: '#fdba74' },
  punctuation: { color: 'rgba(255, 255, 255, 0.4)' },
  hoverable: {
    cursor: 'default',
    padding: '0 2px',
    margin: '0 -2px',
    borderRadius: 3,
    transition: 'background-color 0.15s ease',
  } as const,
  hoverableHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  } as const,
  tooltip: {
    position: 'fixed' as const,
    zIndex: 9999,
    maxWidth: 280,
    padding: '8px 12px',
    backgroundColor: '#18181b',
    color: '#fafafa',
    fontSize: 12,
    lineHeight: 1.4,
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    pointerEvents: 'none' as const,
  } as const,
}

function HoverSpan({
  annotationKey,
  children,
  onHover,
}: {
  annotationKey: string
  children: ReactNode
  onHover: (key: string, rect: DOMRect | null) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    onHover(annotationKey, ref.current?.getBoundingClientRect() ?? null)
  }, [annotationKey, onHover])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    onHover('', null)
  }, [onHover])

  const text = ANNOTATIONS[annotationKey]
  if (!text) {
    return <>{children}</>
  }

  return (
    <span
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...styles.hoverable,
        ...(isHovered ? styles.hoverableHighlight : {}),
      }}
    >
      {children}
    </span>
  )
}

function renderJson(
  obj: unknown,
  indent: number,
  onHover: (key: string, rect: DOMRect | null) => void,
  path: string[] = [],
): ReactNode[] {
  const parts: ReactNode[] = []
  const pad = '  '.repeat(indent)
  const isInDimensionLike = path.some((p) =>
    ['$value', 'offsetX', 'offsetY', 'blur', 'spread', 'fontSize'].includes(p),
  )

  if (obj === null) {
    return [
      <span key="null" style={styles.punctuation}>
        null
      </span>,
    ]
  }

  if (typeof obj === 'boolean') {
    return [
      <span key="bool" style={styles.punctuation}>
        {String(obj)}
      </span>,
    ]
  }

  if (typeof obj === 'number') {
    return [
      <span key="num" style={styles.number}>
        {obj}
      </span>,
    ]
  }

  if (typeof obj === 'string') {
    return [
      <span key="str" style={styles.string}>
        "{obj}"
      </span>,
    ]
  }

  if (Array.isArray(obj)) {
    parts.push(
      <span key="arr-open" style={styles.punctuation}>
        [
      </span>,
    )
    obj.forEach((item, i) => {
      if (i > 0) {
        parts.push(
          <span key={`arr-comma-${i}`} style={styles.punctuation}>
            ,{' '}
          </span>,
        )
      }
      parts.push(...renderJson(item, 0, onHover, [...path, String(i)]))
    })
    parts.push(
      <span key="arr-close" style={styles.punctuation}>
        ]
      </span>,
    )
    return parts
  }

  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj)
    parts.push(
      <span key="obj-open" style={styles.punctuation}>
        {'{'}
      </span>,
    )

    entries.forEach(([key, value], idx) => {
      const isLast = idx === entries.length - 1
      const annotationKey = key.startsWith('$')
        ? key
        : key === 'colorSpace' || key === 'components' || key === 'unit'
          ? key
          : key === 'value' && isInDimensionLike
            ? 'value'
            : key.startsWith('$')
              ? key
              : '__group__'

      const uniqueKey = [...path, key].join('.')
      parts.push(
        <span key={uniqueKey}>
          {'\n'}
          {pad}{' '}
          <HoverSpan annotationKey={annotationKey} onHover={onHover}>
            <span style={styles.key}>"{key}"</span>
          </HoverSpan>
          <span style={styles.punctuation}>: </span>
          {Array.isArray(value) ||
          (typeof value === 'object' && value !== null && !(value instanceof Date)) ? (
            <>
              {renderJson(value, indent + 1, onHover, [...path, key])}
              {!isLast && <span style={styles.punctuation}>,</span>}
            </>
          ) : (
            <>
              {renderJson(value, 0, onHover, [...path, key])}
              {!isLast && <span style={styles.punctuation}>,</span>}
            </>
          )}
        </span>,
      )
    })
    parts.push(
      <span key="obj-close">
        {'\n'}
        {pad}
        <span style={styles.punctuation}>{'}'}</span>
      </span>,
    )
    return parts
  }

  return []
}

export default function TokenAnatomyExplorer() {
  const [activeToken, setActiveToken] = useState<string>('Color')
  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
    anchor: 'top' | 'bottom'
  } | null>(null)

  const handleHover = useCallback((key: string, rect: DOMRect | null) => {
    if (!key || !rect) {
      setTooltip(null)
      return
    }
    const text = ANNOTATIONS[key]
    if (!text) {
      setTooltip(null)
      return
    }
    const space = 8
    const anchor: 'top' | 'bottom' = rect.top < window.innerHeight / 2 ? 'bottom' : 'top'
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: anchor === 'bottom' ? rect.bottom + space : rect.top - space,
      anchor,
    })
  }, [])

  const data = TOKEN_EXAMPLES[activeToken]
  const rendered = renderJson(data, 0, handleHover)

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        {(Object.keys(TOKEN_EXAMPLES) as string[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveToken(name)}
            style={{
              ...styles.button,
              ...(activeToken === name ? styles.buttonActive : {}),
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div style={styles.codeBlock}>
        <pre style={{ margin: 0, whiteSpace: 'pre' }}>{rendered}</pre>
      </div>
      {tooltip && (
        <div
          role="tooltip"
          style={{
            ...styles.tooltip,
            left: tooltip.x,
            top: tooltip.y,
            transform: `translate(-50%, ${tooltip.anchor === 'bottom' ? '0' : '-100%'})`,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
