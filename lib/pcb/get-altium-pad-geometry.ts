import {
  type AltiumPadRecord,
  normalizeAltiumAngle,
  parseAltiumMeasurementToMils,
} from "altiumts"

// Altium uses fixed top and bottom ordinals in its 32-entry pad-stack table.
const TOP_LAYER_ORDINAL = 0
const BOTTOM_LAYER_ORDINAL = 31

interface AltiumPadGeometry {
  cornerRadiusMils: number | undefined
  heightMils: number
  shape: string
  widthMils: number
}

interface AltiumPadHoleGeometry {
  offsetXMils: number
  offsetYMils: number
  rotation: number
}

export function getAltiumPadGeometry(
  record: AltiumPadRecord,
): AltiumPadGeometry | undefined {
  const layerOrdinal = getPadLayerOrdinal(record)
  const isBottomLayer = layerOrdinal === BOTTOM_LAYER_ORDINAL
  const size = isBottomLayer ? (record.bottomSize ?? record.size) : record.size
  if (!size) return undefined

  const defaultShape = isBottomLayer
    ? (record.bottomShape ?? record.shape)
    : record.shape
  const alternateShape = record
    .getCaseInsensitive(`LAYER${layerOrdinal}ALTSHAPE`)
    ?.toUpperCase()
  // Conventional shapes use SHAPE/BOTTOMSHAPE; only ROUNDRECT is an override.
  const shape = alternateShape === "ROUNDRECT" ? alternateShape : defaultShape
  const cornerRadiusPercent = Number(
    record.getCaseInsensitive(`LAYER${layerOrdinal}CORNERRADIUS`),
  )
  const cornerRadiusMils =
    shape === "ROUNDRECT" && Number.isFinite(cornerRadiusPercent)
      ? (Math.min(size.width, size.height) * cornerRadiusPercent) / 200
      : undefined

  return {
    cornerRadiusMils,
    heightMils: size.height,
    shape: shape ?? "ROUND",
    widthMils: size.width,
  }
}

export function getAltiumPadHoleGeometry(
  record: AltiumPadRecord,
): AltiumPadHoleGeometry {
  const layerOrdinal = getPadLayerOrdinal(record)
  const offsetXMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEXOFFSET`, `PADXOFFSET${layerOrdinal}`],
  })
  const offsetYMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEYOFFSET`, `PADYOFFSET${layerOrdinal}`],
  })
  // Altium stores hole offsets and rotation in the pad's local coordinates.
  const radians = (record.rotation * Math.PI) / 180

  return {
    offsetXMils:
      offsetXMils * Math.cos(radians) - offsetYMils * Math.sin(radians),
    offsetYMils:
      offsetXMils * Math.sin(radians) + offsetYMils * Math.cos(radians),
    rotation: normalizeAltiumAngle(record.rotation + record.holeRotation),
  }
}

export function getAltiumSlotHoleSize(record: AltiumPadRecord): {
  heightMils: number
  widthMils: number
} {
  const holeSizeMils = Math.max(record.holeSizeMils ?? 1, 1)
  const slotLengthMils =
    parseAltiumMeasurementToMils(record.getCaseInsensitive("SLOTLENGTH")) ??
    record.holeWidthMils ??
    holeSizeMils
  return {
    heightMils: holeSizeMils,
    widthMils: Math.max(slotLengthMils, holeSizeMils),
  }
}

function getPadLayerOrdinal(record: AltiumPadRecord): number {
  const normalizedLayer = record.layer?.replaceAll(" ", "").toUpperCase()
  return normalizedLayer === "BOTTOM" || normalizedLayer === "BOTTOMLAYER"
    ? BOTTOM_LAYER_ORDINAL
    : TOP_LAYER_ORDINAL
}

function getPadMeasurement({
  record,
  keys,
}: {
  record: AltiumPadRecord
  keys: readonly string[]
}): number {
  for (const key of keys) {
    const value = parseAltiumMeasurementToMils(record.getCaseInsensitive(key))
    if (value !== undefined) return value
  }
  return 0
}
