import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  REGIONS,
  CROPS,
  SOIL_TYPES,
  BUSINESS_MODELS,
  FINANCIAL_ASSUMPTIONS,
  DEFAULT_FINANCIAL_ASSUMPTIONS,
  NO_HIDDEN_FINANCIAL_ASSUMPTIONS,
  computeAssessment,
  computeBusinessViability,
  computeBusinessProjection,
  type FarmInputs,
  type FinancialAssumptionKey,
  type FinancialAssumptionState,
  type CropRow,
  type CropKey,
  type RegionKey,
  type SoilTypeKey,
  type BusinessModelKey,
  type VectorResult,
  type Band,
} from './model'
import { RevenueBar } from './components/RevenueBar'
import { ViabilityTimeline } from './components/ViabilityTimeline'
import { Nomenclature } from './components/Nomenclature'


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
  const [financialAssumptions, setFinancialAssumptions] =
    useState<FinancialAssumptionState>(DEFAULT_FINANCIAL_ASSUMPTIONS)

  const assessment = useMemo(() => computeAssessment(inputs), [inputs])
  const { score, band, vectors, levers, totalHa, totals } = assessment
  const deficits = vectors.filter((v) => v.deficit)

  const viability = useMemo(
    () => computeBusinessViability(inputs, assessment),
    [inputs, assessment],
  )
  const projection = useMemo(
    () => computeBusinessProjection(inputs, assessment, viability, financialAssumptions),
    [inputs, assessment, viability, financialAssumptions],
  )
  const hiddenAssumptionProjection = useMemo(
    () =>
      computeBusinessProjection(
        inputs,
        assessment,
        viability,
        DEFAULT_FINANCIAL_ASSUMPTIONS,
      ),
    [inputs, assessment, viability],
  )
  const noHiddenAssumptionProjection = useMemo(
    () =>
      computeBusinessProjection(
        inputs,
        assessment,
        viability,
        NO_HIDDEN_FINANCIAL_ASSUMPTIONS,
      ),
    [inputs, assessment, viability],
  )
  const assumptionImpacts = useMemo(
    () =>
      FINANCIAL_ASSUMPTIONS.map((assumption) => {
        const singleStress = {
          ...DEFAULT_FINANCIAL_ASSUMPTIONS,
          [assumption.key]: false,
        }
        const stressed = computeBusinessProjection(inputs, assessment, viability, singleStress)
        return {
          ...assumption,
          enabled: financialAssumptions[assumption.key],
          impactPerHa: stressed.margin2040PerHa - hiddenAssumptionProjection.margin2040PerHa,
        }
      }),
    [inputs, assessment, viability, financialAssumptions, hiddenAssumptionProjection],
  )

  const fmt = (n: number, digits = 0) =>
    n.toLocaleString('en-GB', { maximumFractionDigits: digits })
  const fmtYear = (n: number) => n.toFixed(1).replace(/\.0$/, '')
  const activeAssumptionDrag =
    projection.margin2040PerHa - hiddenAssumptionProjection.margin2040PerHa

  const toggleFinancialAssumption = (key: FinancialAssumptionKey) => {
    setFinancialAssumptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const [planOpen, setPlanOpen] = useState(false)
  const [riskOpen, setRiskOpen] = useState(false)
  const [equationsOpen, setEquationsOpen] = useState(false)
  const [equationsTab, setEquationsTab] = useState<'equations' | 'assumptions' | 'nomenclature'>('equations')
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
            onClick={() => {
              setInputs(DEFAULT_INPUTS)
              setFinancialAssumptions(DEFAULT_FINANCIAL_ASSUMPTIONS)
            }}
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

              <div className="assumption-stress-panel">
                <div className="assumption-stress-head">
                  <div>
                    <span className="finbloc-title">Hidden assumptions</span>
                    <p>On means the optimistic assumption is baked in. Off applies the 2040 stressor.</p>
                  </div>
                  <div className={`assumption-total ${activeAssumptionDrag <= 0 ? 'assumption-total-neg' : 'assumption-total-pos'}`}>
                    {activeAssumptionDrag >= 0 ? '+' : '−'}£{fmt(Math.abs(activeAssumptionDrag))}
                    <span className="totals-unit">/ha vs all on</span>
                  </div>
                </div>

                <div className="assumption-actions">
                  <button
                    type="button"
                    onClick={() => setFinancialAssumptions(DEFAULT_FINANCIAL_ASSUMPTIONS)}
                  >
                    All on
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialAssumptions(NO_HIDDEN_FINANCIAL_ASSUMPTIONS)}
                  >
                    All off
                  </button>
                  <span className={noHiddenAssumptionProjection.margin2040PerHa >= 0 ? 'assumption-action-note-pos' : 'assumption-action-note-neg'}>
                    All off: {noHiddenAssumptionProjection.margin2040PerHa >= 0 ? '+' : '−'}£{fmt(Math.abs(noHiddenAssumptionProjection.margin2040PerHa))}/ha in 2040
                  </span>
                </div>

                <div className="assumption-stress-grid">
                  {assumptionImpacts.map((assumption) => (
                    <label
                      className={`assumption-check ${assumption.enabled ? 'assumption-check-active' : ''}`}
                      key={assumption.key}
                    >
                      <input
                        type="checkbox"
                        checked={assumption.enabled}
                        onChange={() => toggleFinancialAssumption(assumption.key)}
                      />
                      <span className="assumption-switch" aria-hidden="true">
                        <span className="assumption-switch-knob" />
                      </span>
                      <span className="assumption-check-copy">
                        <span className="assumption-check-label">{assumption.label}</span>
                        <span className="assumption-check-detail">{assumption.stress}</span>
                      </span>
                      <span className={`assumption-state ${assumption.enabled ? 'assumption-state-on' : 'assumption-state-off'}`}>
                        {assumption.enabled ? 'On' : 'Off'}
                      </span>
                      <span className={`assumption-impact ${assumption.impactPerHa <= 0 ? 'assumption-impact-neg' : 'assumption-impact-pos'}`}>
                        {assumption.impactPerHa >= 0 ? '+' : '−'}£{fmt(Math.abs(assumption.impactPerHa))}
                        <span>/ha</span>
                      </span>
                    </label>
                  ))}
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
            <div className="assessment-btns">
              <button
                type="button"
                className="assess-btn assess-btn-risk"
                onClick={() => {
                  setEquationsOpen(true)
                  setEquationsTab('equations')
                }}
              >
                View equations
              </button>
              <button
                type="button"
                className="assess-btn assess-btn-risk"
                onClick={() => {
                  setEquationsOpen(true)
                  setEquationsTab('assumptions')
                }}
              >
                View assumptions
              </button>
            </div>
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
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <span className="modal-eyebrow">Technical Reference</span>
                <h2 id="modal-title" className="modal-title">
                  Equations &amp; <em>Assumptions</em>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEquationsOpen(false)}
                aria-label="Close panel"
              >
                ×
              </button>
            </header>

            <div className="analysis-tabs modal-tabs">
              <button
                className={`analysis-tab ${equationsTab === 'equations' ? 'active' : ''}`}
                onClick={() => setEquationsTab('equations')}
              >
                Equations &amp; steps
              </button>
              <button
                className={`analysis-tab ${equationsTab === 'assumptions' ? 'active' : ''}`}
                onClick={() => setEquationsTab('assumptions')}
              >
                Assumptions
              </button>
              <button
                className={`analysis-tab ${equationsTab === 'nomenclature' ? 'active' : ''}`}
                onClick={() => setEquationsTab('nomenclature')}
              >
                Nomenclature
              </button>
            </div>

            <div className="modal-body-scroll">
              {equationsTab === 'equations' && (
                <div className="tab-content">
                  <p className="modal-intro">
                    Every formula the tool uses, step by step. Coefficients and bounds are
                    documented in the <i>Assumptions</i> tab.
                  </p>

                  <h3 className="modal-section-title">Nature score</h3>
                  <ol className="equations-list">
                    <li>
                      <div className="eq-title">Fertiliser multiplier</div>
                      <div className="eq eq-cases">
                        fertMul = <span className="eq-cases-brace">{'{'}</span>
                        <span className="eq-cases-rows">
                          <span>0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if intensity = 0</span>
                          <span>0.4 + (intensity / 100) × 1.2 &nbsp;&nbsp; if intensity &gt; 0</span>
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="eq-title">Freshwater load <span className="eq-note">(m³)</span></div>
                      <div className="eq">load = Σ<sub>rows</sub> [area × yield × (blue × irrigation% + grey × fertMul)]</div>
                      <div className="eq-note-line">blue/grey water footprints from FABLE 2021 / Mekonnen-Hoekstra.</div>
                    </li>
                    <li>
                      <div className="eq-title">Diversity bonus</div>
                      <div className="eq">bonus = min(unique_crops × 3, &nbsp; 18)</div>
                    </li>
                    <li>
                      <div className="eq-title">Vector scores <span className="eq-note">(0–100)</span></div>
                      <div className="eq">Water = 100 − (load / T<sub>water</sub>) × 50 × waterMod</div>
                      <div className="eq">Supply = 100 − (N<sub>per-ha</sub> / T<sub>n</sub>) × 60</div>
                      <div className="eq">Soil = 100 − tillage<sub>per-ha</sub> × soilMod × 60 − (N<sub>per-ha</sub> / T<sub>n</sub>) × 30 + bonus × 0.3</div>
                      <div className="eq">Biodiv = 100 − biodiv<sub>per-ha</sub> × biodivMod × 60 + bonus</div>
                      <div className="eq">Land = 100 − (totalHa / T<sub>hectarage</sub>) × 50 × landMod</div>
                    </li>
                    <li>
                      <div className="eq-title">Composite</div>
                      <div className="eq">composite = ⅕ × (Land + Water + Soil + Biodiv + Supply)</div>
                    </li>
                  </ol>

                  <h3 className="modal-section-title">Financial layer</h3>
                  <ol className="equations-list">
                    <li>
                      <div className="eq-title">Crop revenue</div>
                      <div className="eq">cropRevenue = Σ<sub>rows</sub> (ha × yield × price)</div>
                    </li>
                    <li>
                      <div className="eq-title">Retention rate</div>
                      <div className="eq eq-cases">
                        ret = <span className="eq-cases-brace">{'{'}</span>
                        <span className="eq-cases-rows">
                          <span>1.0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if composite ≥ 75</span>
                          <span>0.2 + (composite − 50) / 25 × 0.8 &nbsp;&nbsp; if 50 &lt; composite &lt; 75</span>
                          <span>0.2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if composite ≤ 50</span>
                        </span>
                      </div>
                      <div className="eq">retention = (contract grower) ? max(0, ret − 0.4) : ret</div>
                    </li>
                    <li>
                      <div className="eq-title">Cost shocks</div>
                      <div className="eq">N shock = totalHa × (N kg/ha) × 0.001 × £400/t (if Supply &lt; 75)</div>
                      <div className="eq">Water shock = irrigatedArea × 40% × £150/ha (if Water &lt; 75 &amp; stress)</div>
                    </li>
                    <li>
                      <div className="eq-title">Verdict threshold</div>
                      <div className="eq">atRisk = totalImpact / (cropRevenue + subsidy + upside)</div>
                    </li>
                  </ol>
                </div>
              )}

              {equationsTab === 'assumptions' && (
                <div className="tab-content">
                  <p className="modal-intro">
                    What's real, what's indicative and what's a placeholder. The mix is
                    deliberate — the framework is sound; per-region and per-crop tuning
                    tightens it.
                  </p>

                  <h3 className="modal-section-title">Real, sourced</h3>
                  <ul className="assumptions-list">
                    <li><b>Water footprints</b> — FABLE 2021 EmbedWaterCrop.</li>
                    <li><b>Crop yields &amp; N rates</b> — AHDB UK typical 2020–22.</li>
                    <li><b>N₂O factor</b> — IPCC 2019 tier-1.</li>
                  </ul>

                  <h3 className="modal-section-title">Calculation logic</h3>
                  <ul className="assumptions-list">
                    <li><b>Diversity bonus</b> — <code>min(unique crops × 3, 18)</code>.</li>
                    <li><b>Subsidy income</b> — <code>clamp(totalHa × £220/ha, £120, £400)</code>.</li>
                    <li><b>Retention curve</b> — linear interpolation 0.2 to 1.0.</li>
                  </ul>

                  <h3 className="modal-section-title">Indicative ballpark</h3>
                  <ul className="assumptions-list">
                    <li><b>2040 thresholds</b> — freshwater 2,500 m³/ha, N 180 kg/ha, emissions 4.0 tCO₂e/ha.</li>
                    <li><b>Crop prices £/t</b> — wheat 900, OSR 950, barley 750, other 700.</li>
                    <li><b>Water revenue loss</b> — £150/ha × 40% of irrigated area.</li>
                  </ul>
                </div>
              )}

              {equationsTab === 'nomenclature' && (
                <div className="tab-content">
                  <p className="modal-intro">
                    Key variables and parameters used in the calculation chain.
                  </p>
                  <Nomenclature />
                </div>
              )}
            </div>

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
