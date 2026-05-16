// ScenarioOne — UK 2040 nature-positive stress test for crop agriculture.
//
// Calculation approach mirrors FABLE Calculator:
//   production_t   = area_ha × yield_t_per_ha
//   water_m3       = production_t × (green + blue + grey water footprint)
//   N_applied_kg   = area_ha × N_rate × fertiliser_intensity_multiplier
//   emissions_kg   = N_applied_kg × IPCC tier-1 EF (1%) × 44/28 × 298 (GWP100)
//                    + residue / tillage constant per ha
//
// Sources:
//  - Water footprints (wf_*_m3_t): FABLE 2021 EmbedWaterCrop (Mekonnen-Hoekstra global means).
//  - Yields & N rates: UK reference values (Defra/AHDB typical, 2020-22). Hand-coded — to be
//    replaced with UK FABLE instance / Defra Farm Practices Survey when available.
//  - Emission factors: IPCC 2019 Refinement, tier 1.
//
// Peas water proxied from field_beans (FABLE has no peas water entry).
// Linseed grey-water set to 0 (FABLE has no linseed grey entry).

export type RegionKey =
  | 'east_england'
  | 'south_east'
  | 'south_west'
  | 'east_midlands'
  | 'west_midlands'
  | 'yorkshire'
  | 'north_east'
  | 'north_west'
  | 'scotland'
  | 'wales'
  | 'northern_ireland'

export type CropKey =
  | 'wheat'
  | 'barley'
  | 'oats'
  | 'osr'
  | 'sugar_beet'
  | 'potatoes'
  | 'field_beans'
  | 'peas'
  | 'maize'
  | 'linseed'
  | 'rye'

export type SoilTypeKey = 'loam' | 'clay' | 'chalky' | 'sandy' | 'peaty'

export type BusinessModelKey =
  | 'high_input_commodity'
  | 'regenerative'
  | 'contract_grower'
  | 'diversified'

type BusinessModel = { key: BusinessModelKey; label: string }

export const BUSINESS_MODELS: BusinessModel[] = [
  { key: 'high_input_commodity', label: 'High-input commodity' },
  { key: 'regenerative',         label: 'Regenerative' },
  { key: 'contract_grower',      label: 'Contract grower' },
  { key: 'diversified',          label: 'Diversified' },
]

type Region = {
  key: RegionKey
  label: string
  waterMod: number   // catchment stress multiplier (higher = drier)
  biodivMod: number  // habitat-pressure multiplier
  landMod: number    // protected-area / land-pressure multiplier
}

export const REGIONS: Region[] = [
  { key: 'east_england',     label: 'East of England',    waterMod: 1.4, biodivMod: 1.3, landMod: 1.2 },
  { key: 'south_east',       label: 'South East',         waterMod: 1.3, biodivMod: 1.2, landMod: 1.3 },
  { key: 'south_west',       label: 'South West',         waterMod: 0.9, biodivMod: 1.1, landMod: 1.0 },
  { key: 'east_midlands',    label: 'East Midlands',      waterMod: 1.1, biodivMod: 1.0, landMod: 1.1 },
  { key: 'west_midlands',    label: 'West Midlands',      waterMod: 0.9, biodivMod: 1.0, landMod: 1.0 },
  { key: 'yorkshire',        label: 'Yorkshire & Humber', waterMod: 1.0, biodivMod: 0.9, landMod: 1.0 },
  { key: 'north_east',       label: 'North East',         waterMod: 0.8, biodivMod: 0.9, landMod: 0.9 },
  { key: 'north_west',       label: 'North West',         waterMod: 0.7, biodivMod: 1.0, landMod: 0.9 },
  { key: 'scotland',         label: 'Scotland',           waterMod: 0.7, biodivMod: 1.1, landMod: 1.0 },
  { key: 'wales',            label: 'Wales',              waterMod: 0.8, biodivMod: 1.1, landMod: 1.0 },
  { key: 'northern_ireland', label: 'Northern Ireland',   waterMod: 0.8, biodivMod: 1.0, landMod: 0.9 },
]

type Crop = {
  key: CropKey
  label: string
  // UK reference (Defra/AHDB)
  yield_t_ha: number
  n_kg_ha: number
  fixesN: boolean
  // FABLE EmbedWaterCrop (m³ per tonne of crop output)
  wf_green_m3_t: number
  wf_blue_m3_t: number
  wf_grey_m3_t: number
  // Hand-tuned 0-1 proxy until better data
  tillage_intensity: number
  biodiv_intensity: number
}

export const CROPS: Crop[] = [
  { key: 'wheat',       label: 'Winter wheat', yield_t_ha:  8.0, n_kg_ha: 180, fixesN: false, wf_green_m3_t: 1665, wf_blue_m3_t: 710,  wf_grey_m3_t: 142,  tillage_intensity: 0.6, biodiv_intensity: 0.6 },
  { key: 'barley',      label: 'Barley',       yield_t_ha:  6.5, n_kg_ha: 120, fixesN: false, wf_green_m3_t: 2539, wf_blue_m3_t: 751,  wf_grey_m3_t: 215,  tillage_intensity: 0.5, biodiv_intensity: 0.5 },
  { key: 'oats',        label: 'Oats',         yield_t_ha:  5.5, n_kg_ha: 100, fixesN: false, wf_green_m3_t: 1902, wf_blue_m3_t:  88,  wf_grey_m3_t: 439,  tillage_intensity: 0.4, biodiv_intensity: 0.3 },
  { key: 'osr',         label: 'Oilseed rape', yield_t_ha:  3.3, n_kg_ha: 220, fixesN: false, wf_green_m3_t: 3030, wf_blue_m3_t: 768,  wf_grey_m3_t: 344,  tillage_intensity: 0.6, biodiv_intensity: 0.7 },
  { key: 'sugar_beet',  label: 'Sugar beet',   yield_t_ha: 80.0, n_kg_ha:  90, fixesN: false, wf_green_m3_t:   92, wf_blue_m3_t:   1,  wf_grey_m3_t:  37,  tillage_intensity: 0.9, biodiv_intensity: 0.6 },
  { key: 'potatoes',    label: 'Potatoes',     yield_t_ha: 45.0, n_kg_ha: 170, fixesN: false, wf_green_m3_t:  339, wf_blue_m3_t:  73,  wf_grey_m3_t:  40,  tillage_intensity: 0.9, biodiv_intensity: 0.6 },
  { key: 'field_beans', label: 'Field beans',  yield_t_ha:  4.0, n_kg_ha:   0, fixesN: true,  wf_green_m3_t: 3533, wf_blue_m3_t: 329,  wf_grey_m3_t: 726,  tillage_intensity: 0.4, biodiv_intensity: 0.2 },
  { key: 'peas',        label: 'Peas',         yield_t_ha:  3.8, n_kg_ha:   0, fixesN: true,  wf_green_m3_t: 3533, wf_blue_m3_t: 329,  wf_grey_m3_t: 726,  tillage_intensity: 0.4, biodiv_intensity: 0.2 },
  { key: 'maize',       label: 'Forage maize', yield_t_ha: 40.0, n_kg_ha: 130, fixesN: false, wf_green_m3_t: 1832, wf_blue_m3_t:  95,  wf_grey_m3_t: 237,  tillage_intensity: 0.8, biodiv_intensity: 0.7 },
  { key: 'linseed',     label: 'Linseed',      yield_t_ha:  2.2, n_kg_ha:  80, fixesN: false, wf_green_m3_t: 5206, wf_blue_m3_t: 1380, wf_grey_m3_t:   0,  tillage_intensity: 0.5, biodiv_intensity: 0.4 },
  { key: 'rye',         label: 'Rye',          yield_t_ha:  4.5, n_kg_ha:  90, fixesN: false, wf_green_m3_t: 2665, wf_blue_m3_t:   0,  wf_grey_m3_t: 1672, tillage_intensity: 0.4, biodiv_intensity: 0.3 },
]

type Soil = { key: SoilTypeKey; label: string; mod: number }

export const SOIL_TYPES: Soil[] = [
  { key: 'loam',   label: 'Loam',   mod: 0.7 },
  { key: 'clay',   label: 'Clay',   mod: 0.9 },
  { key: 'chalky', label: 'Chalky', mod: 1.0 },
  { key: 'sandy',  label: 'Sandy',  mod: 1.1 },
  { key: 'peaty',  label: 'Peaty',  mod: 1.5 },
]

export type CropRow = {
  uid: string
  crop: CropKey | ''
  hectares: number
}

export type FarmInputs = {
  region: RegionKey
  crops: CropRow[]
  irrigationPct: number       // 0-100, % of area irrigated
  fertiliserIntensity: number // 0-100, slider where 65 ≈ UK average
  soilType: SoilTypeKey
  businessModelType: BusinessModelKey
  subsidyDependence: number   // 0-100, % of revenue from subsidies
}

type VectorKey = 'land' | 'water' | 'soil' | 'biodiv' | 'supply'

export type VectorResult = {
  key: VectorKey
  label: string
  score: number
  deficit: string | null
}

type Lever = {
  label: string
  detail: string
  impact: Partial<Record<VectorKey, number>>
}

export type Band = {
  key: 'critical' | 'risk' | 'sustainable' | 'future'
  label: string
  className: string
  narrative: string
}

type Totals = {
  production_t: number          // tonnes/yr
  freshwater_m3: number         // m³/yr — blue (irrigation) + grey (pollution dilution).
                                // Green water (rainfall absorbed by crop) is EXCLUDED:
                                // it isn't abstracted and shouldn't be scored against
                                // a catchment ceiling.
  emissions_tco2e: number       // tCO₂e/yr
  n_applied_t: number           // tonnes N/yr
}

export type Assessment = {
  score: number
  band: Band
  vectors: VectorResult[]
  levers: Lever[]
  totalHa: number
  totals: Totals
}

// UK 2040 nature-positive pathway thresholds (per-hectare, illustrative).
// Sources to wire next: Defra Environmental Land Management targets, EA abstraction caps,
// CCC Sixth Carbon Budget agricultural pathway, 25YEP soil-organic-matter targets.
const T = {
  // Freshwater LOAD = blue (irrigation) + grey (pollution-dilution).
  // Green water (rainfall absorbed by crop) is excluded — it isn't abstracted.
  freshwater_m3_ha: 2500,
  n_kg_ha:          180,   // kg N/ha — broadly aligned with CCC ambition (~30% cut on 2020 avg)
  emissions:        4.0,   // tCO₂e/ha — Sixth Carbon Budget arable trajectory
  hectarage:        500,   // ha — at which "land pressure" stress saturates for a single business
} as const

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function bandFor(score: number): Band {
  if (score < 35) {
    return {
      key: 'critical',
      label: 'Not viable',
      className: 'band-critical',
      narrative:
        'Business model unlikely to remain viable under the UK 2040 nature-positive pathway without material restructuring.',
    }
  }
  if (score < 55) {
    return {
      key: 'risk',
      label: 'At risk',
      className: 'band-risk',
      narrative:
        'Multiple risk vectors break under 2040 conditions. Targeted transition is needed within five years to remain compliant and financeable.',
    }
  }
  if (score < 75) {
    return {
      key: 'sustainable',
      label: 'Adapting',
      className: 'band-sustainable',
      narrative:
        'Viable with mitigation. A small set of levers closes the remaining gap to the 2040 pathway.',
    }
  }
  return {
    key: 'future',
    label: 'Resilient',
    className: 'band-future',
    narrative:
      'Operations align with the UK 2040 pathway. Maintain monitoring and re-run as targets tighten.',
  }
}

// Per-business-model loosening of vector thresholds. Regenerative gets a 20% wider
// N envelope and 15% wider freshwater envelope to reflect cover-cropping + reduced
// blue abstraction in that model. Other models keep baseline thresholds.
function thresholdsFor(bm: BusinessModelKey) {
  if (bm === 'regenerative') {
    return {
      freshwater_m3_ha: T.freshwater_m3_ha * 1.15,
      n_kg_ha: T.n_kg_ha * 1.2,
      emissions: T.emissions,
      hectarage: T.hectarage,
    }
  }
  return { ...T }
}

export function computeAssessment(input: FarmInputs): Assessment {
  const region = REGIONS.find((r) => r.key === input.region)!
  const soil = SOIL_TYPES.find((s) => s.key === input.soilType)!
  const Tx = thresholdsFor(input.businessModelType)
  const filled = input.crops
    .map((c) => ({ row: c, crop: CROPS.find((cc) => cc.key === c.crop) }))
    .filter((c): c is { row: CropRow; crop: Crop } => !!c.crop && c.row.hectares > 0)

  const totalHa = filled.reduce((s, c) => s + c.row.hectares, 0)

  // Fertiliser intensity scales N application and grey-water (pollution-dilution) load.
  // 65 ≈ UK baseline; range 0.4–1.6× of UK reference rates.
  const fertMul = 0.4 + (input.fertiliserIntensity / 100) * 1.2

  // === Production-based aggregates (FABLE-style) ===
  let production_t = 0
  let freshwater_m3 = 0  // blue (irrigation) + grey (pollution-dilution); green excluded
  let n_applied_kg = 0
  let emissions_kg_co2e = 0
  let monocultureLoad = 0 // weighted biodiv intensity × ha
  let tillageLoad = 0     // weighted tillage intensity × ha

  // Irrigation enters the abstraction load linearly: 0% irrigated → no blue water from
  // FABLE's "fully irrigated" reference; 100% irrigated → full FABLE blue value.
  const blueScale = input.irrigationPct / 100

  for (const { row, crop } of filled) {
    const ha = row.hectares
    const prod_t = ha * crop.yield_t_ha
    const n_kg = crop.fixesN ? 0 : ha * crop.n_kg_ha * fertMul

    // Freshwater LOAD: blue scaled by irrigation share, grey scaled by fertiliser intensity
    // (grey water = water needed to dilute fertiliser pollution to ambient quality).
    const water =
      prod_t *
      (crop.wf_blue_m3_t * blueScale + crop.wf_grey_m3_t * fertMul)

    // IPCC tier-1: 1% of synthetic N → N₂O-N, × 44/28 → N₂O, × 298 → CO₂e.
    const fertEmissions = n_kg * 0.01 * (44 / 28) * 298
    const residueEmissions = ha * 500 // ~500 kgCO₂e/ha for residues, tillage, cultivation
    const emissions = fertEmissions + residueEmissions

    production_t += prod_t
    freshwater_m3 += water
    n_applied_kg += n_kg
    emissions_kg_co2e += emissions
    monocultureLoad += ha * crop.biodiv_intensity
    tillageLoad += ha * crop.tillage_intensity
  }

  const uniqueCrops = new Set(filled.map((c) => c.row.crop)).size
  const diversityBonus = Math.min(uniqueCrops * 3, 18)

  // === Per-hectare intensities (the comparable thing across farm sizes) ===
  const safeHa = totalHa || 1
  const water_per_ha = freshwater_m3 / safeHa
  const n_per_ha = n_applied_kg / safeHa
  const emissions_per_ha = emissions_kg_co2e / safeHa / 1000 // tCO₂e/ha
  const tillage_per_ha = tillageLoad / safeHa
  const biodiv_per_ha = monocultureLoad / safeHa

  // === Vector scores: each starts at 100 and loses 50 when at threshold ===
  // Catchment stress modifier applies at the score layer, not the absolute load.
  const waterScore = clamp(
    100 - ((water_per_ha * region.waterMod) / Tx.freshwater_m3_ha) * 50,
    0,
    100,
  )

  // Supply = synthetic-N exposure. Heavier penalty than soil because of input-restriction risk.
  const supplyScore = clamp(100 - (n_per_ha / Tx.n_kg_ha) * 60, 0, 100)

  // Soil = tillage + N intensity, modulated by soil type (peaty most fragile).
  const soilScore = clamp(
    100 -
      (tillage_per_ha * soil.mod * 60 +
        (n_per_ha / Tx.n_kg_ha) * 30) +
      diversityBonus * 0.3,
    0,
    100,
  )

  // Biodiv = monoculture/habitat-cost load, with rotation diversity rewarded heavily.
  const biodivScore = clamp(
    100 - biodiv_per_ha * region.biodivMod * 60 + diversityBonus,
    0,
    100,
  )

  // Land = farm size × regional pressure, saturating at T.hectarage.
  const landScore = clamp(
    100 - (totalHa / Tx.hectarage) * 50 * region.landMod,
    0,
    100,
  )

  // === Emissions optionally informs supply (transition-risk signal) ===
  const emissionsOver = emissions_per_ha > Tx.emissions

  const vectors: VectorResult[] = [
    {
      key: 'land',
      label: 'Land',
      score: Math.round(landScore),
      deficit:
        landScore < 60
          ? `${Math.round(totalHa)} ha exceeds the regional 2040 land-pressure envelope (${Math.round(Tx.hectarage / region.landMod)} ha threshold).`
          : null,
    },
    {
      key: 'water',
      label: 'Water',
      score: Math.round(waterScore),
      deficit:
        waterScore < 60
          ? `Freshwater load of ${Math.round(water_per_ha).toLocaleString('en-GB')} m³/ha (blue + grey) — ${Math.round((water_per_ha * region.waterMod / Tx.freshwater_m3_ha - 1) * 100)}% above the 2040 catchment & pollution ceiling.`
          : null,
    },
    {
      key: 'soil',
      label: 'Soil',
      score: Math.round(soilScore),
      deficit:
        soilScore < 60
          ? `Tillage + N intensity on ${soil.label.toLowerCase()} soil above the 2040 soil-health threshold.`
          : null,
    },
    {
      key: 'biodiv',
      label: 'Biodiversity',
      score: Math.round(biodivScore),
      deficit:
        biodivScore < 60
          ? `Rotation diversity and habitat load below the 2040 BNG / ELM conditionality threshold.`
          : null,
    },
    {
      key: 'supply',
      label: 'Supply',
      score: Math.round(supplyScore),
      deficit:
        supplyScore < 60
          ? `Synthetic-N at ${Math.round(n_per_ha)} kg/ha — above the 2040 input-restriction envelope (${Math.round(Tx.n_kg_ha)} kg/ha).${emissionsOver ? ` Field emissions ${emissions_per_ha.toFixed(1)} tCO₂e/ha breach the 4.0 ceiling.` : ''}`
          : null,
    },
  ]

  const overall = Math.round(
    (landScore + waterScore + soilScore + biodivScore + supplyScore) / 5,
  )

  const levers: Lever[] = []
  if (waterScore < 70) {
    levers.push({
      label: 'Cut irrigation 30%',
      detail:
        'Shift high-water crops to dryland varieties; deploy precision irrigation on remainder.',
      impact: { water: 14 },
    })
  }
  if (soilScore < 70) {
    levers.push({
      label: 'Introduce legume rotation on 20% of area',
      detail:
        'Replace a fifth of N-heavy crops with field beans or peas to fix nitrogen and rest soils.',
      impact: { soil: 12, supply: 10, biodiv: 4 },
    })
  }
  if (biodivScore < 70) {
    levers.push({
      label: 'Convert 10% to herbal leys & field margins',
      detail:
        'Restore rotational diversity and field-margin habitat — qualifies for ELM uplift payments.',
      impact: { biodiv: 16, soil: 5 },
    })
  }
  if (supplyScore < 70) {
    levers.push({
      label: 'Reduce fertiliser intensity 25%',
      detail:
        'Move to variable-rate N and integrate organic amendments to cut synthetic dependency.',
      impact: { supply: 12, soil: 6 },
    })
  }
  if (landScore < 70 && totalHa > 0) {
    levers.push({
      label: 'Retire 10% of lowest-yielding land',
      detail:
        'Move marginal area into agroforestry or restoration to reduce footprint while qualifying for transition finance.',
      impact: { land: 10, biodiv: 6 },
    })
  }

  return {
    score: overall,
    band: bandFor(overall),
    vectors,
    levers,
    totalHa,
    totals: {
      production_t,
      freshwater_m3,
      emissions_tco2e: emissions_kg_co2e / 1000,
      n_applied_t: n_applied_kg / 1000,
    },
  }
}

// ============================================================================
// Business-model viability layer (financial stress-test on top of nature scores)
// ============================================================================

const CROP_PRICE_PER_T: Partial<Record<CropKey, number>> = {
  wheat: 900,
  osr: 950,
  barley: 750,
}
const DEFAULT_CROP_PRICE_PER_T = 700

const CROP_PRICE_ANNUAL_GROWTH: Partial<Record<CropKey, number>> = {
  wheat: 0.016,
  barley: 0.014,
  oats: 0.013,
  osr: 0.018,
  sugar_beet: 0.015,
  potatoes: 0.02,
  field_beans: 0.021,
  peas: 0.021,
  maize: 0.014,
  linseed: 0.018,
  rye: 0.013,
}
const DEFAULT_CROP_PRICE_ANNUAL_GROWTH = 0.015

const LAND_VALUE_PER_HA_2026: Record<RegionKey, number> = {
  east_england: 11_500,
  south_east: 12_000,
  south_west: 10_500,
  east_midlands: 10_800,
  west_midlands: 10_200,
  yorkshire: 9_800,
  north_east: 8_900,
  north_west: 9_200,
  scotland: 7_800,
  wales: 8_400,
  northern_ireland: 9_000,
}

const OPERATING_COST_RATIO: Record<BusinessModelKey, number> = {
  high_input_commodity: 0.76,
  regenerative: 0.7,
  contract_grower: 0.74,
  diversified: 0.68,
}

export type VerdictKey = 'structural' | 'transformation' | 'viable'

export type Verdict = {
  key: VerdictKey
  label: string
  className: string
}

export type LendingFlag = {
  key: 'natwest_lloyds' | 'covenant' | 'eib_ukib'
  text: string
}

export type BusinessViability = {
  cropRevenue: number
  subsidyIncome: number
  // Upside revenue streams unlocked by transition. Each fires conditionally;
  // zero when the gate isn't met.
  elmUplift: number
  bngIncome: number
  regenPremium: number
  transitionUpside: number
  totalRevenue: number
  retentionRate: number
  subsidyAtRisk: number
  nCostShock: number
  waterRevenueLoss: number
  totalImpact: number
  netMarginImpactPerHa: number
  upsidePerHa: number
  netPositionPerHa: number
  impactAsPercentOfRevenue: number
  verdict: Verdict
  flags: LendingFlag[]
}

export type ProjectionYear = {
  year: number
  pressure: number
  cropRevenue: number
  subsidyIncome: number
  transitionUpside: number
  totalRevenue: number
  operatingCosts: number
  landCost: number
  waterCost: number
  complianceCost: number
  financeAndInsuranceCost: number
  naturePolicyCosts: number
  totalCosts: number
  netMargin: number
  marginPct: number
}

export type BusinessProjection = {
  startYear: number
  endYear: number
  years: ProjectionYear[]
  breakYear: number | null
  breakEvenPressure: number | null
  revenue2040: number
  costs2040: number
  margin2040: number
  margin2040PerHa: number
  assumptions: {
    weightedCropPriceGrowth: number
    operatingCostRatio: number
    landValuePerHa2026: number
    waterCostPerM32040: number
  }
}

const WATER_STRESSED_REGIONS: ReadonlyArray<RegionKey> = [
  'east_england',
  'east_midlands',
  'south_east',
]

function verdictFor(
  pct: number,
  bm: BusinessModelKey,
): Verdict {
  // Diversified operations absorb more revenue shock before they're structurally
  // at risk — the 20% boundary shifts to 25%.
  const structuralAt = bm === 'diversified' ? 0.25 : 0.2
  if (pct >= structuralAt) {
    return { key: 'structural', label: 'Structural risk', className: 'verdict-critical' }
  }
  if (pct >= 0.1) {
    return { key: 'transformation', label: 'Needs transformation', className: 'verdict-risk' }
  }
  return { key: 'viable', label: 'Viable with adaptation', className: 'verdict-future' }
}

function retentionFor(compositeScore: number, bm: BusinessModelKey): number {
  // Baseline ELM/SFI retention by composite spider score.
  let r: number
  if (compositeScore > 75) r = 1.0
  else if (compositeScore >= 50) r = 0.6
  else r = 0.2
  // Contract growers carry less direct entitlement and lose a tier of retention.
  if (bm === 'contract_grower') {
    if (r === 1.0) r = 0.6
    else if (r === 0.6) r = 0.2
    else r = 0.0
  }
  return r
}

export function computeBusinessViability(
  input: FarmInputs,
  assessment: Assessment,
): BusinessViability {
  const { totalHa, vectors, score: compositeScore } = assessment
  const nScore = vectors.find((v) => v.key === 'supply')!.score
  const waterScore = vectors.find((v) => v.key === 'water')!.score

  // === Revenue ===
  let cropRevenue = 0
  for (const row of input.crops) {
    if (!row.crop || row.hectares <= 0) continue
    const crop = CROPS.find((c) => c.key === row.crop)
    if (!crop) continue
    const price = CROP_PRICE_PER_T[row.crop] ?? DEFAULT_CROP_PRICE_PER_T
    cropRevenue += row.hectares * crop.yield_t_ha * price
  }

  // === Subsidy ===
  // Solve subsidyIncome / (cropRevenue + subsidyIncome) = sd, clamped to avoid /0 at 100%.
  // The dependence slider reflects today's revenue mix; transition upside is added on top,
  // not back-solved into the dependence ratio.
  // Bounded per-ha to UK reality: £120/ha floor (SFI base), £400/ha ceiling (BPS-era +
  // stacked SFI base options upper bound). Without the ceiling, the back-solve produces
  // figures that scale with crop revenue and quickly exceed actual UK subsidy receipts
  // for high-revenue arable — bloating subsidy-at-risk and dominating the verdict.
  const sd = clamp(input.subsidyDependence, 0, 95) / 100
  const rawSubsidy = sd > 0 ? (cropRevenue / (1 - sd)) * sd : 0
  const subsidyFloor = sd > 0 ? 120 * totalHa : 0
  const subsidyCeiling = sd > 0 ? 400 * totalHa : 0
  const subsidyIncome =
    sd > 0 ? clamp(rawSubsidy, subsidyFloor, subsidyCeiling) : 0

  // === Transition upside (revenue gates that open under nature-positive trajectories) ===
  const biodivScore = vectors.find((v) => v.key === 'biodiv')!.score
  // ELM uplift tiers — aligned with CS higher-tier published rates.
  let elmRate = 0
  if (compositeScore > 85) elmRate = 600
  else if (compositeScore > 75) elmRate = 400
  else if (compositeScore > 60) elmRate = 200
  const elmUplift = elmRate * totalHa

  // BNG income — order-of-magnitude only. Gated on business model (only regen/diversified
  // realistically register units) AND biodiv vector signalling habitat capacity exists.
  const bngEligible =
    (input.businessModelType === 'regenerative' ||
      input.businessModelType === 'diversified') && biodivScore > 60
  const bngRate = biodivScore > 75 ? 50 : 25
  const bngIncome = bngEligible ? bngRate * totalHa : 0

  // Regenerative price premium — conservative 10% on crop revenue (mid of 8-12%).
  const regenPremium =
    input.businessModelType === 'regenerative' ? cropRevenue * 0.1 : 0

  const transitionUpside = elmUplift + bngIncome + regenPremium
  const totalRevenue = cropRevenue + subsidyIncome + transitionUpside

  // === Subsidy retention vs 2040 conditionality ===
  const retentionRate = retentionFor(compositeScore, input.businessModelType)
  const subsidyAtRisk = subsidyIncome * (1 - retentionRate)

  // === N price shock (only fires when Supply vector is amber or rust) ===
  // Per-ha N rate is derivable from total N applied / total area; reuses model output.
  const n_kg_per_ha = totalHa > 0 ? (assessment.totals.n_applied_t * 1000) / totalHa : 0
  const N_PRICE_DELTA_PER_T = 380 - 280 // £/t — 2040 carbon-priced nitrogen uplift
  const nCostShock =
    nScore < 75 ? totalHa * n_kg_per_ha * 0.001 * N_PRICE_DELTA_PER_T : 0

  // === Water revenue loss (abstraction tightening in water-stressed regions) ===
  const irrigatedHa = totalHa * (input.irrigationPct / 100)
  const waterRegion = WATER_STRESSED_REGIONS.includes(input.region)
  const waterRevenueLoss =
    waterScore < 75 && waterRegion ? irrigatedHa * 0.4 * 150 : 0

  // === Roll-up ===
  const totalImpact = subsidyAtRisk + nCostShock + waterRevenueLoss
  const netMarginImpactPerHa = totalHa > 0 ? totalImpact / totalHa : 0
  const upsidePerHa = totalHa > 0 ? transitionUpside / totalHa : 0
  // Positive = farm gains net from the transition; negative = exposure exceeds upside.
  const netPositionPerHa = upsidePerHa - netMarginImpactPerHa
  const impactAsPercentOfRevenue =
    totalRevenue > 0 ? totalImpact / totalRevenue : 0

  // === Lending flags ===
  const flags: LendingFlag[] = []
  if (nScore < 50 && input.subsidyDependence > 50) {
    flags.push({
      key: 'natwest_lloyds',
      text:
        'High-input subsidy-dependent profile is outside NatWest/Lloyds sustainable agriculture lending criteria.',
    })
  }
  if (waterScore < 50 && waterRegion) {
    flags.push({
      key: 'covenant',
      text:
        'Abstraction-dependent operations face covenant risk on green loans.',
    })
  }
  if (input.businessModelType === 'high_input_commodity' && compositeScore < 50) {
    flags.push({
      key: 'eib_ukib',
      text:
        'This model profile is increasingly excluded from EIB and UKIB nature-linked agricultural finance.',
    })
  }

  return {
    cropRevenue,
    subsidyIncome,
    elmUplift,
    bngIncome,
    regenPremium,
    transitionUpside,
    totalRevenue,
    retentionRate,
    subsidyAtRisk,
    nCostShock,
    waterRevenueLoss,
    totalImpact,
    netMarginImpactPerHa,
    upsidePerHa,
    netPositionPerHa,
    impactAsPercentOfRevenue,
    verdict: verdictFor(impactAsPercentOfRevenue, input.businessModelType),
    flags,
  }
}

export function computeBusinessProjection(
  input: FarmInputs,
  assessment: Assessment,
  viability: BusinessViability,
): BusinessProjection {
  const startYear = 2026
  const endYear = 2040
  const region = REGIONS.find((r) => r.key === input.region)!
  const operatingCostRatio = OPERATING_COST_RATIO[input.businessModelType]
  const landValuePerHa2026 = LAND_VALUE_PER_HA_2026[input.region]
  const landScore = assessment.vectors.find((v) => v.key === 'land')!.score
  const waterScore = assessment.vectors.find((v) => v.key === 'water')!.score
  const supplyScore = assessment.vectors.find((v) => v.key === 'supply')!.score
  const biodivScore = assessment.vectors.find((v) => v.key === 'biodiv')!.score
  const totalHa = assessment.totalHa
  const horizon = endYear - startYear
  const waterRisk = clamp((75 - waterScore) / 75, 0, 1)
  const supplyRisk = clamp((75 - supplyScore) / 75, 0, 1)
  const biodivRisk = clamp((75 - biodivScore) / 75, 0, 1)
  const landRisk = clamp((75 - landScore) / 75, 0, 1)
  const natureRisk = clamp((75 - assessment.score) / 75, 0, 1)
  const waterRegion = WATER_STRESSED_REGIONS.includes(input.region)
  const landCapitalRate2040 =
    0.018 + 0.012 * landRisk + (input.businessModelType === 'high_input_commodity' ? 0.004 : 0)
  const waterCostPerM32040 =
    0.015 + 0.045 * region.waterMod + (waterRegion ? 0.025 : 0) * waterRisk
  const demandShift2040 =
    input.businessModelType === 'regenerative'
      ? 0.04
      : input.businessModelType === 'diversified'
        ? 0.02
        : input.businessModelType === 'contract_grower'
          ? -0.03 * natureRisk
          : -0.08 * natureRisk

  let weightedGrowth = 0
  let weightedRevenueBase = 0
  const years: ProjectionYear[] = []

  for (let year = startYear; year <= endYear; year++) {
    const elapsed = year - startYear
    const pressure = horizon > 0 ? elapsed / horizon : 1
    const landValue = landValuePerHa2026 * Math.pow(1.012, elapsed)
    const landCapitalRate = 0.018 + (landCapitalRate2040 - 0.018) * pressure
    const waterCostPerM3 = 0.015 + (waterCostPerM32040 - 0.015) * pressure

    let cropRevenue = 0
    for (const row of input.crops) {
      if (!row.crop || row.hectares <= 0) continue
      const crop = CROPS.find((c) => c.key === row.crop)
      if (!crop) continue
      const basePrice = CROP_PRICE_PER_T[row.crop] ?? DEFAULT_CROP_PRICE_PER_T
      const growth = CROP_PRICE_ANNUAL_GROWTH[row.crop] ?? DEFAULT_CROP_PRICE_ANNUAL_GROWTH
      const cropBaseRevenue = row.hectares * crop.yield_t_ha * basePrice
      const demandModifier = 1 + demandShift2040 * pressure
      cropRevenue += cropBaseRevenue * Math.pow(1 + growth, elapsed) * demandModifier

      if (year === startYear) {
        weightedGrowth += cropBaseRevenue * growth
        weightedRevenueBase += cropBaseRevenue
      }
    }

    const subsidyIncome = Math.max(0, viability.subsidyIncome - viability.subsidyAtRisk * pressure)
    const transitionUpside = viability.transitionUpside * pressure
    const totalRevenue = cropRevenue + subsidyIncome + transitionUpside
    const operatingCosts =
      cropRevenue * operatingCostRatio * (1 + pressure * (0.018 + 0.035 * supplyRisk))
    const landCost = totalHa * landValue * landCapitalRate
    const waterCost = assessment.totals.freshwater_m3 * waterCostPerM3
    const complianceCost =
      totalRevenue *
      pressure *
      (0.006 +
        0.01 * biodivRisk +
        0.008 * supplyRisk +
        (input.businessModelType === 'high_input_commodity' ? 0.006 : 0))
    const financeAndInsuranceCost =
      totalRevenue *
      (0.012 +
        pressure *
          (0.006 +
            0.018 * natureRisk +
            (input.businessModelType === 'regenerative' ? -0.004 : 0)))
    const naturePolicyCosts =
      pressure *
      (viability.nCostShock + viability.waterRevenueLoss + totalHa * 18 * landRisk)
    const totalCosts =
      operatingCosts +
      landCost +
      waterCost +
      complianceCost +
      financeAndInsuranceCost +
      naturePolicyCosts
    const netMargin = totalRevenue - totalCosts

    years.push({
      year,
      pressure,
      cropRevenue,
      subsidyIncome,
      transitionUpside,
      totalRevenue,
      operatingCosts,
      landCost,
      waterCost,
      complianceCost,
      financeAndInsuranceCost,
      naturePolicyCosts,
      totalCosts,
      netMargin,
      marginPct: totalRevenue > 0 ? netMargin / totalRevenue : 0,
    })
  }

  let breakYear: number | null = null
  let breakEvenPressure: number | null = null
  for (let i = 1; i < years.length; i++) {
    const prev = years[i - 1]
    const curr = years[i]
    if (prev.netMargin >= 0 && curr.netMargin < 0) {
      const share = prev.netMargin / (prev.netMargin - curr.netMargin)
      breakYear = prev.year + share
      breakEvenPressure = prev.pressure + (curr.pressure - prev.pressure) * share
      break
    }
  }

  const last = years[years.length - 1]
  return {
    startYear,
    endYear,
    years,
    breakYear,
    breakEvenPressure,
    revenue2040: last.totalRevenue,
    costs2040: last.totalCosts,
    margin2040: last.netMargin,
    margin2040PerHa: totalHa > 0 ? last.netMargin / totalHa : 0,
    assumptions: {
      weightedCropPriceGrowth: weightedRevenueBase > 0 ? weightedGrowth / weightedRevenueBase : 0,
      operatingCostRatio,
      landValuePerHa2026,
      waterCostPerM32040,
    },
  }
}
