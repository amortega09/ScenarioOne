# ScenarioOne

A nature-risk and business-model stress-testing tool for UK crop-agriculture businesses.
A farm enters its operation (region, soil, crop mix, irrigation, fertiliser, business
model, subsidy dependence) and the app scores it against a UK 2040 nature-positive
pathway derived from the 25 Year Environment Plan, EIP 2023 and Kunming-Montreal targets,
then layers a financial stress test on top: cost shocks, subsidy at risk, transition
upside, lending exclusions.

## Stack

- Vite + React 19 + TypeScript
- Plain CSS (no framework), Google Fonts (Instrument Serif + DM Sans)
- No router, no state library, no backend — everything is local state

## Layout

- [src/App.tsx](src/App.tsx) — page shell, form state, modals, and the inline `SpiderChart` SVG component
- [src/RevenueBar.tsx](src/RevenueBar.tsx) — stacked-bar SVG showing revenue composition vs. exposure
- [src/model.ts](src/model.ts) — all domain logic and coefficients (`computeAssessment` + `computeBusinessViability`)
- [src/App.css](src/App.css) — component styles
- [src/index.css](src/index.css) — design tokens + global background

## Domain model ([src/model.ts](src/model.ts))

Two functions matter.

`computeAssessment(inputs)` — nature layer. Returns `score`, `band`, five `vectors`
(**Land, Water, Soil, Biodiversity, Supply**), `levers`, `totalHa`, and real-unit `totals`.
Calculation mirrors FABLE: `production = area × yield`, `water = production × footprint`,
`emissions = N_applied × IPCC tier-1 EF`. Each vector score = `100 − (intensity / threshold) × 50`.
Thresholds are loosened for regenerative business models (N +20%, water +15%).

`computeBusinessViability(inputs, assessment)` — financial layer on top. Returns:
- **Exposure**: `subsidyAtRisk` (retention tier × subsidy), `nCostShock` (fires when Supply < 75),
  `waterRevenueLoss` (fires when Water < 75 in stressed regions), rolled into `totalImpact`.
- **Upside**: `elmUplift` (tiered £200/400/600 per ha at composite > 60/75/85), `bngIncome`
  (£25–50/ha when regen/diversified and biodiv > 60), `regenPremium` (10% of crop revenue
  for regenerative). Summed as `transitionUpside`.
- **Synthesis**: `totalRevenue = cropRevenue + subsidyIncome + transitionUpside`,
  `netPositionPerHa = upsidePerHa − netMarginImpactPerHa`,
  `impactAsPercentOfRevenue` drives the verdict (Structural risk / Needs transformation /
  Viable with adaptation). Diversified shifts the structural cutoff from 20% → 25%.
- **`flags`**: NatWest/Lloyds, green-loan covenant, EIB/UKIB exclusion conditions.

Subsidy dependence is anchored to crop revenue only; transition upside is added on top,
not back-solved into the dependence ratio. Baseline subsidy is bounded £120–£400/ha
(SFI floor → BPS+stacked-SFI ceiling) so the back-solved figure doesn't run away on
high-revenue arable.

## Coefficients

| Field | Source | Status |
|---|---|---|
| `wf_green_m3_t`, `wf_blue_m3_t`, `wf_grey_m3_t` | FABLE 2021 `EmbedWaterCrop` (Mekonnen-Hoekstra) | **Real**, global means |
| `yield_t_ha`, `n_kg_ha`, `fixesN` | UK Defra / AHDB typical 2020-22 | **Real**, hand-coded UK references |
| Emission factor (computed) | IPCC 2019 tier-1 (1% of N → N₂O) | **Real** logic on UK N rates |
| Threshold constants (water 2,500 m³/ha, N 180 kg/ha, etc.) | CCC + Defra-aligned | **Indicative** |
| Crop prices (wheat £900, OSR £950, barley £750, other £700/t) | UK farmgate 2024-25 | **Indicative** |
| N price uplift (£100/t, 2040 carbon-priced) | Implied trajectory | **Indicative** |
| ELM uplift tiers (£200/400/600/ha) | CS higher-tier published rates | **Indicative** |
| BNG income (£25–50/ha gated) | Public unit price range | **Indicative**, order-of-magnitude |
| Regen premium (10% on crop revenue) | Consumer WTP literature | **Indicative**, conservative |
| `tillage_intensity`, `biodiv_intensity` | Hand-tuned 0-1 proxy | **Placeholder** |
| `REGIONS` modifiers, `SOIL_TYPES` modifier | Hand-tuned | **Placeholder** |
| Subsidy retention tiers (1.0 / 0.6 / 0.2) | Hand-tuned conditionality | **Placeholder** |

[src/fable-coefficients.json](src/fable-coefficients.json) is the raw extraction audit
trail from FABLE's R_ASIPAC instance. The Asia-Pacific yields it contains are NOT used —
UK references in `model.ts` override. Real UK yields will need the UK FABLE instance.
The FABLE workbook ships in repo root: `2021_Open_FABLECalculator.xlsx`.

## UI

- Left card: **Farm profile** — four collapsible `<details>` groups (Geography, Crops,
  Practices, Financial). Reset button at bottom.
- Right card: **Stress Test Analysis** — two-tab segmented control (Nature / Financial).
  Nature shows real-unit totals tiles + `SpiderChart`. Financial shows the `RevenueBar`,
  Exposure rows, conditional Upside rows, and a Net position synthesis line.
- Top-right buttons on the right card: **At Risk** (modal with nature deficits + financial
  flags) and **Transition Plan** (modal with current → projected score and revenue-exposure
  delta, plus the lever list).
- Bottom-right: **View assumptions** modal (Real / Indicative / Placeholder / Structural).

## Design system

Moss-green palette (`--moss-50` to `--moss-900`) on cream (`--cream`) with soft radial
gradients. Spider chart polygon and verdict pills both pick up the band/verdict colour
so shape and colour encode the same result. CSS tokens live in `:root` of
[src/index.css](src/index.css). Fonts: `'Instrument Serif'` (display, 400 only) and
`'DM Sans'` (body).

## Conventions

- Tables (`REGIONS`, `CROPS`, `SOIL_TYPES`, `BUSINESS_MODELS`) are exported arrays of
  typed objects — keep one row per entry; UI iterates them directly for `<select>` options.
- Scoring is side-effect-free; if it grows, split into per-vector functions before adding
  caching.
- Visualisations live in their own files ([src/RevenueBar.tsx](src/RevenueBar.tsx)).
  `SpiderChart` is still inline in [src/App.tsx](src/App.tsx) for historical reasons —
  move it out next time it's touched.
- No emoji, no comments that restate the code.
