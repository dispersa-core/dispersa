/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useMemo } from 'react'

type Category = 'all' | 'primitive' | 'composite'

interface TokenCard {
  id: string
  name: string
  category: 'primitive' | 'composite'
  json: string
  preview: React.ReactNode
}

const TOKEN_CARDS: TokenCard[] = [
  {
    id: 'color',
    name: 'color',
    category: 'primitive',
    json: `colorSpace: 'srgb'
components: [0.2, 0.4, 0.9]`,
    preview: (
      <div
        style={{
          width: '100%',
          height: 48,
          borderRadius: 8,
          background: 'rgb(51, 102, 230)',
        }}
      />
    ),
  },
  {
    id: 'dimension',
    name: 'dimension',
    category: 'primitive',
    json: `value: 16
unit: 'px'`,
    preview: (
      <div
        style={{
          width: '100%',
          height: 32,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 16,
            height: 12,
            borderRadius: 2,
            background: 'var(--sl-color-accent, #5468ff)',
          }}
        />
      </div>
    ),
  },
  {
    id: 'fontFamily',
    name: 'fontFamily',
    category: 'primitive',
    json: `['Inter', 'sans-serif']`,
    preview: (
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        Aa Bb 123
      </div>
    ),
  },
  {
    id: 'fontWeight',
    name: 'fontWeight',
    category: 'primitive',
    json: '700',
    preview: <div style={{ fontWeight: 700, fontSize: 16 }}>Bold text</div>,
  },
  {
    id: 'duration',
    name: 'duration',
    category: 'primitive',
    json: `value: 200
unit: 'ms'`,
    preview: <DurationPreview />,
  },
  {
    id: 'cubicBezier',
    name: 'cubicBezier',
    category: 'primitive',
    json: '[0.4, 0, 0.2, 1]',
    preview: <CubicBezierPreview />,
  },
  {
    id: 'number',
    name: 'number',
    category: 'primitive',
    json: '1.5',
    preview: <div style={{ fontSize: 24, fontWeight: 600 }}>1.5</div>,
  },
  {
    id: 'shadow',
    name: 'shadow',
    category: 'composite',
    json: `offsetX: {value: 0, unit: 'px'}
offsetY: {value: 4, unit: 'px'}
blur: {value: 8, unit: 'px'}
color: {srgb [0,0,0] a:0.25}`,
    preview: (
      <div
        style={{
          width: '100%',
          height: 48,
          borderRadius: 8,
          background: 'var(--sl-color-bg-inline-code, #2a2d3a)',
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.25)',
        }}
      />
    ),
  },
  {
    id: 'typography',
    name: 'typography',
    category: 'composite',
    json: `fontFamily, fontSize
fontWeight, lineHeight`,
    preview: (
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        Typography sample
      </div>
    ),
  },
  {
    id: 'border',
    name: 'border',
    category: 'composite',
    json: `color: {srgb [0, 0.4, 0.8]}
width: {value: 1, unit: 'px'}
style: 'solid'`,
    preview: (
      <div
        style={{
          width: '100%',
          height: 48,
          borderRadius: 8,
          border: '2px solid #0066CC',
          background: 'transparent',
        }}
      />
    ),
  },
  {
    id: 'strokeStyle',
    name: 'strokeStyle',
    category: 'composite',
    json: `'dashed' or
dashArray: [{4px}, {2px}]
lineCap: 'round'`,
    preview: (
      <svg width="100%" height={24} style={{ overflow: 'visible' }}>
        <line
          x1={0}
          y1={12}
          x2="100%"
          y2={12}
          stroke="var(--sl-color-accent, #5468ff)"
          strokeWidth={2}
          strokeDasharray="4 2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'transition',
    name: 'transition',
    category: 'composite',
    json: `duration: {value: 200, unit: 'ms'}
delay: {value: 0, unit: 'ms'}
timingFunction: [0.25, 0.1, ...]`,
    preview: <TransitionPreview />,
  },
  {
    id: 'gradient',
    name: 'gradient',
    category: 'composite',
    json: `[{color: {srgb [...]}, position: 0},
 {color: {srgb [...]}, position: 1}]`,
    preview: (
      <div
        style={{
          width: '100%',
          height: 48,
          borderRadius: 8,
          background: 'linear-gradient(90deg, #0066CC 0%, #00CC66 100%)',
        }}
      />
    ),
  },
]

function DurationPreview() {
  const [active, setActive] = useState(false)
  return (
    <div
      style={{
        width: '100%',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onClick={() => setActive((a) => !a)}
      onKeyDown={(e) => e.key === 'Enter' && setActive((a) => !a)}
      role="button"
      tabIndex={0}
      aria-label="Toggle animation"
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--sl-color-accent, #5468ff)',
          transform: active ? 'translateX(60px)' : 'translateX(0)',
          transition: 'transform 200ms ease',
        }}
      />
    </div>
  )
}

function CubicBezierPreview() {
  return (
    <svg width="100%" height={48} viewBox="0 0 100 48" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sl-color-accent, #5468ff)" />
          <stop offset="100%" stopColor="var(--sl-color-accent-high, #93b5ff)" />
        </linearGradient>
      </defs>
      <path
        d="M 0 44 C 40 44, 60 4, 100 4"
        fill="none"
        stroke="url(#curveGrad)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}

function TransitionPreview() {
  const [active, setActive] = useState(false)
  return (
    <div
      style={{
        width: '100%',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={() => setActive((a) => !a)}
      onKeyDown={(e) => e.key === 'Enter' && setActive((a) => !a)}
      role="button"
      tabIndex={0}
      aria-label="Toggle transition"
    >
      <div
        style={{
          width: 40,
          height: 24,
          borderRadius: 4,
          background: active
            ? 'var(--sl-color-accent, #5468ff)'
            : 'var(--sl-color-gray-5, #3d4152)',
          opacity: active ? 1 : 0.6,
          transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      />
    </div>
  )
}

const FILTER_BUTTONS: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'primitive', label: 'Primitive' },
  { value: 'composite', label: 'Composite' },
]

export default function TokenTypeGallery() {
  const [filter, setFilter] = useState<Category>('all')

  const filteredCards = useMemo(
    () => (filter === 'all' ? TOKEN_CARDS : TOKEN_CARDS.filter((c) => c.category === filter)),
    [filter],
  )

  const baseStyles = {
    fontFamily: 'var(--sl-font-system-mono, ui-monospace, monospace)',
    color: 'var(--sl-color-text)',
  }

  const cardBg = 'color-mix(in srgb, var(--sl-color-bg-inline-code) 60%, transparent)'
  const cardBorder = '1px solid var(--sl-color-hairline-light)'
  const pillBgActive = 'var(--sl-color-accent)'
  const pillBgInactive = 'color-mix(in srgb, var(--sl-color-bg-inline-code) 80%, transparent)'
  const pillColorActive = 'var(--sl-color-text-invert)'
  const pillColorInactive = 'var(--sl-color-text)'
  const jsonKeyColor = 'var(--sl-color-orange)'
  const jsonStringColor = 'var(--sl-color-green)'
  const jsonNumberColor = 'var(--sl-color-blue)'

  return (
    <div
      style={{
        ...baseStyles,
        fontSize: 'var(--sl-text-body-sm, 13px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {FILTER_BUTTONS.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => setFilter(btn.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              background: filter === btn.value ? pillBgActive : pillBgInactive,
              color: filter === btn.value ? pillColorActive : pillColorInactive,
              fontSize: 'var(--sl-text-xs, 13px)',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {filteredCards.map((card) => (
          <div
            key={card.id}
            style={{
              border: cardBorder,
              borderRadius: 12,
              overflow: 'hidden',
              background: cardBg,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: cardBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--sl-text-base)',
                }}
              >
                {card.name}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background:
                    card.category === 'primitive'
                      ? 'color-mix(in srgb, var(--sl-color-blue) 25%, transparent)'
                      : 'color-mix(in srgb, var(--sl-color-purple) 25%, transparent)',
                  color:
                    card.category === 'primitive'
                      ? 'var(--sl-color-blue-high)'
                      : 'var(--sl-color-purple-high)',
                }}
              >
                {card.category}
              </span>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderBottom: cardBorder,
                fontFamily: 'var(--sl-font-system-mono)',
                fontSize: 11,
                lineHeight: 1.5,
                color: 'var(--sl-color-gray-3)',
                background: 'color-mix(in srgb, var(--sl-color-black) 15%, transparent)',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {card.json.split('\n').map((line) => (
                  <React.Fragment key={line}>
                    {formatJsonLine(line, jsonKeyColor, jsonStringColor, jsonNumberColor)}
                    {'\n'}
                  </React.Fragment>
                ))}
              </pre>
            </div>

            <div
              style={{
                padding: 12,
                minHeight: 60,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {card.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatJsonLine(line: string, keyColor: string, stringColor: string, numberColor: string) {
  const parts: React.ReactNode[] = []
  let key = 0
  const keyMatch = line.match(/^(\w+):\s*/)
  if (keyMatch) {
    parts.push(
      <span key={key++} style={{ color: keyColor }}>
        {keyMatch[1]}:{' '}
      </span>,
    )
    line = line.slice(keyMatch[0].length)
  }
  if (/^['"].*['"]$/.test(line.trim())) {
    parts.push(
      <span key={key++} style={{ color: stringColor }}>
        {line}
      </span>,
    )
  } else if (/^\d+(\.\d+)?$/.test(line.trim())) {
    parts.push(
      <span key={key++} style={{ color: numberColor }}>
        {line}
      </span>,
    )
  } else if (line.includes('[')) {
    const idx = line.indexOf('[')
    if (idx > 0) {
      parts.push(<span key={key++}>{line.slice(0, idx)}</span>)
    }
    parts.push(
      <span key={key++} style={{ color: stringColor }}>
        {line.slice(idx)}
      </span>,
    )
  } else {
    parts.push(<span key={key++}>{line}</span>)
  }
  return parts
}
