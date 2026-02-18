/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabListProps = {
  label: string
  children: ReactNode
  style?: CSSProperties
}

type TabProps = {
  id: string
  selected: boolean
  controls: string
  onClick: () => void
  children: ReactNode
  style?: CSSProperties
  className?: string
}

type TabPanelProps = {
  id: string
  labelledBy: string
  hidden?: boolean
  children: ReactNode
  style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TabList({ label, children, style }: TabListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    )
    const current = tabs.findIndex((tab) => tab === document.activeElement)
    if (current === -1) {
      return
    }

    let next = -1
    if (e.key === 'ArrowRight') {
      next = (current + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      next = (current - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = tabs.length - 1
    }

    if (next === -1) {
      return
    }
    e.preventDefault()
    tabs[next].focus()
    tabs[next].click()
  }, [])

  return (
    <div ref={listRef} role="tablist" aria-label={label} style={style} onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}

function Tab({ id, selected, controls, onClick, children, style, className }: TabProps) {
  return (
    <button
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      style={style}
      className={className}
    >
      {children}
    </button>
  )
}

function TabPanel({ id, labelledBy, hidden = false, children, style }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      tabIndex={hidden ? -1 : 0}
      style={hidden ? { ...style, display: 'none' } : style}
    >
      {children}
    </div>
  )
}

export { Tab, TabList, TabPanel }
