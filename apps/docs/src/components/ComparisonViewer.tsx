/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

export interface ComparisonPanel {
  label: string
  language: string
  code: string
}

interface ComparisonViewerProps {
  before: ComparisonPanel
  after: ComparisonPanel
}

function highlightCode(code: string, language: string): ReactNode[] {
  if (language === 'json') {
    return highlightJson(code)
  }
  if (language === 'typescript' || language === 'ts') {
    return highlightTypeScript(code)
  }
  return [<span key="0">{code}</span>]
}

function highlightJson(code: string): ReactNode[] {
  const parts: ReactNode[] = []
  // Simple regex-based highlighting for JSON
  const keyRegex = /"([^"]+)":\s*/g
  const stringRegex = /: "([^"]*)"/g
  const numberRegex = /: (\d+)/g
  const keywordRegex = /\b(true|false|null)\b/g

  let lastIndex = 0
  const matches: Array<{
    start: number
    end: number
    type: 'key' | 'string' | 'number' | 'keyword'
    value: string
  }> = []

  let m
  while ((m = keyRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'key', value: m[0] })
  }
  while ((m = stringRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'string', value: m[0] })
  }
  while ((m = numberRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'number', value: m[0] })
  }
  while ((m = keywordRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'keyword', value: m[0] })
  }

  matches.sort((a, b) => a.start - b.start)

  const colorMap = {
    key: 'var(--sl-color-orange, #f97316)',
    string: 'var(--sl-color-green, #22c55e)',
    number: 'var(--sl-color-blue, #3b82f6)',
    keyword: 'var(--sl-color-purple, #a855f7)',
  }

  for (const match of matches) {
    if (match.start < lastIndex) {
      continue
    }
    if (match.start > lastIndex) {
      parts.push(
        <span key={`raw-${lastIndex}`} style={{ color: 'var(--sl-color-text-2, #94a3b8)' }}>
          {code.slice(lastIndex, match.start)}
        </span>,
      )
    }
    parts.push(
      <span key={`${match.start}`} style={{ color: colorMap[match.type] }}>
        {match.value}
      </span>,
    )
    lastIndex = match.end
  }
  if (lastIndex < code.length) {
    parts.push(
      <span key={`raw-end`} style={{ color: 'var(--sl-color-text-2, #94a3b8)' }}>
        {code.slice(lastIndex)}
      </span>,
    )
  }
  return parts.length > 0 ? parts : [<span key="0">{code}</span>]
}

function highlightTypeScript(code: string): ReactNode[] {
  const keywords = [
    'import',
    'from',
    'export',
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'async',
    'await',
    'type',
    'interface',
    'as',
  ]
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  const stringRegex = /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g
  const numberRegex = /\b\d+(\.\d+)?\b/g

  const matches: Array<{
    start: number
    end: number
    type: 'key' | 'string' | 'number' | 'keyword'
    value: string
  }> = []
  let m
  while ((m = keywordRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'keyword', value: m[0] })
  }
  while ((m = stringRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'string', value: m[0] })
  }
  while ((m = numberRegex.exec(code)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'number', value: m[0] })
  }

  matches.sort((a, b) => a.start - b.start)

  const colorMap = {
    key: 'var(--sl-color-orange, #f97316)',
    string: 'var(--sl-color-green, #22c55e)',
    number: 'var(--sl-color-blue, #3b82f6)',
    keyword: 'var(--sl-color-purple, #a855f7)',
  }

  const parts: ReactNode[] = []
  let lastIndex = 0
  for (const match of matches) {
    if (match.start < lastIndex) {
      continue
    }
    if (match.start > lastIndex) {
      parts.push(
        <span key={`raw-${lastIndex}`} style={{ color: 'var(--sl-color-text-2, #94a3b8)' }}>
          {code.slice(lastIndex, match.start)}
        </span>,
      )
    }
    parts.push(
      <span key={`${match.start}`} style={{ color: colorMap[match.type] }}>
        {match.value}
      </span>,
    )
    lastIndex = match.end
  }
  if (lastIndex < code.length) {
    parts.push(
      <span key="raw-end" style={{ color: 'var(--sl-color-text-2, #94a3b8)' }}>
        {code.slice(lastIndex)}
      </span>,
    )
  }
  return parts.length > 0 ? parts : [<span key="0">{code}</span>]
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    width: '100%',
    maxWidth: '100%',
    fontFamily: 'var(--sl-font-system, ui-sans-serif, system-ui, sans-serif)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 0,
    minHeight: 200,
  },
  rowMobile: {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto auto auto',
  },
  panelMobile: {
    borderLeft: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
    borderRight: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: 0,
    overflow: 'hidden',
    border: '1px solid var(--sl-color-hairline-light, rgba(0,0,0,0.08))',
  },
  panelFirst: {
    borderTopRightRadius: 0,
    borderRight: 'none',
  },
  panelLast: {
    borderTopLeftRadius: 0,
    borderLeft: 'none',
  },
  headerBefore: {
    padding: '10px 14px',
    background:
      'color-mix(in srgb, var(--sl-color-red, #ef4444) 18%, var(--sl-color-surface-2, #27272a))',
    color: 'var(--sl-color-text, #fafafa)',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
  },
  headerAfter: {
    padding: '10px 14px',
    background:
      'color-mix(in srgb, var(--sl-color-green, #22c55e) 18%, var(--sl-color-surface-2, #27272a))',
    color: 'var(--sl-color-text, #fafafa)',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
  },
  codeBlock: {
    flex: 1,
    padding: 16,
    overflowX: 'auto' as const,
    overflowY: 'auto' as const,
    background: 'var(--sl-color-bg-inline-code, #1e1e2e)',
    fontFamily: 'var(--sl-font-system-mono, ui-monospace, SF Mono, monospace)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre' as const,
    wordBreak: 'break-word' as const,
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--sl-color-bg-inline-code, #1e1e2e)',
    color: 'var(--sl-color-text-2, #64748b)',
    fontSize: 18,
    padding: 8,
    borderTop: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
    borderBottom: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
  },
  separatorMobile: {
    padding: 4,
    fontSize: 14,
  },
}

export default function ComparisonViewer({ before, after }: ComparisonViewerProps) {
  const [mobile, setMobile] = useState(false)
  const beforeHighlighted = useMemo(
    () => highlightCode(before.code, before.language),
    [before.code, before.language],
  )
  const afterHighlighted = useMemo(
    () => highlightCode(after.code, after.language),
    [after.code, after.language],
  )

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.row,
          ...(mobile ? styles.rowMobile : {}),
        }}
      >
        <div
          style={{
            ...styles.panel,
            ...(mobile ? styles.panelMobile : styles.panelFirst),
          }}
        >
          <div style={styles.headerBefore}>{before.label}</div>
          <div style={styles.codeBlock}>
            <pre style={styles.pre}>{beforeHighlighted}</pre>
          </div>
        </div>
        <div
          style={{
            ...styles.separator,
            flexDirection: 'column',
            minWidth: 40,
            borderLeft: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
            borderRight: '1px solid var(--sl-color-hairline-light, rgba(255,255,255,0.06))',
          }}
          aria-hidden
        >
          →
        </div>
        <div
          style={{
            ...styles.panel,
            ...(mobile ? styles.panelMobile : styles.panelLast),
          }}
        >
          <div style={styles.headerAfter}>{after.label}</div>
          <div style={styles.codeBlock}>
            <pre style={styles.pre}>{afterHighlighted}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
