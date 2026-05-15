import { useMemo, useState } from 'react'
import './App.css'

type Variable = {
  id: string
  label: string
  hint: string
  min: number
  max: number
  step: number
  default: number
  unit?: string
  /**
   * +1 = higher slider value improves the score (e.g. renewables).
   * -1 = higher slider value worsens it (e.g. emissions).
   */
  weight: 1 | -1
}

const VARIABLES: Variable[] = [
  { id: 'x1', label: 'Variable A', hint: 'Operational intensity', min: 0, max: 100, step: 1, default: 60, weight: -1 },
  { id: 'x2', label: 'Variable B', hint: 'Resource efficiency', min: 0, max: 100, step: 1, default: 40, weight: 1 },
  { id: 'x3', label: 'Variable C', hint: 'Supply chain exposure', min: 0, max: 100, step: 1, default: 50, weight: -1 },
  { id: 'x4', label: 'Variable D', hint: 'Adaptation capacity', min: 0, max: 100, step: 1, default: 45, weight: 1 },
  { id: 'x5', label: 'Variable E', hint: 'Long-term horizon', min: 0, max: 100, step: 1, default: 55, weight: 1 },
]

type Band = {
  key: 'critical' | 'risk' | 'sustainable' | 'future'
  label: string
  className: string
  narrative: string
}

function bandFor(score: number): Band {
  if (score < 35) {
    return {
      key: 'critical',
      label: 'Critical exposure',
      className: 'band-critical',
      narrative:
        'Strategy is materially exposed to environmental and transition risk. Stress-test against tightening regulation and disclosure.',
    }
  }
  if (score < 55) {
    return {
      key: 'risk',
      label: 'At risk',
      className: 'band-risk',
      narrative:
        'Plan shows partial resilience but key levers are unhedged. Identify the two metrics with greatest downside before committing capital.',
    }
  }
  if (score < 75) {
    return {
      key: 'sustainable',
      label: 'Sustainable',
      className: 'band-sustainable',
      narrative:
        'Strategy holds up under current scenarios. Consider widening the time horizon and modelling second-order supply effects.',
    }
  }
  return {
    key: 'future',
    label: 'Future-proof',
    className: 'band-future',
    narrative:
      'Robust across modelled pathways. Maintain the leading indicators and re-run as input assumptions shift.',
  }
}

function computeScore(values: Record<string, number>): number {
  let total = 0
  for (const v of VARIABLES) {
    const raw = values[v.id]
    const contribution = v.weight === 1 ? raw : 100 - raw
    total += contribution
  }
  return Math.round(total / VARIABLES.length)
}

function App() {
  const defaults = useMemo(
    () => Object.fromEntries(VARIABLES.map((v) => [v.id, v.default])) as Record<string, number>,
    [],
  )
  const [values, setValues] = useState<Record<string, number>>(defaults)

  const score = computeScore(values)
  const band = bandFor(score)

  const emissions = Math.round(values.x1 * 12 + values.x3 * 6)
  const exposure = Math.round((100 - (values.x2 + values.x4) / 2))
  const horizon = Math.round(2030 + (values.x5 / 100) * 25)
  const confidence = Math.round(40 + ((values.x2 + values.x4 + values.x5) / 3) * 0.6)

  const dialRadius = 84
  const dialCircumference = 2 * Math.PI * dialRadius
  const dialOffset = dialCircumference - (score / 100) * dialCircumference

  const bandStrokeColor =
    band.key === 'critical' ? '#a14a3a' :
    band.key === 'risk' ? '#b07a2a' :
    band.key === 'sustainable' ? '#436843' :
    '#345237'

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
          Sandbox scenario · live
        </span>
      </header>

      <section className="hero">
        <span className="eyebrow">Environmental impact assessment</span>
        <h1>
          Stress-test your strategy <em>against the world it will live in.</em>
        </h1>
        <p>
          ScenarioOne lets teams in regulated sectors model how today's decisions hold up tomorrow.
          Adjust the levers below and watch the assessment respond in real time.
        </p>
      </section>

      <div className="grid">
        <div className="card">
          <h2>Scenario inputs</h2>
          <p className="card-sub">
            Move the sliders to define your scenario. Each variable shifts the resilience signal on the right.
          </p>

          <div className="sliders">
            {VARIABLES.map((v) => {
              const value = values[v.id]
              const pct = ((value - v.min) / (v.max - v.min)) * 100
              return (
                <div className="slider" key={v.id}>
                  <div className="slider-row">
                    <label htmlFor={v.id} className="slider-label">
                      {v.label}
                      <span className="muted">— {v.hint}</span>
                    </label>
                    <span className="slider-value">{value}</span>
                  </div>
                  <input
                    id={v.id}
                    type="range"
                    className="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={value}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))
                    }
                    style={{ ['--pct' as string]: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>

          <button className="reset" type="button" onClick={() => setValues(defaults)}>
            Reset to baseline
          </button>
        </div>

        <div className="card assessment">
          <h2>Assessment</h2>
          <p className="card-sub">A composite signal across the five levers you've set.</p>

          <div className="score-block">
            <div className="dial">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={dialRadius} className="dial-track" />
                <circle
                  cx="100"
                  cy="100"
                  r={dialRadius}
                  className="dial-fill"
                  style={{
                    strokeDasharray: dialCircumference,
                    strokeDashoffset: dialOffset,
                    stroke: bandStrokeColor,
                  }}
                />
              </svg>
              <div className="dial-center">
                <div className="dial-score">{score}</div>
                <div className="dial-suffix">Resilience</div>
              </div>
            </div>
            <span className={`band ${band.className}`}>
              <span className="dot" />
              {band.label}
            </span>
          </div>

          <div className="metrics">
            <div className="metric">
              <p className="metric-label">Implied emissions</p>
              <p className="metric-value">
                {emissions.toLocaleString()}<span className="metric-unit">tCO₂e</span>
              </p>
            </div>
            <div className="metric">
              <p className="metric-label">Transition exposure</p>
              <p className="metric-value">
                {exposure}<span className="metric-unit">/ 100</span>
              </p>
            </div>
            <div className="metric">
              <p className="metric-label">Robust through</p>
              <p className="metric-value">{horizon}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Model confidence</p>
              <p className="metric-value">
                {confidence}<span className="metric-unit">%</span>
              </p>
            </div>
          </div>

          <p className="narrative">{band.narrative}</p>
        </div>
      </div>

      <footer className="footer">ScenarioOne · Scenario sandbox · Figures are illustrative</footer>
    </div>
  )
}

export default App
