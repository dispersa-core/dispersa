/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useCallback, useEffect, useState } from 'react'

interface StageData {
  id: number
  name: string
  description: string
  input: string
  output: string
}

const STAGES: StageData[] = [
  {
    id: 1,
    name: 'Resolve',
    description:
      'Loads the DTCG resolver document, merges sets in order, and applies modifier contexts (themes, platforms, densities) to produce the raw token tree for each permutation.',
    input: 'Resolver document + modifier inputs',
    output: 'Raw token tree per permutation',
  },
  {
    id: 2,
    name: 'Preprocess',
    description:
      'Runs optional preprocessors that transform the raw token document before parsing. Use this to strip vendor metadata, inject computed tokens, or normalize legacy formats.',
    input: 'Raw token tree',
    output: 'Preprocessed token tree',
  },
  {
    id: 3,
    name: 'Parse',
    description:
      'Resolves JSON Pointer references ($ref), flattens nested groups to dot-path keys (e.g. color.brand.primary), inherits group-level $type, and resolves alias references with circular dependency detection.',
    input: 'Preprocessed token tree',
    output: 'Flat map of resolved tokens',
  },
  {
    id: 4,
    name: 'Filter',
    description:
      "Removes tokens that don't match the configured filters. Global filters from BuildConfig run first, then per-output filters from each OutputConfig further narrow the set.",
    input: 'All resolved tokens',
    output: 'Filtered token subset',
  },
  {
    id: 5,
    name: 'Transform',
    description:
      'Applies transforms to convert token values and names for the target platform. Global transforms run first, then per-output transforms.',
    input: 'Filtered tokens',
    output: 'Platform-ready tokens',
  },
  {
    id: 6,
    name: 'Render',
    description:
      'Formats the transformed tokens into the target output: CSS custom properties, JSON, JS/TS modules, Tailwind @theme, Swift/SwiftUI, Kotlin/Compose, or a custom format via defineRenderer.',
    input: 'Platform-ready tokens',
    output: 'CSS, JSON, JS, Swift, Kotlin, etc.',
  },
]

function useAdaptiveColors() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const check = () => setIsDark(mq.matches)
    check()
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [])
  return isDark
}

export default function PipelineVisualizer() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const isDark = useAdaptiveColors()

  const selectedStage = STAGES.find((s) => s.id === selectedId)

  const base = isDark
    ? {
        bg: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.12)',
        text: 'rgba(255, 255, 255, 0.9)',
        muted: 'rgba(255, 255, 255, 0.5)',
        accent: 'rgba(99, 102, 241, 0.85)',
        accentBg: 'rgba(99, 102, 241, 0.2)',
        dot: 'rgba(99, 102, 241, 0.9)',
      }
    : {
        bg: 'rgba(0, 0, 0, 0.04)',
        border: 'rgba(0, 0, 0, 0.12)',
        text: 'rgba(0, 0, 0, 0.85)',
        muted: 'rgba(0, 0, 0, 0.5)',
        accent: 'rgba(67, 56, 202, 0.9)',
        accentBg: 'rgba(99, 102, 241, 0.15)',
        dot: 'rgba(99, 102, 241, 0.9)',
      }

  const styles = {
    container: {
      width: '100%',
      marginTop: 16,
      marginBottom: 24,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    } as const,
    pipelineWrap: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      gap: '8px 4px',
      position: 'relative' as const,
      padding: '8px 0',
    } as const,
    stageRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      gap: '8px 4px',
    } as const,
    stage: (selected: boolean) => ({
      padding: '10px 14px',
      borderRadius: 8,
      border: `2px solid ${selected ? base.accent : base.border}`,
      background: selected ? base.accentBg : base.bg,
      color: base.text,
      fontSize: 13,
      fontWeight: 500 as const,
      cursor: 'pointer',
      transition: 'border-color 0.2s, background 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap' as const,
    }),
    stageNum: {
      fontSize: 11,
      fontWeight: 600 as const,
      opacity: 0.7,
    } as const,
    arrow: {
      color: base.muted,
      fontSize: 12,
      padding: '0 2px',
      flexShrink: 0,
      userSelect: 'none' as const,
    } as const,
    separator: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 4,
      padding: '0 8px',
      flexShrink: 0,
    } as const,
    separatorLine: {
      width: 1,
      flex: 1,
      minHeight: 20,
      background: `linear-gradient(to bottom, transparent, ${base.border}, transparent)`,
    } as const,
    separatorLabel: {
      fontSize: 10,
      fontWeight: 600 as const,
      color: base.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    } as const,
    dotTrack: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      overflow: 'hidden',
    } as const,
    dot: {
      position: 'absolute' as const,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: base.dot,
      boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
      animation: 'pipelineFlow 4s ease-in-out infinite',
    } as const,
    detailPanel: {
      marginTop: 12,
      padding: 16,
      borderRadius: 8,
      border: `1px solid ${base.border}`,
      background: base.bg,
      color: base.text,
      fontSize: 14,
      lineHeight: 1.6,
      animation: 'detailSlideDown 0.25s ease-out',
    } as const,
    detailTitle: {
      fontSize: 16,
      fontWeight: 600 as const,
      marginBottom: 12,
    } as const,
    detailMeta: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
    } as const,
    detailRow: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap' as const,
    } as const,
    detailLabel: {
      fontWeight: 600 as const,
      fontSize: 12,
      color: base.muted,
      minWidth: 48,
    } as const,
  }

  const handleStageClick = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes pipelineFlow {
            0% { left: 0; opacity: 0.5; transform: scale(0.9); }
            5% { opacity: 1; transform: scale(1); }
            95% { opacity: 1; transform: scale(1); }
            100% { left: calc(100% - 8px); opacity: 0.5; transform: scale(0.9); }
          }
          @keyframes detailSlideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={styles.pipelineWrap}>
        <div style={styles.stageRow}>
          {STAGES.map((stage, index) => (
            <span key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleStageClick(stage.id)}
                style={styles.stage(selectedId === stage.id)}
                aria-pressed={selectedId === stage.id}
                aria-label={`Stage ${stage.id}: ${stage.name}. ${stage.description}`}
              >
                <span style={styles.stageNum}>{stage.id}</span>
                {stage.name}
              </button>
              {index === 2 && (
                <span style={styles.separator}>
                  <span style={styles.separatorLabel}>Per-output</span>
                  <span style={styles.separatorLine} />
                </span>
              )}
              {index < STAGES.length - 1 && index !== 2 && (
                <span style={styles.arrow} aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>

        <div style={styles.dotTrack}>
          <div style={styles.dot} />
        </div>
      </div>

      {selectedStage && (
        <div
          style={styles.detailPanel}
          role="region"
          aria-label={`Details for ${selectedStage.name}`}
        >
          <div style={styles.detailTitle}>{selectedStage.name}</div>
          <p style={{ margin: '0 0 12px 0' }}>{selectedStage.description}</p>
          <div style={styles.detailMeta}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Input:</span>
              <span>{selectedStage.input}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Output:</span>
              <span>{selectedStage.output}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
