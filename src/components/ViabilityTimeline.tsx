import { type BusinessProjection } from '../model'

type ViabilityTimelineProps = {
  projection: BusinessProjection
}

export function ViabilityTimeline({ projection }: ViabilityTimelineProps) {
  const W = 560
  const H = 240
  const pad = { top: 22, right: 18, bottom: 34, left: 54 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const years = projection.years
  const maxValue = Math.max(
    1,
    ...years.flatMap((y) => [y.totalRevenue, y.totalCosts]),
  )
  const minYear = projection.startYear
  const maxYear = projection.endYear
  const x = (year: number) =>
    pad.left + ((year - minYear) / (maxYear - minYear)) * plotW
  const y = (value: number) => pad.top + plotH - (value / maxValue) * plotH
  const line = (key: 'totalRevenue' | 'totalCosts') =>
    years.map((d) => `${x(d.year).toFixed(2)},${y(d[key]).toFixed(2)}`).join(' ')
  const marginArea = [
    ...years.map((d) => `${x(d.year).toFixed(2)},${y(d.totalRevenue).toFixed(2)}`),
    ...years
      .slice()
      .reverse()
      .map((d) => `${x(d.year).toFixed(2)},${y(d.totalCosts).toFixed(2)}`),
  ].join(' ')
  const yTicks = [0, 0.5, 1].map((t) => Math.round(maxValue * t))
  const breakX =
    projection.breakYear === null ? null : x(projection.breakYear)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="timeline"
      role="img"
      aria-label="Projected revenue and cost curves from 2026 to 2040"
    >
      <rect x={pad.left} y={pad.top} width={plotW} height={plotH} className="timeline-bg" rx={6} />

      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={W - pad.right} y1={y(tick)} y2={y(tick)} className="timeline-grid" />
          <text x={pad.left - 10} y={y(tick) + 4} textAnchor="end" className="timeline-tick">
            £{tick >= 1_000_000 ? `${(tick / 1_000_000).toFixed(1)}m` : `${Math.round(tick / 1000)}k`}
          </text>
        </g>
      ))}

      <polygon points={marginArea} className={projection.margin2040 >= 0 ? 'timeline-margin-pos' : 'timeline-margin-neg'} />
      <polyline points={line('totalRevenue')} className="timeline-line timeline-revenue" />
      <polyline points={line('totalCosts')} className="timeline-line timeline-costs" />

      {years
        .filter((d) => d.year % 2 === 0 || d.year === maxYear)
        .map((d) => (
          <g key={d.year}>
            <circle cx={x(d.year)} cy={y(d.totalRevenue)} r={2.7} className="timeline-dot timeline-dot-revenue">
              <title>
                {d.year} revenue: £{Math.round(d.totalRevenue).toLocaleString('en-GB')}
              </title>
            </circle>
            <circle cx={x(d.year)} cy={y(d.totalCosts)} r={2.7} className="timeline-dot timeline-dot-costs">
              <title>
                {d.year} costs: £{Math.round(d.totalCosts).toLocaleString('en-GB')}
              </title>
            </circle>
          </g>
        ))}

      {breakX !== null && (
        <g>
          <line x1={breakX} x2={breakX} y1={pad.top} y2={pad.top + plotH} className="timeline-break-line" />
          <text x={breakX + 6} y={pad.top + 14} className="timeline-break-label">
            break
          </text>
        </g>
      )}

      {[minYear, 2030, 2035, maxYear].map((year) => (
        <text key={year} x={x(year)} y={H - 12} textAnchor="middle" className="timeline-year">
          {year}
        </text>
      ))}

      <g className="timeline-legend" transform={`translate(${pad.left}, 12)`}>
        <circle cx={0} cy={0} r={4} className="timeline-dot-revenue" />
        <text x={9} y={4}>Revenue</text>
        <circle cx={78} cy={0} r={4} className="timeline-dot-costs" />
        <text x={87} y={4}>Costs</text>
      </g>
    </svg>
  )
}
