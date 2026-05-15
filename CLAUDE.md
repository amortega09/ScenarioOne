# ScenarioOne

A nature-risk stress-testing tool for UK crop-agriculture businesses. A farm enters its
operation (region, soil, crop mix, irrigation %, fertiliser intensity) and the app scores
its business model against a UK 2040 nature-positive pathway derived from the 25 Year
Environment Plan, EIP 2023 and Kunming-Montreal targets.

## Stack

- Vite + React 19 + TypeScript
- Plain CSS (no framework), Google Fonts (Instrument Serif + DM Sans)
- No router, no state library, no backend — everything is local state

## Layout

- [src/App.tsx](src/App.tsx) — page shell, form state, and the inline `SpiderChart` SVG component
- [src/model.ts](src/model.ts) — all domain logic and coefficients
- [src/App.css](src/App.css) — component styles
- [src/index.css](src/index.css) — design tokens + global background

## Domain model ([src/model.ts](src/model.ts))

`computeAssessment(inputs: FarmInputs)` is the only function that matters. It returns:

- `score` — composite viability 0-100
- `band` — `critical | risk | sustainable | future` with label, css class, narrative
- `vectors` — five `{key, label, score, deficit}` results, one per risk vector
- `levers` — candidate transition actions, only surfaced for vectors below threshold
- `totalHa`
- `totals` — real-unit aggregates: `production_t`, `water_m3`, `emissions_tco2e`, `n_applied_t`

The five risk vectors are **Land, Water, Soil, Biodiversity, Supply**. Calculation mirrors
FABLE: `production = area × yield`, then `water = production × footprint`, then
`emissions = N_applied × IPCC tier-1 EF`. Each vector score is `100 − (intensity / threshold) × 50`.

## Coefficients

The `CROPS` table in [src/model.ts](src/model.ts) is partially real:

| Field | Source | Status |
|---|---|---|
| `wf_green_m3_t`, `wf_blue_m3_t`, `wf_grey_m3_t` | FABLE 2021 `EmbedWaterCrop` (Mekonnen-Hoekstra) | **Real**, global means |
| `yield_t_ha`, `n_kg_ha`, `fixesN` | UK Defra / AHDB typical 2020-22 | **Real**, hand-coded UK references |
| Emission factor (computed) | IPCC 2019 tier-1 (1% of N → N₂O) | **Real** logic, applied to UK N rates |
| `tillage_intensity`, `biodiv_intensity` | Hand-tuned 0-1 proxy | **Placeholder** |
| `REGIONS` modifiers (water/biodiv/land) | Hand-tuned per-region multipliers | **Placeholder** |
| `SOIL_TYPES` modifier | Hand-tuned (peaty most fragile) | **Placeholder** |
| Threshold constants `T` (water 4500 m³/ha, N 180 kg/ha, etc.) | CCC + Defra-aligned | **Indicative**, to refine |

[src/fable-coefficients.json](src/fable-coefficients.json) is the raw extraction audit
trail from FABLE's R_ASIPAC instance. The Asia-Pacific yields it contains are NOT used —
yields are overridden by UK reference values in `model.ts`. Real UK yields will need the
UK FABLE instance (separate file) or Defra Farm Practices Survey data.

The FABLE workbook ships in repo root: `2021_Open_FABLECalculator.xlsx`.

## Design system

Moss-green palette (`--moss-50` to `--moss-900`) on cream (`--cream`) with soft radial
gradients. Two card layout, glass-morphism panels. Spider chart uses the band colour for
its polygon fill — shape and colour both encode the result.

CSS tokens live in `:root` of [src/index.css](src/index.css). Fonts are referenced as
`'Instrument Serif', 'Fraunces', serif` (display) and `'DM Sans', system-ui` (body).
Instrument Serif only ships at weight 400.

## Conventions

- Tables (`REGIONS`, `CROPS`, `SOIL_TYPES`) are exported arrays of typed objects — keep
  one row per region/crop/soil; UI iterates them directly for `<select>` options.
- Scoring is intentionally simple and side-effect-free; if it grows, split into per-vector
  functions before adding any caching.
- The `SpiderChart` is inline in `App.tsx`. If a second visualisation is added, move it
  to its own file rather than continuing to grow `App.tsx`.
- No emoji, no comments that restate the code.
