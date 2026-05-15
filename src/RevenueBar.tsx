import { type BusinessViability } from './model'

// Horizontal stacked bar: upper row = revenue composition (crop, subsidy, ELM, BNG, regen
// premium); lower row = exposure (subsidy at risk, input shock, water loss). Both share
// the same scale so magnitude is comparable across the two.
export function RevenueBar({ viability }: { viability: BusinessViability }) {
  const W = 340
  const H = 96
  const trackH = 22
  const gap = 16

  const upSegments = [
    { key: 'crop',    label: 'Crop revenue',  value: viability.cropRevenue,   color: '#7a9c6d' },
    { key: 'subsidy', label: 'Subsidy',       value: viability.subsidyIncome, color: '#a8b88a' },
    { key: 'elm',     label: 'ELM uplift',    value: viability.elmUplift,     color: '#5c8a55' },
    { key: 'bng',     label: 'BNG income',    value: viability.bngIncome,     color: '#436843' },
    { key: 'regen',   label: 'Regen premium', value: viability.regenPremium,  color: '#345237' },
  ].filter((s) => s.value > 0)

  const dnSegments = [
    { key: 'subAtRisk', label: 'Subsidy at risk',    value: viability.subsidyAtRisk,    color: '#b07a2a' },
    { key: 'nShock',    label: 'Input cost shock',   value: viability.nCostShock,       color: '#a14a3a' },
    { key: 'waterLoss', label: 'Water revenue loss', value: viability.waterRevenueLoss, color: '#8a3a2e' },
  ].filter((s) => s.value > 0)

  const scale = Math.max(viability.totalRevenue, 1)
  const upY = 18
  const dnY = upY + trackH + gap

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
    <svg viewBox={`0 0 ${W} ${H}`} className="revbar" role="img" aria-label="Revenue composition versus exposure">
      <text x={0} y={12} className="revbar-axis">Revenue</text>
      <rect x={0} y={upY} width={W} height={trackH} className="revbar-track" rx={4} />
      {upRects.map((s) => (
        <rect key={s.key} x={s.x} y={upY} width={Math.max(s.w - 1, 0)} height={trackH} fill={s.color} rx={3}>
          <title>{s.label}: £{Math.round(s.value).toLocaleString('en-GB')}</title>
        </rect>
      ))}

      <text x={0} y={dnY - 6} className="revbar-axis">Exposure</text>
      <rect x={0} y={dnY} width={W} height={trackH} className="revbar-track" rx={4} />
      {dnRects.map((s) => (
        <rect key={s.key} x={s.x} y={dnY} width={Math.max(s.w - 1, 0)} height={trackH} fill={s.color} rx={3} opacity={0.85}>
          <title>{s.label}: £{Math.round(s.value).toLocaleString('en-GB')}</title>
        </rect>
      ))}
    </svg>
  )
}
