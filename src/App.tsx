import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  REGIONS,
  CROPS,
  SOIL_TYPES,
  BUSINESS_MODELS,
  computeAssessment,
  computeBusinessViability,
  type FarmInputs,
  type CropRow,
  type CropKey,
  type RegionKey,
  type SoilTypeKey,
  type BusinessModelKey,
  type VectorResult,
  type Band,
} from './model'

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

  const fmt = (n: number, digits = 0) =>
    n.toLocaleString('en-GB', { maximumFractionDigits: digits })

  const [planOpen, setPlanOpen] = useState(false)
  const [riskOpen, setRiskOpen] = useState(false)
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
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

              <div className="viability-rows">
                <div className="viability-row">
                  <span className="viability-row-label">Subsidy at risk</span>
                  <span className="viability-row-value">£{fmt(viability.subsidyAtRisk)}<span className="totals-unit">/yr</span></span>
                </div>
                <div className="viability-row">
                  <span className="viability-row-label">Input cost shock</span>
                  <span className="viability-row-value">£{fmt(viability.nCostShock)}<span className="totals-unit">/yr</span></span>
                </div>
                <div className="viability-row">
                  <span className="viability-row-label">Water revenue loss</span>
                  <span className="viability-row-value">£{fmt(viability.waterRevenueLoss)}<span className="totals-unit">/yr</span></span>
                </div>
                <div className="viability-row">
                  <span className="viability-row-label">Net margin impact</span>
                  <span className="viability-row-value">£{fmt(viability.netMarginImpactPerHa)}<span className="totals-unit">/ha · {(viability.impactAsPercentOfRevenue * 100).toFixed(1)}% rev</span></span>
                </div>
              </div>
            </div>
          )}

          <div className="assessment-foot">
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
              <li><b>Water footprints</b> — FABLE 2021 EmbedWaterCrop (Mekonnen-Hoekstra global means, m³/t).</li>
              <li><b>Crop yields &amp; reference N rates</b> — Defra / AHDB UK typical 2020–22.</li>
              <li><b>N₂O emissions</b> — IPCC 2019 tier-1: 1% of synthetic N → N₂O-N, × 44/28 × 298 GWP100.</li>
              <li><b>Subsidy floor £120/ha</b> — aligned with SFI base rates.</li>
            </ul>

            <h3 className="modal-section-title">Indicative — defensible ballpark</h3>
            <ul className="assumptions-list">
              <li><b>2040 thresholds</b> — freshwater 2,500 m³/ha (blue+grey), N 180 kg/ha, emissions 4.0 tCO₂e/ha, land 500 ha — CCC + Defra-aligned.</li>
              <li><b>Crop prices</b> — wheat £900, OSR £950, barley £750, other £700 per tonne (UK farmgate, 2024–25).</li>
              <li><b>N price uplift</b> — £100/t (£280 → £380), implied by carbon-priced fertiliser pathway.</li>
              <li><b>Water revenue loss</b> — £150/ha × 40% of irrigated area, when in water-stressed regions.</li>
            </ul>

            <h3 className="modal-section-title">Placeholder — hand-tuned</h3>
            <ul className="assumptions-list">
              <li><b>Regional modifiers</b> — waterMod, biodivMod, landMod (0.7–1.4 ranges).</li>
              <li><b>Soil fragility</b> — peaty 1.5×, sandy 1.1×, chalky 1.0×, clay 0.9×, loam 0.7×.</li>
              <li><b>Per-crop tillage &amp; biodiv intensity</b> — 0–1 proxies until field data.</li>
              <li><b>Subsidy retention tiers</b> — 1.0 / 0.6 / 0.2 by composite score; contract-grower drops one tier.</li>
              <li><b>Business-model adjustments</b> — regen widens N envelope 20% and water 15%; diversified absorbs up to 25% revenue impact before structural risk.</li>
              <li><b>Lever impacts</b> — +10–16 per vector, fixed magnitudes per intervention.</li>
            </ul>

            <h3 className="modal-section-title">Structural simplifications</h3>
            <ul className="assumptions-list">
              <li>Green water (rainfall) excluded from freshwater load — not abstracted.</li>
              <li>Legumes (peas, field beans) carry zero synthetic N.</li>
              <li>Peas water footprint proxied from field beans; linseed grey water set to 0.</li>
              <li>Subsidy dependence capped at 95% internally to avoid 1/(1−sd) blow-up.</li>
              <li>Only Supply (N) and Water vectors trigger financial cost shocks.</li>
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
    </div>
  )
}

export default App
