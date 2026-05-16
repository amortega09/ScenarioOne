import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  REGIONS,
  CROPS,
  SOIL_TYPES,
  BUSINESS_MODELS,
  computeAssessment,
  computeBusinessViability,
  computeBusinessProjection,
  type FarmInputs,
  type CropRow,
  type CropKey,
  type RegionKey,
  type SoilTypeKey,
  type BusinessModelKey,
  type VectorResult,
  type Band,
} from './model'
import { RevenueBar } from './RevenueBar'
import { ViabilityTimeline } from './ViabilityTimeline'

const DEFAULT_INPUTS: FarmInputs = {
  region: 'east_england',
  crops: [
    { uid: 'a1', crop: 'wheat', hectares: 180 },
    { uid: 'a2', crop: 'osr', hectares: 60 },
    { uid: 'a3', crop: 'barley', hectares: 80 },
  ],
  irrigationPct: 15,
  fertiliserIntensity: 65,
  soilType: 'loam',
  businessModelType: 'high_input_commodity',
  subsidyDependence: 40,
}

function newRow(): CropRow {
  return { uid: Math.random().toString(36).slice(2, 9), crop: '', hectares: 0 }
}

function bandColor(key: Band['key']) {
  if (key === 'critical') return '#a14a3a'
  if (key === 'risk') return '#b07a2a'
  if (key === 'sustainable') return '#436843'
  return '#345237'
}

type SpiderProps = {
  vectors: VectorResult[]
  score: number
  bandKey: Band['key']
}

function SpiderChart({ vectors, score, bandKey }: SpiderProps) {
  const cx = 170
  const cy = 145
  const radius = 92
  const labelRadius = 116
  const n = vectors.length

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const valuePoints = vectors
    .map((v, i) => {
      const p = point(i, radius * (v.score / 100))
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
    })
    .join(' ')

  const color = bandColor(bandKey)

  return (
    <svg
      viewBox="0 0 340 290"
      className="spider"
      role="img"
      aria-label="Five-vector viability profile"
    >
      {gridLevels.map((level, gi) => {
        const pts = vectors
          .map((_, i) => {
            const p = point(i, radius * level)
            return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
          })
          .join(' ')
        return <polygon key={gi} points={pts} className="spider-grid" />
      })}

      {vectors.map((_, i) => {
        const p = point(i, radius)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            className="spider-axis"
          />
        )
      })}

      <polygon
        points={valuePoints}
        className="spider-value"
        style={{ fill: color, fillOpacity: 0.15, stroke: color }}
      />

      {vectors.map((v, i) => {
        const p = point(i, radius * (v.score / 100))
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            className="spider-dot"
            style={{ fill: color }}
          />
        )
      })}

      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" className="spider-center-score">
        {score}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" className="spider-center-label">
        Viability
      </text>

      {vectors.map((v, i) => {
        const p = point(i, labelRadius)
        const a = angle(i)
        const cos = Math.cos(a)
        const anchor: 'start' | 'middle' | 'end' =
          cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
        const labelDy = anchor === 'middle' && Math.sin(a) > 0 ? 12 : -4
        return (
          <g key={i}>
            <text
              x={p.x}
              y={p.y + labelDy}
              textAnchor={anchor}
              className="spider-label"
            >
              {v.label}
            </text>
            <text
              x={p.x}
              y={p.y + labelDy + 16}
              textAnchor={anchor}
              className="spider-score"
            >
              {v.score}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function App() {
  const [inputs, setInputs] = useState<FarmInputs>(DEFAULT_INPUTS)

  const assessment = useMemo(() => computeAssessment(inputs), [inputs])
  const { score, band, vectors, levers, totalHa, totals } = assessment
  const deficits = vectors.filter((v) => v.deficit)

  const viability = useMemo(
    () => computeBusinessViability(inputs, assessment),
    [inputs, assessment],
  )
  const projection = useMemo(
    () => computeBusinessProjection(inputs, assessment, viability),
    [inputs, assessment, viability],
  )

  const fmt = (n: number, digits = 0) =>
    n.toLocaleString('en-GB', { maximumFractionDigits: digits })
  const fmtYear = (n: number) => n.toFixed(1).replace(/\.0$/, '')

  const [planOpen, setPlanOpen] = useState(false)
  const [riskOpen, setRiskOpen] = useState(false)
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [equationsOpen, setEquationsOpen] = useState(false)
  const [analysisView, setAnalysisView] = useState<'nature' | 'financial'>('nature')

  useEffect(() => {
    if (!planOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlanOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [planOpen])

  useEffect(() => {
    if (!riskOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRiskOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [riskOpen])

  useEffect(() => {
    if (!assumptionsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAssumptionsOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [assumptionsOpen])

  useEffect(() => {
    if (!equationsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEquationsOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [equationsOpen])

  const projected = useMemo(() => {
    const map: Record<string, number> = {}
    for (const v of vectors) map[v.key] = v.score
    for (const l of levers) {
      for (const [k, delta] of Object.entries(l.impact)) {
        map[k] = Math.min(100, (map[k] ?? 0) + (delta ?? 0))
      }
    }
    const projectedVectors = vectors.map((v) => ({ ...v, score: map[v.key] ?? v.score }))
    const arr = projectedVectors.map((v) => v.score)
    const avg = arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0
    const liftedScore = Math.round(avg)
    const projectedAssessment = { ...assessment, score: liftedScore, vectors: projectedVectors }
    const projectedViability = computeBusinessViability(inputs, projectedAssessment)
    return {
      score: liftedScore,
      lift: Math.round(avg - score),
      viability: projectedViability,
    }
  }, [vectors, levers, score, assessment, inputs])

  const updateCrop = (uid: string, patch: Partial<CropRow>) => {
    setInputs((prev) => ({
      ...prev,
      crops: prev.crops.map((c) => (c.uid === uid ? { ...c, ...patch } : c)),
    }))
  }
  const addCrop = () =>
    setInputs((prev) => ({ ...prev, crops: [...prev.crops, newRow()] }))
  const removeCrop = (uid: string) =>
    setInputs((prev) => ({ ...prev, crops: prev.crops.filter((c) => c.uid !== uid) }))

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src="/logo.jpeg" className="brand-mark-img" alt="ScenarioOne Logo" width="360" />
        </div>
        <span className="header-tag">Business-Model Nature Stress Test</span>
      </header>

      <section className="hero">
        <p>
          Enter your UK crop operation. We stress-test it against the UK's 2040
          nature-positive pathway derived from the 25 Year Environment Plan,
          EIP 2023 and Kunming-Montreal targets and return where the business
          model breaks and how to close the gap.
        </p>
      </section>

      <div className="grid">
        <div className="card">
          <h2>Farm profile</h2>
          <p className="card-sub">
            Describe the operation. Inputs feed the 2040 stress test on the right.
          </p>

          <div className="form">
            <details className="form-group" open>
              <summary className="form-group-head">
                <span className="form-group-title">Geography</span>
                <svg className="form-group-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="form-group-body">
                <div className="field-pair">
                  <div className="field">
                    <label className="field-label" htmlFor="region">Region</label>
                    <select
                      id="region"
                      className="select"
                      value={inputs.region}
                      onChange={(e) =>
                        setInputs({ ...inputs, region: e.target.value as RegionKey })
                      }
                    >
                      {REGIONS.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="soil">Soil type</label>
                    <select
                      id="soil"
                      className="select"
                      value={inputs.soilType}
                      onChange={(e) =>
                        setInputs({ ...inputs, soilType: e.target.value as SoilTypeKey })
                      }
                    >
                      {SOIL_TYPES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </details>

            <details className="form-group" open>
              <summary className="form-group-head">
                <span className="form-group-title">Crops</span>
                <span className="form-group-meta">{totalHa.toLocaleString()} ha total</span>
                <svg className="form-group-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="form-group-body">
                <div className="field">
                  <div className="crop-list">
                    {inputs.crops.map((row) => (
                      <div key={row.uid} className="crop-row">
                        <select
                          className="select select-crop"
                          value={row.crop}
                          onChange={(e) =>
                            updateCrop(row.uid, { crop: e.target.value as CropKey })
                          }
                        >
                          <option value="">Select crop…</option>
                          {CROPS.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                        <div className="ha-wrap">
                          <input
                            className="ha-input"
                            type="number"
                            min={0}
                            step={1}
                            value={row.hectares || ''}
                            onChange={(e) =>
                              updateCrop(row.uid, {
                                hectares: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                          />
                          <span className="ha-suffix">ha</span>
                        </div>
                        <button
                          type="button"
                          className="row-remove"
                          onClick={() => removeCrop(row.uid)}
                          aria-label="Remove crop"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="add-row" onClick={addCrop}>
                    + Add crop
                  </button>
                </div>
              </div>
            </details>

            <details className="form-group" open>
              <summary className="form-group-head">
                <span className="form-group-title">Practices</span>
                <svg className="form-group-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="form-group-body">
                <div className="slider">
                  <div className="slider-row">
                    <label className="slider-label" htmlFor="irrigation">
                      Irrigation share
                      <span className="muted">— % of area irrigated</span>
                    </label>
                    <span className="slider-value">{inputs.irrigationPct}%</span>
                  </div>
                  <input
                    id="irrigation"
                    type="range"
                    className="range"
                    min={0}
                    max={100}
                    step={1}
                    value={inputs.irrigationPct}
                    onChange={(e) =>
                      setInputs({ ...inputs, irrigationPct: Number(e.target.value) })
                    }
                    style={{ ['--pct' as string]: `${inputs.irrigationPct}%` }}
                  />
                </div>

                <div className="slider">
                  <div className="slider-row">
                    <label className="slider-label" htmlFor="fert">
                      Fertiliser intensity
                      <span className="muted">— synthetic N use</span>
                    </label>
                    <span className="slider-value">{inputs.fertiliserIntensity}</span>
                  </div>
                  <input
                    id="fert"
                    type="range"
                    className="range"
                    min={0}
                    max={100}
                    step={1}
                    value={inputs.fertiliserIntensity}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        fertiliserIntensity: Number(e.target.value),
                      })
                    }
                    style={{ ['--pct' as string]: `${inputs.fertiliserIntensity}%` }}
                  />
                </div>
              </div>
            </details>

            <details className="form-group" open>
              <summary className="form-group-head">
                <span className="form-group-title">Financial</span>
                <svg className="form-group-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="form-group-body">
                <div className="field">
                  <label className="field-label" htmlFor="business-model">Business model</label>
                  <select
                    id="business-model"
                    className="select"
                    value={inputs.businessModelType}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        businessModelType: e.target.value as BusinessModelKey,
                      })
                    }
                  >
                    {BUSINESS_MODELS.map((b) => (
                      <option key={b.key} value={b.key}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div className="slider">
                  <div className="slider-row">
                    <label className="slider-label" htmlFor="subsidy">
                      Subsidy dependence
                      <span className="muted">— % revenue from subsidies</span>
                    </label>
                    <span className="slider-value">{inputs.subsidyDependence}%</span>
                  </div>
              <input
                id="subsidy"
                type="range"
                className="range"
                min={0}
                max={100}
                step={1}
                value={inputs.subsidyDependence}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    subsidyDependence: Number(e.target.value),
                  })
                }
                style={{ ['--pct' as string]: `${inputs.subsidyDependence}%` }}
              />
                </div>
              </div>
            </details>
          </div>

          <button
            className="reset"
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
          >
            Reset to baseline
          </button>
        </div>

        <div className="card assessment">
          <div className="assessment-head">
            <h2>Stress Test Analysis</h2>
            <div className="assessment-btns">
              {(deficits.length > 0 || viability.flags.length > 0 || viability.verdict.key !== 'viable') && (
                <button
                  type="button"
                  className="assess-btn assess-btn-risk"
                  onClick={() => setRiskOpen(true)}
                  id="at-risk-btn"
                >
                  At Risk
                  <span className="assess-btn-count">{deficits.length + viability.flags.length}</span>
                </button>
              )}
              {levers.length > 0 && (
                <button
                  type="button"
                  className="assess-btn assess-btn-plan"
                  onClick={() => setPlanOpen(true)}
                  id="transition-plan-btn"
                >
                  Transition Plan
                </button>
              )}
            </div>
          </div>

          <div className="analysis-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={analysisView === 'nature'}
              className={`analysis-tab ${analysisView === 'nature' ? 'analysis-tab-active' : ''}`}
              onClick={() => setAnalysisView('nature')}
            >
              Nature
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={analysisView === 'financial'}
              className={`analysis-tab ${analysisView === 'financial' ? 'analysis-tab-active' : ''}`}
              onClick={() => setAnalysisView('financial')}
            >
              Financial
            </button>
          </div>

          {analysisView === 'nature' && (
            <div className="analysis-section">
              <div className="totals">
                <div className="totals-tile">
                  <p className="totals-label">Production</p>
                  <p className="totals-value">{fmt(totals.production_t)}<span className="totals-unit"> t/yr</span></p>
                </div>
                <div className="totals-tile">
                  <p className="totals-label">Freshwater load</p>
                  <p className="totals-value">{fmt(totals.freshwater_m3 / 1000)}<span className="totals-unit"> ML/yr</span></p>
                </div>
                <div className="totals-tile">
                  <p className="totals-label">Field emissions</p>
                  <p className="totals-value">{fmt(totals.emissions_tco2e)}<span className="totals-unit"> tCO₂e/yr</span></p>
                </div>
                <div className="totals-tile">
                  <p className="totals-label">Synthetic N</p>
                  <p className="totals-value">{fmt(totals.n_applied_t, 1)}<span className="totals-unit"> t N/yr</span></p>
                </div>
              </div>

              <div className="spider-wrap">
                <SpiderChart vectors={vectors} score={score} bandKey={band.key} />
              </div>
            </div>
          )}

          {analysisView === 'financial' && (
            <div className="analysis-section">
              <div className="analysis-section-head">
                <span className={`verdict-pill ${viability.verdict.className}`}>
                  <span className="dot" />
                  {viability.verdict.label}
                </span>
              </div>

              <div className="timeline-block">
                <div className="timeline-summary">
                  <div>
                    <span className="timeline-kicker">Break year</span>
                    <strong className={projection.breakYear === null ? 'timeline-ok' : 'timeline-risk'}>
                      {projection.breakYear === null ? 'No break by 2040' : fmtYear(projection.breakYear)}
                    </strong>
                  </div>
                  <div>
                    <span className="timeline-kicker">2040 margin</span>
                    <strong className={projection.margin2040 >= 0 ? 'timeline-ok' : 'timeline-risk'}>
                      {projection.margin2040 >= 0 ? '+' : '−'}£{fmt(Math.abs(projection.margin2040PerHa))}
                      <span className="totals-unit">/ha</span>
                    </strong>
                  </div>
                  <div>
                    <span className="timeline-kicker">Pressure absorbed</span>
                    <strong>
                      {projection.breakEvenPressure === null
                        ? '100%'
                        : `${Math.round(projection.breakEvenPressure * 100)}%`}
                    </strong>
                  </div>
                </div>
                <ViabilityTimeline projection={projection} />
                <div className="timeline-note">
                  Price, land, water, compliance and finance assumptions phase from 2026 to 2040.
                </div>
              </div>

              <RevenueBar viability={viability} />

              <div className="finbloc">
                <span className="finbloc-title">Exposure</span>
                <div className="viability-rows">
                  <div className="viability-row">
                    <span className="viability-row-label">Subsidy at risk</span>
                    <span className="viability-row-value viability-row-neg">−£{fmt(viability.subsidyAtRisk)}<span className="totals-unit">/yr</span></span>
                  </div>
                  <div className="viability-row">
                    <span className="viability-row-label">Input cost shock</span>
                    <span className="viability-row-value viability-row-neg">−£{fmt(viability.nCostShock)}<span className="totals-unit">/yr</span></span>
                  </div>
                  <div className="viability-row">
                    <span className="viability-row-label">Water revenue loss</span>
                    <span className="viability-row-value viability-row-neg">−£{fmt(viability.waterRevenueLoss)}<span className="totals-unit">/yr</span></span>
                  </div>
                </div>
              </div>

              {viability.transitionUpside > 0 && (
                <div className="finbloc">
                  <span className="finbloc-title">Upside</span>
                  <div className="viability-rows">
                    {viability.elmUplift > 0 && (
                      <div className="viability-row">
                        <span className="viability-row-label">ELM uplift</span>
                        <span className="viability-row-value viability-row-pos">+£{fmt(viability.elmUplift)}<span className="totals-unit">/yr</span></span>
                      </div>
                    )}
                    {viability.bngIncome > 0 && (
                      <div className="viability-row">
                        <span className="viability-row-label">BNG income</span>
                        <span className="viability-row-value viability-row-pos">+£{fmt(viability.bngIncome)}<span className="totals-unit">/yr</span></span>
                      </div>
                    )}
                    {viability.regenPremium > 0 && (
                      <div className="viability-row">
                        <span className="viability-row-label">Regen premium</span>
                        <span className="viability-row-value viability-row-pos">+£{fmt(viability.regenPremium)}<span className="totals-unit">/yr</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="net-position">
                <div className="net-position-label">
                  Net position per ha
                  <span className="muted">— upside minus exposure</span>
                </div>
                <div className={`net-position-value ${viability.netPositionPerHa >= 0 ? 'net-position-pos' : 'net-position-neg'}`}>
                  {viability.netPositionPerHa >= 0 ? '+' : '−'}£{fmt(Math.abs(viability.netPositionPerHa))}
                  <span className="totals-unit">/ha · {(viability.impactAsPercentOfRevenue * 100).toFixed(1)}% rev exposure</span>
                </div>
              </div>
            </div>
          )}

          <div className="assessment-foot">
            <button
              type="button"
              className="assumptions-btn"
              onClick={() => setEquationsOpen(true)}
            >
              View equations
            </button>
            <button
              type="button"
              className="assumptions-btn"
              onClick={() => setAssumptionsOpen(true)}
            >
              View assumptions
            </button>
          </div>
        </div>
      </div>

      {planOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setPlanOpen(false)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <span className="modal-eyebrow">Transition plan</span>
                <h2 id="plan-title" className="modal-title">
                  Closing the gap to <em>2040</em>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPlanOpen(false)}
                aria-label="Close transition plan"
              >
                ×
              </button>
            </header>

            <div className="modal-summary">
              <div className="modal-stat">
                <span className="modal-stat-label">Current viability</span>
                <span className="modal-stat-value">{score}</span>
              </div>
              <svg width="22" height="14" viewBox="0 0 22 14" className="modal-arrow" aria-hidden>
                <path d="M2 7h17m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="modal-stat">
                <span className="modal-stat-label">If all levers adopted</span>
                <span className="modal-stat-value modal-stat-value-strong">
                  {projected.score}
                  <span className="modal-lift">+{projected.lift}</span>
                </span>
              </div>
            </div>

            <div className="modal-summary modal-summary-financial">
              <div className="modal-stat">
                <span className="modal-stat-label">Current revenue exposure</span>
                <span className="modal-stat-value modal-stat-value-sm">{(viability.impactAsPercentOfRevenue * 100).toFixed(1)}%</span>
              </div>
              <svg width="22" height="14" viewBox="0 0 22 14" className="modal-arrow" aria-hidden>
                <path d="M2 7h17m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="modal-stat">
                <span className="modal-stat-label">After levers</span>
                <span className="modal-stat-value modal-stat-value-strong modal-stat-value-sm">
                  {(projected.viability.impactAsPercentOfRevenue * 100).toFixed(1)}%
                  <span className="modal-lift modal-lift-down">−£{fmt(viability.totalImpact - projected.viability.totalImpact)}/yr</span>
                </span>
              </div>
            </div>

            <p className="modal-intro">
              Candidate adaptations that close the deficit on the failing vectors.
              Each is sized to its projected effect on the five-vector profile; the
              farm chooses the mix.
            </p>

            <div className="modal-levers">
              {levers.map((lever, i) => (
                <div className="lever" key={i}>
                  <div className="lever-head">
                    <span className="lever-label">{lever.label}</span>
                    <span className="lever-impact">
                      {Object.entries(lever.impact).map(([k, v]) => (
                        <span key={k} className={`impact-chip impact-${k}`}>
                          {k} +{v}
                        </span>
                      ))}
                    </span>
                  </div>
                  <p className="lever-detail">{lever.detail}</p>
                </div>
              ))}
            </div>

            <footer className="modal-foot">
              <button
                type="button"
                className="modal-action"
                onClick={() => setPlanOpen(false)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {riskOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setRiskOpen(false)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="risk-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <span className="modal-eyebrow">Risk profile</span>
                <h2 id="risk-title" className="modal-title">
                  At <em>Risk</em>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setRiskOpen(false)}
                aria-label="Close at risk panel"
              >
                ×
              </button>
            </header>
            <p className="modal-intro">
              Vectors below threshold and financial exposure under the UK 2040 nature-positive pathway.
            </p>

            {deficits.length > 0 && (
              <>
                <h3 className="modal-section-title">Nature vectors</h3>
                <div className="modal-levers">
                  {deficits.map((v) => (
                    <div className="lever" key={v.key}>
                      <div className="lever-head">
                        <span className="lever-label">{v.label}</span>
                        <span className={`band ${band.className}`} style={{fontSize: '12px', padding: '4px 10px'}}>
                          <span className="dot" />
                          Score: {v.score}
                        </span>
                      </div>
                      <p className="lever-detail">{v.deficit}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(viability.flags.length > 0 || viability.verdict.key !== 'viable') && (
              <>
                <h3 className="modal-section-title">Financial exposure</h3>
                <div className="modal-levers">
                  {viability.verdict.key !== 'viable' && (
                    <div className="lever" key="verdict">
                      <div className="lever-head">
                        <span className="lever-label">Business model verdict</span>
                        <span className={`verdict-pill ${viability.verdict.className}`} style={{fontSize: '12px', padding: '4px 10px'}}>
                          <span className="dot" />
                          {viability.verdict.label}
                        </span>
                      </div>
                      <p className="lever-detail">
                        Total annual exposure £{fmt(viability.totalImpact)} — {(viability.impactAsPercentOfRevenue * 100).toFixed(1)}% of revenue.
                        Composed of subsidy at risk (£{fmt(viability.subsidyAtRisk)}), input cost shock (£{fmt(viability.nCostShock)})
                        and water revenue loss (£{fmt(viability.waterRevenueLoss)}).
                      </p>
                    </div>
                  )}
                  {viability.flags.map((f) => (
                    <div className="lever" key={f.key}>
                      <div className="lever-head">
                        <span className="lever-label">Lending flag</span>
                        <span className="verdict-pill verdict-critical" style={{fontSize: '12px', padding: '4px 10px'}}>
                          <span className="dot" />
                          {f.key === 'natwest_lloyds' ? 'NatWest / Lloyds' : f.key === 'covenant' ? 'Covenant' : 'EIB / UKIB'}
                        </span>
                      </div>
                      <p className="lever-detail">{f.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <footer className="modal-foot">
              <button
                type="button"
                className="modal-action"
                onClick={() => setRiskOpen(false)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {assumptionsOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setAssumptionsOpen(false)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assumptions-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <span className="modal-eyebrow">Model transparency</span>
                <h2 id="assumptions-title" className="modal-title">
                  Assumptions &amp; <em>sources</em>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setAssumptionsOpen(false)}
                aria-label="Close assumptions panel"
              >
                ×
              </button>
            </header>
            <p className="modal-intro">
              What's real, what's indicative and what's a placeholder. The mix is
              deliberate — the framework is sound; per-region and per-crop tuning
              tightens it.
            </p>

            <h3 className="modal-section-title">Real, sourced</h3>
            <ul className="assumptions-list">
              <li><b>Water footprints</b> (m³/t green/blue/grey, per crop) — FABLE 2021 EmbedWaterCrop, Mekonnen-Hoekstra global means. <i>Used in:</i> freshwater load per crop.</li>
              <li><b>Crop yields &amp; reference N rates</b> — Defra / AHDB UK typical 2020–22, hand-coded per crop. <i>Used in:</i> production = area × yield; N applied = area × rate × fertMul.</li>
              <li><b>N₂O emission factor</b> — IPCC 2019 tier-1: 1% of synthetic N → N₂O-N × 44/28 × 298 GWP100. <i>Used in:</i> field emissions.</li>
              <li><b>Residue + tillage emissions</b> — 500 kgCO₂e/ha flat. <i>Used in:</i> field emissions (added per ha to N₂O).</li>
            </ul>

            <h3 className="modal-section-title">Calculation logic</h3>
            <ul className="assumptions-list">
              <li><b>Production</b> = area × UK reference yield, summed across crop rows.</li>
              <li><b>N applied</b> = area × reference N × fertMul; legumes (peas, field beans) = 0.</li>
              <li><b>Fertiliser intensity slider</b> 0–100 maps to multiplier <code>0.4 + (slider/100) × 1.2</code> (range 0.4–1.6×); 65 = UK average. <i>Used in:</i> N applied + grey-water scaling.</li>
              <li><b>Irrigation slider</b> 0–100% sets blue-water scale; 100% = full FABLE blue value. <i>Used in:</i> freshwater load.</li>
              <li><b>Freshwater load</b> = production × (blue × irrigation% + grey × fertMul). Green water excluded.</li>
              <li><b>Diversity bonus</b> = <code>min(unique crops × 3, 18)</code>. <i>Used in:</i> Soil (×0.3) and Biodiversity (×1) vector lifts.</li>
              <li><b>Nature vectors</b> — each starts at 100, loses <code>(intensity / threshold) × 50</code> (×60 for Supply); Soil and Biodiv additionally subtract tillage/region load and add the diversity bonus; all clamped 0–100.</li>
              <li><b>Composite score</b> = mean of the five vector scores.</li>
              <li><b>Band cutoffs</b> — &lt;35 Critical, &lt;55 At risk, &lt;75 Adapting, ≥75 Resilient.</li>
              <li><b>Deficit narrative</b> shown when a vector &lt; 60; <b>lever</b> surfaced when vector &lt; 70.</li>
              <li><b>Subsidy</b> back-solved from dependence %: <code>cropRev × sd / (1 − sd)</code>, sd capped at 95%, bounded £120–£400/ha. <i>Used in:</i> total revenue + subsidy-at-risk.</li>
              <li><b>Subsidy at risk</b> = subsidy × (1 − retention rate).</li>
              <li><b>N cost shock</b> = totalHa × (N kg/ha) × 0.001 × £100/t; fires only when Supply &lt; 75.</li>
              <li><b>Water revenue loss</b> = irrigated ha × 40% × £150/ha; fires only when Water &lt; 75 AND region is water-stressed.</li>
              <li><b>Net position per ha</b> = upside per ha − exposure per ha (positive = net gain from transition).</li>
              <li><b>Impact as % revenue</b> = total impact / total revenue (denominator includes upside, intentionally).</li>
              <li><b>Projection break year</b> = first year where projected total costs exceed projected total revenue between 2026 and 2040; if the crossing falls between two annual points, the displayed year is interpolated.</li>
            </ul>

            <h3 className="modal-section-title">Indicative — defensible ballpark</h3>
            <ul className="assumptions-list">
              <li><b>2040 thresholds</b> (CCC + Defra-aligned) — freshwater 2,500 m³/ha, N 180 kg/ha, emissions 4.0 tCO₂e/ha, land 500 ha. <i>Used in:</i> Water / Supply / Soil / Land vector scoring.</li>
              <li><b>Crop prices £/t</b> — wheat 900, OSR 950, barley 750, other 700 (UK farmgate 2024–25). <i>Used in:</i> crop revenue.</li>
              <li><b>Crop price trajectory</b> — annual growth by crop from 1.3–2.1%; current weighted assumption is {(projection.assumptions.weightedCropPriceGrowth * 100).toFixed(1)}%/yr for this crop mix. <i>Used in:</i> revenue curve.</li>
              <li><b>Operating cost ratio</b> — 68–76% of crop revenue by business model; current assumption is {(projection.assumptions.operatingCostRatio * 100).toFixed(0)}%. <i>Used in:</i> cost curve.</li>
              <li><b>Land value</b> — regional 2026 land value baseline £{fmt(projection.assumptions.landValuePerHa2026)}/ha, growing 1.2%/yr with capital-rate surcharge for land-pressure risk. <i>Used in:</i> land cost curve.</li>
              <li><b>Water cost trajectory</b> — £0.015/m³ in 2026 rising to £{projection.assumptions.waterCostPerM32040.toFixed(3)}/m³ by 2040 under regional water stress. <i>Used in:</i> water cost curve.</li>
              <li><b>Compliance, finance and insurance</b> — phased traceability / disclosure costs and nature-risk capital premium scale with Water, Supply, Biodiversity and composite deficits. <i>Used in:</i> total cost curve.</li>
              <li><b>Subsidy bounds £120–£400/ha</b> — floor = SFI base; ceiling = BPS-era + stacked SFI base. <i>Used in:</i> subsidy income clamp.</li>
              <li><b>N price uplift £100/t</b> (£280 → £380; CBAM + carbon-priced trajectory). <i>Used in:</i> N cost shock.</li>
              <li><b>Water revenue loss £150/ha × 40%</b> of irrigated area. <i>Used in:</i> water cost shock.</li>
              <li><b>Water-stressed regions</b> — East of England, East Midlands, South East. <i>Used in:</i> water cost shock gate + covenant lending flag.</li>
              <li><b>ELM uplift tiers</b> — £200/£400/£600 per ha at composite &gt; 60/75/85 (CS higher-tier published rates).</li>
              <li><b>BNG income</b> — £25/ha (£50/ha if biodiv &gt; 75) when business model is regen or diversified AND biodiv &gt; 60. Order-of-magnitude only.</li>
              <li><b>Regenerative price premium</b> — 10% on crop revenue (conservative midpoint of 8–12%). Fires only for regen model.</li>
              <li><b>Subsidy retention tiers</b> — composite &gt;75 → 100%, 50–75 → 60%, &lt;50 → 20%; contract grower drops one tier. <i>Used in:</i> subsidy at risk.</li>
              <li><b>Verdict cutoffs</b> — &lt;10% revenue exposure → Viable, 10–20% → Needs transformation, ≥20% → Structural risk (≥25% for diversified).</li>
              <li><b>Lending flags</b> — (N&lt;50 AND subsidyDep&gt;50) → NatWest/Lloyds; (Water&lt;50 AND stressed region) → covenant; (high-input-commodity AND composite&lt;50) → EIB/UKIB.</li>
            </ul>

            <h3 className="modal-section-title">Placeholder — hand-tuned</h3>
            <ul className="assumptions-list">
              <li><b>Regional modifiers</b> — waterMod 0.7–1.4, biodivMod 0.9–1.3, landMod 0.9–1.3 across 11 UK regions. <i>Used in:</i> Water, Biodiv, Land vector scoring + cost shock gates.</li>
              <li><b>Soil fragility</b> — loam 0.7, clay 0.9, chalky 1.0, sandy 1.1, peaty 1.5. <i>Used in:</i> Soil vector scoring (multiplies tillage load).</li>
              <li><b>Per-crop tillage_intensity &amp; biodiv_intensity</b> — 0–1 proxies, no field data. <i>Used in:</i> Soil and Biodiversity loads.</li>
              <li><b>Business-model threshold adjustments</b> — regen widens N envelope 20% and freshwater 15%; contract grower drops a subsidy retention tier; diversified pushes structural-risk cutoff 20% → 25%.</li>
              <li><b>Lever impacts</b> — fixed +4 to +16 per vector per intervention (5 levers).</li>
            </ul>

            <h3 className="modal-section-title">Known omissions &amp; simplifications</h3>
            <ul className="assumptions-list">
              <li>Green water (rainfall) excluded from freshwater load — not abstracted, no catchment ceiling.</li>
              <li>Legumes (peas, field beans) carry zero synthetic N (fixesN flag).</li>
              <li>Peas water footprint proxied from field beans; linseed grey water = 0 (no FABLE entry).</li>
              <li>Subsidy dependence anchored to crop revenue only — transition upside added on top, not back-solved into the dependence ratio.</li>
              <li>Only Supply (N) and Water vectors drive financial cost shocks; Land, Soil and Biodiv have no direct £ line.</li>
              <li><b>Pesticide spend not modelled</b> — would add ~£10–15k/yr 2040 PPP-restriction shock on a 320 ha arable.</li>
              <li><b>Energy / fuel cost not modelled</b> — would add ~£10–20k/yr with carbon-priced diesel.</li>
              <li><b>Stranded assets not quantified</b> — specialised irrigation / fertiliser-application infrastructure becoming uneconomic.</li>
              <li><b>Yield is fixed</b> — no yield reduction from input cuts or PPP bans.</li>
              <li><b>Projection is annual, not seasonal</b> — no commodity volatility, working-capital timing, debt amortisation or tenant / owner-occupier split.</li>
            </ul>

            <footer className="modal-foot">
              <button
                type="button"
                className="modal-action"
                onClick={() => setAssumptionsOpen(false)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {equationsOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setEquationsOpen(false)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="equations-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <span className="modal-eyebrow">Calculation chain</span>
                <h2 id="equations-title" className="modal-title">
                  Equations &amp; <em>steps</em>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEquationsOpen(false)}
                aria-label="Close equations panel"
              >
                ×
              </button>
            </header>
            <p className="modal-intro">
              Every formula the tool uses, step by step. Coefficients and bounds are
              documented in <i>View assumptions</i>.
            </p>

            <h3 className="modal-section-title">Nature score</h3>
            <ol className="equations-list">
              <li>
                <div className="eq-title">Fertiliser multiplier</div>
                <div className="eq">fertMul = 0.4 + (fertIntensity / 100) × 1.2</div>
              </li>
              <li>
                <div className="eq-title">Blue-water scale</div>
                <div className="eq">blueScale = irrigation% / 100</div>
              </li>
              <li>
                <div className="eq-title">Per crop row (summed into farm totals)</div>
                <div className="eq">production = ha × yield<sub>t/ha</sub></div>
                <div className="eq">N<sub>applied</sub> = ha × n<sub>kg/ha</sub> × fertMul &nbsp;&nbsp; (= 0 if fixesN)</div>
                <div className="eq">freshwater = production × (wf<sub>blue</sub> × blueScale + wf<sub>grey</sub> × fertMul)</div>
                <div className="eq">N₂O<sub>kgCO₂e</sub> = N<sub>applied</sub> × 0.01 × (44/28) × 298 &nbsp;&nbsp; <span className="eq-note">IPCC tier-1</span></div>
                <div className="eq">residue<sub>kgCO₂e</sub> = ha × 500</div>
                <div className="eq">tillageLoad ← tillageLoad + ha × tillage<sub>int</sub></div>
                <div className="eq">monocultureLoad ← monocultureLoad + ha × biodiv<sub>int</sub></div>
              </li>
              <li>
                <div className="eq-title">Per-ha intensities</div>
                <div className="eq">x<sub>per-ha</sub> = x<sub>total</sub> / totalHa &nbsp;&nbsp; <span className="eq-note">for water, N, tillage, biodiv loads</span></div>
              </li>
              <li>
                <div className="eq-title">Diversity bonus</div>
                <div className="eq">diversityBonus = min(uniqueCrops × 3, 18)</div>
              </li>
              <li>
                <div className="eq-title">Threshold adjustment (regenerative only)</div>
                <div className="eq">T<sub>n</sub> ← T<sub>n</sub> × 1.20, &nbsp;&nbsp; T<sub>water</sub> ← T<sub>water</sub> × 1.15</div>
              </li>
              <li>
                <div className="eq-title">Vector scores <span className="eq-note">(clamped 0–100)</span></div>
                <div className="eq">Water = 100 − (water<sub>per-ha</sub> × waterMod / T<sub>water</sub>) × 50</div>
                <div className="eq">Supply = 100 − (N<sub>per-ha</sub> / T<sub>n</sub>) × 60</div>
                <div className="eq">Soil = 100 − tillage<sub>per-ha</sub> × soilMod × 60 − (N<sub>per-ha</sub> / T<sub>n</sub>) × 30 + diversityBonus × 0.3</div>
                <div className="eq">Biodiv = 100 − biodiv<sub>per-ha</sub> × biodivMod × 60 + diversityBonus</div>
                <div className="eq">Land = 100 − (totalHa / T<sub>hectarage</sub>) × 50 × landMod</div>
              </li>
              <li>
                <div className="eq-title">Composite</div>
                <div className="eq">composite = ⅕ × (Land + Water + Soil + Biodiv + Supply)</div>
              </li>
              <li>
                <div className="eq-title">Band</div>
                <div className="eq eq-cases">
                  band = <span className="eq-cases-brace">{'{'}</span>
                  <span className="eq-cases-rows">
                    <span><i>Not viable</i> &nbsp;&nbsp; if composite &lt; 35</span>
                    <span><i>At risk</i> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if 35 ≤ composite &lt; 55</span>
                    <span><i>Adapting</i> &nbsp;&nbsp;&nbsp;&nbsp; if 55 ≤ composite &lt; 75</span>
                    <span><i>Resilient</i> &nbsp;&nbsp;&nbsp; if composite ≥ 75</span>
                  </span>
                </div>
              </li>
            </ol>

            <h3 className="modal-section-title">Financial layer</h3>
            <ol className="equations-list">
              <li>
                <div className="eq-title">Crop revenue</div>
                <div className="eq">cropRevenue = Σ<sub>rows</sub> (ha × yield × price)</div>
                <div className="eq-note-line">prices £/t: wheat 900 · OSR 950 · barley 750 · other 700</div>
              </li>
              <li>
                <div className="eq-title">Subsidy income</div>
                <div className="eq">sd = min(subsidyDep, 95) / 100</div>
                <div className="eq">raw = cropRevenue × sd / (1 − sd)</div>
                <div className="eq">subsidyIncome = clamp(raw, &nbsp; 120 × totalHa, &nbsp; 400 × totalHa)</div>
              </li>
              <li>
                <div className="eq-title">Retention rate</div>
                <div className="eq eq-cases">
                  retention = <span className="eq-cases-brace">{'{'}</span>
                  <span className="eq-cases-rows">
                    <span>1.0 &nbsp;&nbsp; if composite &gt; 75</span>
                    <span>0.6 &nbsp;&nbsp; if 50 ≤ composite ≤ 75</span>
                    <span>0.2 &nbsp;&nbsp; if composite &lt; 50</span>
                  </span>
                </div>
                <div className="eq-note-line">if business model = contract grower: shift one tier down</div>
              </li>
              <li>
                <div className="eq-title">Subsidy at risk</div>
                <div className="eq">subsidyAtRisk = subsidyIncome × (1 − retention)</div>
              </li>
              <li>
                <div className="eq-title">N cost shock <span className="eq-note">— fires only when Supply &lt; 75</span></div>
                <div className="eq">nCostShock = totalHa × (N kg/ha) × 0.001 × £100/t</div>
              </li>
              <li>
                <div className="eq-title">Water revenue loss <span className="eq-note">— fires only when Water &lt; 75 AND region ∈ &#123;East England, East Mids, South East&#125;</span></div>
                <div className="eq">waterRevenueLoss = totalHa × (irrigation% / 100) × 0.4 × £150/ha</div>
              </li>
              <li>
                <div className="eq-title">ELM uplift</div>
                <div className="eq eq-cases">
                  elmRate = <span className="eq-cases-brace">{'{'}</span>
                  <span className="eq-cases-rows">
                    <span>£600/ha &nbsp;&nbsp; if composite &gt; 85</span>
                    <span>£400/ha &nbsp;&nbsp; if 75 &lt; composite ≤ 85</span>
                    <span>£200/ha &nbsp;&nbsp; if 60 &lt; composite ≤ 75</span>
                    <span>£0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; otherwise</span>
                  </span>
                </div>
                <div className="eq">elmUplift = elmRate × totalHa</div>
              </li>
              <li>
                <div className="eq-title">BNG income</div>
                <div className="eq">eligible = (model ∈ &#123;regen, diversified&#125;) ∧ (biodiv &gt; 60)</div>
                <div className="eq">bngRate = (biodiv &gt; 75) ? £50/ha : £25/ha</div>
                <div className="eq">bngIncome = eligible ? bngRate × totalHa : 0</div>
              </li>
              <li>
                <div className="eq-title">Regenerative premium</div>
                <div className="eq">regenPremium = (model = regen) ? cropRevenue × 0.10 : 0</div>
              </li>
              <li>
                <div className="eq-title">Roll-up</div>
                <div className="eq">transitionUpside = elmUplift + bngIncome + regenPremium</div>
                <div className="eq">totalRevenue = cropRevenue + subsidyIncome + transitionUpside</div>
                <div className="eq">totalImpact = subsidyAtRisk + nCostShock + waterRevenueLoss</div>
                <div className="eq">netMarginImpactPerHa = totalImpact / totalHa</div>
                <div className="eq">upsidePerHa = transitionUpside / totalHa</div>
                <div className="eq">netPositionPerHa = upsidePerHa − netMarginImpactPerHa</div>
                <div className="eq">impactPctRevenue = totalImpact / totalRevenue</div>
              </li>
              <li>
                <div className="eq-title">Verdict</div>
                <div className="eq">structuralAt = (model = diversified) ? 0.25 : 0.20</div>
                <div className="eq eq-cases">
                  verdict = <span className="eq-cases-brace">{'{'}</span>
                  <span className="eq-cases-rows">
                    <span><i>Structural risk</i> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if impactPctRevenue ≥ structuralAt</span>
                    <span><i>Needs transformation</i> &nbsp; if 0.10 ≤ impactPctRevenue &lt; structuralAt</span>
                    <span><i>Viable with adaptation</i> if impactPctRevenue &lt; 0.10</span>
                  </span>
                </div>
              </li>
              <li>
                <div className="eq-title">Lending flags <span className="eq-note">(each independent)</span></div>
                <div className="eq">(Supply &lt; 50) ∧ (subsidyDep &gt; 50) &nbsp;→&nbsp; NatWest / Lloyds exclusion</div>
                <div className="eq">(Water &lt; 50) ∧ (region water-stressed) &nbsp;→&nbsp; green-loan covenant</div>
                <div className="eq">(model = high-input commodity) ∧ (composite &lt; 50) &nbsp;→&nbsp; EIB / UKIB exclusion</div>
              </li>
            </ol>

            <h3 className="modal-section-title">Projected scenario <span className="eq-note">(Transition Plan modal)</span></h3>
            <ol className="equations-list">
              <li>
                <div className="eq-title">Projected vector scores</div>
                <div className="eq">v<sub>projected</sub> = clamp(v<sub>current</sub> + Σ<sub>levers</sub> lever.impact[v], &nbsp; 0, &nbsp; 100)</div>
              </li>
              <li>
                <div className="eq-title">Projected viability</div>
                <div className="eq-note-line">Re-run the entire financial layer against the lifted vector scores.</div>
                <div className="eq">savings/yr = totalImpact<sub>current</sub> − totalImpact<sub>projected</sub></div>
              </li>
            </ol>

            <footer className="modal-foot">
              <button
                type="button"
                className="modal-action"
                onClick={() => setEquationsOpen(false)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
