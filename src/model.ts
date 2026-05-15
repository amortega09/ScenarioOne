// Illustrative coefficients for the UK 2040 nature-positive pathway stress test.
// All numbers are placeholders — to be replaced with FABLE / Defra / catchment data.

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

export type Region = {
  key: RegionKey
  label: string
  waterMod: number
  biodivMod: number
  landMod: number
}

export const REGIONS: Region[] = [
  { key: 'east_england',     label: 'East of England',      waterMod: 1.4, biodivMod: 1.3, landMod: 1.2 },
  { key: 'south_east',       label: 'South East',           waterMod: 1.3, biodivMod: 1.2, landMod: 1.3 },
  { key: 'south_west',       label: 'South West',           waterMod: 0.9, biodivMod: 1.1, landMod: 1.0 },
  { key: 'east_midlands',    label: 'East Midlands',        waterMod: 1.1, biodivMod: 1.0, landMod: 1.1 },
  { key: 'west_midlands',    label: 'West Midlands',        waterMod: 0.9, biodivMod: 1.0, landMod: 1.0 },
  { key: 'yorkshire',        label: 'Yorkshire & Humber',   waterMod: 1.0, biodivMod: 0.9, landMod: 1.0 },
  { key: 'north_east',       label: 'North East',           waterMod: 0.8, biodivMod: 0.9, landMod: 0.9 },
  { key: 'north_west',       label: 'North West',           waterMod: 0.7, biodivMod: 1.0, landMod: 0.9 },
  { key: 'scotland',         label: 'Scotland',             waterMod: 0.7, biodivMod: 1.1, landMod: 1.0 },
  { key: 'wales',            label: 'Wales',                waterMod: 0.8, biodivMod: 1.1, landMod: 1.0 },
  { key: 'northern_ireland', label: 'Northern Ireland',     waterMod: 0.8, biodivMod: 1.0, landMod: 0.9 },
]

export type Crop = {
  key: CropKey
  label: string
  water: number
  nDemand: number
  biodiv: number
  soil: number
}

export const CROPS: Crop[] = [
  { key: 'wheat',       label: 'Winter wheat', water: 0.4, nDemand: 0.8, biodiv: 0.6, soil: 0.7 },
  { key: 'barley',      label: 'Barley',       water: 0.3, nDemand: 0.6, biodiv: 0.5, soil: 0.5 },
  { key: 'oats',        label: 'Oats',         water: 0.3, nDemand: 0.4, biodiv: 0.3, soil: 0.3 },
  { key: 'osr',         label: 'Oilseed rape', water: 0.5, nDemand: 0.9, biodiv: 0.7, soil: 0.8 },
  { key: 'sugar_beet',  label: 'Sugar beet',   water: 0.7, nDemand: 0.7, biodiv: 0.6, soil: 0.9 },
  { key: 'potatoes',    label: 'Potatoes',     water: 0.9, nDemand: 0.7, biodiv: 0.6, soil: 0.8 },
  { key: 'field_beans', label: 'Field beans',  water: 0.3, nDemand: 0.1, biodiv: 0.2, soil: 0.2 },
  { key: 'peas',        label: 'Peas',         water: 0.3, nDemand: 0.1, biodiv: 0.2, soil: 0.2 },
  { key: 'maize',       label: 'Maize',        water: 0.7, nDemand: 0.7, biodiv: 0.7, soil: 0.9 },
  { key: 'linseed',     label: 'Linseed',      water: 0.3, nDemand: 0.4, biodiv: 0.3, soil: 0.4 },
  { key: 'rye',         label: 'Rye',          water: 0.3, nDemand: 0.4, biodiv: 0.3, soil: 0.3 },
]

export type Soil = { key: SoilTypeKey; label: string; mod: number }

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
  irrigationPct: number
  fertiliserIntensity: number
  soilType: SoilTypeKey
}

export type VectorKey = 'land' | 'water' | 'soil' | 'biodiv' | 'supply'

export type VectorResult = {
  key: VectorKey
  label: string
  score: number
  deficit: string | null
}

export type Lever = {
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

export type Assessment = {
  score: number
  band: Band
  vectors: VectorResult[]
  levers: Lever[]
  totalHa: number
}

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

export function computeAssessment(input: FarmInputs): Assessment {
  const region = REGIONS.find((r) => r.key === input.region)!
  const soil = SOIL_TYPES.find((s) => s.key === input.soilType)!
  const filled = input.crops.filter((c) => c.crop && c.hectares > 0)
  const totalHa = filled.reduce((s, c) => s + c.hectares, 0)

  const sum = (key: 'water' | 'nDemand' | 'biodiv' | 'soil') =>
    filled.reduce((s, c) => {
      const crop = CROPS.find((cc) => cc.key === c.crop)
      return crop ? s + c.hectares * crop[key] : s
    }, 0)

  const uniqueCrops = new Set(filled.map((c) => c.crop)).size
  const diversityBonus = Math.min(uniqueCrops * 3, 18)

  const landStress = (totalHa * region.landMod) / 5
  const landScore = clamp(100 - landStress, 0, 100)

  const irrigationFactor = (input.irrigationPct / 100) * 1.5 + 0.5
  const waterStress = (sum('water') * irrigationFactor * region.waterMod) / 4
  const waterScore = clamp(100 - waterStress, 0, 100)

  const fertFactor = (input.fertiliserIntensity / 100) * 0.8 + 0.5
  const soilStress = (sum('soil') * fertFactor * soil.mod) / 3
  const soilScore = clamp(100 - soilStress + diversityBonus * 0.3, 0, 100)

  const biodivStress = (sum('biodiv') * region.biodivMod) / 4
  const biodivScore = clamp(100 - biodivStress + diversityBonus, 0, 100)

  const supplyStress = (sum('nDemand') * fertFactor) / 3
  const supplyScore = clamp(100 - supplyStress, 0, 100)

  const vectors: VectorResult[] = [
    {
      key: 'land',
      label: 'Land',
      score: Math.round(landScore),
      deficit:
        landScore < 60
          ? `Cropped area exceeds the region's 2040 land-pressure threshold by ${Math.round(Math.max(landStress - 40, 5))}%.`
          : null,
    },
    {
      key: 'water',
      label: 'Water',
      score: Math.round(waterScore),
      deficit:
        waterScore < 60
          ? `Abstraction sits ${Math.round(Math.max(60 - waterScore, 5))}% above the projected 2040 catchment ceiling.`
          : null,
    },
    {
      key: 'soil',
      label: 'Soil',
      score: Math.round(soilScore),
      deficit:
        soilScore < 60
          ? `Cropping intensity exceeds the 2040 soil-health threshold for ${soil.label.toLowerCase()} soils.`
          : null,
    },
    {
      key: 'biodiv',
      label: 'Biodiversity',
      score: Math.round(biodivScore),
      deficit:
        biodivScore < 60
          ? `Habitat & rotation diversity below the 2040 BNG / ELM conditionality threshold.`
          : null,
    },
    {
      key: 'supply',
      label: 'Supply',
      score: Math.round(supplyScore),
      deficit:
        supplyScore < 60
          ? `Synthetic-N dependence above the 2040 input-restriction envelope.`
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
      detail: 'Shift high-water crops to dryland varieties; deploy precision irrigation on remainder.',
      impact: { water: 14 },
    })
  }
  if (soilScore < 70) {
    levers.push({
      label: 'Introduce legume rotation on 20% of area',
      detail: 'Replace a fifth of N-heavy crops with field beans or peas to fix nitrogen and rest soils.',
      impact: { soil: 12, supply: 10, biodiv: 4 },
    })
  }
  if (biodivScore < 70) {
    levers.push({
      label: 'Convert 10% to herbal leys & field margins',
      detail: 'Restore rotational diversity and field-margin habitat — qualifies for ELM uplift payments.',
      impact: { biodiv: 16, soil: 5 },
    })
  }
  if (supplyScore < 70) {
    levers.push({
      label: 'Reduce fertiliser intensity 25%',
      detail: 'Move to variable-rate N and integrate organic amendments to cut synthetic dependency.',
      impact: { supply: 12, soil: 6 },
    })
  }
  if (landScore < 70 && totalHa > 0) {
    levers.push({
      label: 'Retire 10% of lowest-yielding land',
      detail: 'Move marginal area into agroforestry or restoration to reduce footprint while qualifying for transition finance.',
      impact: { land: 10, biodiv: 6 },
    })
  }

  return {
    score: overall,
    band: bandFor(overall),
    vectors,
    levers,
    totalHa,
  }
}
