import { useMemo, useState } from 'react'
import './App.css'
import {
  REGIONS,
  CROPS,
  SOIL_TYPES,
  computeAssessment,
  type FarmInputs,
  type CropRow,
  type CropKey,
  type RegionKey,
  type SoilTypeKey,
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

      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="spider-center-score"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        className="spider-center-label"
      >
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
  const { score, band, vectors, levers, totalHa } = assessment
  const deficits = vectors.filter((v) => v.deficit)

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
          <div className="brand-mark" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2c0 6-4 9-8 10 4 1 8 4 8 10 0-6 4-9 8-10-4-1-8-4-8-10z"
                fill="currentColor"
                opacity="0.95"
              />
            </svg>
          </div>
          <div className="brand-name">
            Scenario<b>One</b>
          </div>
        </div>
        <span className="pill">
          <span className="pill-dot" />
          UK 2040 nature-positive pathway
        </span>
      </header>

      <section className="hero">
        <span className="eyebrow">Business-model nature stress test</span>
        <h1>
          Will this farm still <em>work in 2040?</em>
        </h1>
        <p>
          Enter your UK crop operation. We stress-test it against the UK's 2040
          nature-positive pathway — derived from the 25 Year Environment Plan,
          EIP 2023 and Kunming-Montreal targets — and return where the business
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

            <div className="field">
              <div className="field-label-row">
                <label className="field-label">Crop mix</label>
                <span className="muted">{totalHa.toLocaleString()} ha total</span>
              </div>
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

          <button
            className="reset"
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
          >
            Reset to baseline
          </button>
        </div>

        <div className="card assessment">
          <h2>2040 stress test</h2>
          <p className="card-sub">
            Composite viability score and breakdown across five nature-risk vectors.
          </p>

          <div className="spider-wrap">
            <SpiderChart vectors={vectors} score={score} bandKey={band.key} />
          </div>

          <div className="score-block">
            <span className={`band ${band.className}`}>
              <span className="dot" />
              {band.label}
            </span>
          </div>

          {deficits.length > 0 && (
            <div className="deficits">
              {deficits.map((v) => (
                <div className="deficit" key={v.key}>
                  <span className="deficit-tag">{v.label}</span>
                  <span className="deficit-text">{v.deficit}</span>
                </div>
              ))}
            </div>
          )}

          <p className="narrative">{band.narrative}</p>

          {levers.length > 0 && (
            <div className="levers">
              <h3 className="levers-title">Transition plan — candidate levers</h3>
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
          )}
        </div>
      </div>

      <footer className="footer">
        ScenarioOne · UK 2040 nature-positive stress test · Coefficients illustrative
      </footer>
    </div>
  )
}

export default App
