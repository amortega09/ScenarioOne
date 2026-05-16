import { type BusinessViability } from './model'

type Segment = { key: string; label: string; value: number; color: string }

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-GB')
}

function Legend({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) {
    return <span className="revbar-legend-empty">none</span>
  }
  return (
    <>
      {segments.map((s) => (
        <span key={s.key} className="revbar-legend-item" title={`${s.label}: £${fmt(s.value)}`}>
          <span className="revbar-legend-dot" style={{ background: s.color }} />
          <span className="revbar-legend-label">{s.label}</span>
          <span className="revbar-legend-value">£{fmt(s.value)}</span>
        </span>
      ))}
    </>
  )
}

// Horizontal stacked bar: upper row = revenue composition (crop, subsidy, ELM, BNG, regen
// premium); lower row = exposure (subsidy at risk, input shock, water loss). Both share
// the same scale so magnitude is comparable across the two. A labelled legend sits under
// each track so segments are identifiable without hover.
export function RevenueBar({ viability }: { viability: BusinessViability }) {
  const W = 340
  const trackH = 22

  const upSegments: Segment[] = [
    { key: 'crop',    label: 'Crop revenue',  value: viability.cropRevenue,   color: '#7a9c6d' },
    { key: 'subsidy', label: 'Subsidy',       value: viability.subsidyIncome, color: '#a8b88a' },
    { key: 'elm',     label: 'ELM uplift',    value: viability.elmUplift,     color: '#5c8a55' },
    { key: 'bng',     label: 'BNG income',    value: viability.bngIncome,     color: '#436843' },
    { key: 'regen',   label: 'Regen premium', value: viability.regenPremium,  color: '#345237' },
  ].filter((s) => s.value > 0)

  const dnSegments: Segment[] = [
    { key: 'subAtRisk', label: 'Subsidy at risk',    value: viability.subsidyAtRisk,    color: '#b07a2a' },
    { key: 'nShock',    label: 'Input cost shock',   value: viability.nCostShock,       color: '#a14a3a' },
    { key: 'waterLoss', label: 'Water revenue loss', value: viability.waterRevenueLoss, color: '#8a3a2e' },
  ].filter((s) => s.value > 0)

  const scale = Math.max(viability.totalRevenue, 1)

  let cursor = 0
  const upRects = upSegments.map((s) => {
    const w = (s.value / scale) * W
    const x = cursor
    cursor += w
    return { ...s, x, w }
  })

  cursor = 0
  const dnRects = dnSegments.map((s) => {
    const w = (s.value / scale) * W
    const x = cursor
    cursor += w
    return { ...s, x, w }
  })

  return (
    <div className="revbar-wrap">
      <div className="revbar-row">
        <div className="revbar-axis-label">Revenue</div>
        <svg viewBox={`0 0 ${W} ${trackH}`} className="revbar" role="img" aria-label="Revenue composition">
          <rect x={0} y={0} width={W} height={trackH} className="revbar-track" rx={4} />
          {upRects.map((s) => (
            <rect key={s.key} x={s.x} y={0} width={Math.max(s.w - 1, 0)} height={trackH} fill={s.color} rx={3}>
              <title>{s.label}: £{fmt(s.value)}</title>
            </rect>
          ))}
        </svg>
        <div className="revbar-legend"><Legend segments={upSegments} /></div>
      </div>

      <div className="revbar-row">
        <div className="revbar-axis-label">Exposure</div>
        <svg viewBox={`0 0 ${W} ${trackH}`} className="revbar" role="img" aria-label="Financial exposure">
          <rect x={0} y={0} width={W} height={trackH} className="revbar-track" rx={4} />
          {dnRects.map((s) => (
            <rect key={s.key} x={s.x} y={0} width={Math.max(s.w - 1, 0)} height={trackH} fill={s.color} rx={3} opacity={0.9}>
              <title>{s.label}: £{fmt(s.value)}</title>
            </rect>
          ))}
        </svg>
        <div className="revbar-legend"><Legend segments={dnSegments} /></div>
      </div>
    </div>
  )
}
