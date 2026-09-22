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
  ccwRotationDegrees: number
  offsetXMils: number
  offsetYMils: number
}

export function getAltiumPadGeometry(
  record: AltiumPadRecord,
): AltiumPadGeometry | undefined {
  const layerOrdinal = getPadStackLayerOrdinal(record)
  const size = getPadSize(record, layerOrdinal)
  if (!size) return undefined

  const defaultShape = getPadShape(record, layerOrdinal)
  const alternateShape = record
    .getCaseInsensitive(`LAYER${layerOrdinal}ALTSHAPE`)
    ?.toUpperCase()
  // Conventional shapes use SHAPE/BOTTOMSHAPE; only ROUNDRECT is an override.
  const shape = alternateShape === "ROUNDRECT" ? alternateShape : defaultShape
  const cornerRadiusPercent =
    shape === "ROUNDRECT"
      ? Number(record.getCaseInsensitive(`LAYER${layerOrdinal}CORNERRADIUS`))
      : undefined
  const cornerRadiusMils =
    cornerRadiusPercent !== undefined && Number.isFinite(cornerRadiusPercent)
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
  const layerOrdinal = getPadStackLayerOrdinal(record)
  const offsetXMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEXOFFSET`, `PADXOFFSET${layerOrdinal}`],
  })
  const offsetYMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEYOFFSET`, `PADYOFFSET${layerOrdinal}`],
  })
  // Altium stores hole offsets and rotation in the pad's local coordinates.
  const ccwPadRotationRadians = (record.rotation * Math.PI) / 180

  return {
    ccwRotationDegrees: normalizeAltiumAngle(
      record.rotation + record.holeRotation,
    ),
    offsetXMils:
      offsetXMils * Math.cos(ccwPadRotationRadians) -
      offsetYMils * Math.sin(ccwPadRotationRadians),
    offsetYMils:
      offsetXMils * Math.sin(ccwPadRotationRadians) +
      offsetYMils * Math.cos(ccwPadRotationRadians),
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

function getPadStackLayerOrdinal(record: AltiumPadRecord): number {
  const normalizedLayer = (record.layer ?? "")
    .replace(/[\s_.-]+/gu, "")
    .toUpperCase()
  if (normalizedLayer === "BOTTOM" || normalizedLayer === "BOTTOMLAYER") {
    return BOTTOM_LAYER_ORDINAL
  }

  const innerLayer = /^(?:MIDLAYER|MID|INTERNALPLANE)(\d+)$/u.exec(
    normalizedLayer,
  )
  if (!innerLayer?.[1]) return TOP_LAYER_ORDINAL
  return Math.min(Math.max(Number(innerLayer[1]), 1), 30)
}

function getPadSize(
  record: AltiumPadRecord,
  layerOrdinal: number,
): { height: number; width: number } | undefined {
  if (layerOrdinal === TOP_LAYER_ORDINAL) return record.size
  if (layerOrdinal === BOTTOM_LAYER_ORDINAL) {
    return record.bottomSize ?? record.size
  }

  if (record.padMode === 2 && layerOrdinal >= 2) {
    const widthMils = getOptionalPadMeasurement(record, [
      `LAYER${layerOrdinal}XSIZE`,
      "MIDXSIZE",
      "XSIZE",
    ])
    const heightMils = getOptionalPadMeasurement(record, [
      `LAYER${layerOrdinal}YSIZE`,
      "MIDYSIZE",
      "YSIZE",
    ])
    if (widthMils !== undefined) {
      return { height: heightMils ?? widthMils, width: widthMils }
    }
  }

  return record.middleSize ?? record.size
}

function getPadShape(
  record: AltiumPadRecord,
  layerOrdinal: number,
): string | undefined {
  if (layerOrdinal === TOP_LAYER_ORDINAL) return record.shape
  if (layerOrdinal === BOTTOM_LAYER_ORDINAL) {
    return record.bottomShape ?? record.shape
  }
  if (record.padMode === 2 && layerOrdinal >= 2) {
    return (
      record.getCaseInsensitive(`LAYER${layerOrdinal}SHAPE`) ??
      record.middleShape ??
      record.shape
    )
  }
  return record.middleShape ?? record.shape
}

function getPadMeasurement({
  record,
  keys,
}: {
  record: AltiumPadRecord
  keys: readonly string[]
}): number {
  return getOptionalPadMeasurement(record, keys) ?? 0
}

function getOptionalPadMeasurement(
  record: AltiumPadRecord,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const measurementMils = parseAltiumMeasurementToMils(
      record.getCaseInsensitive(key),
    )
    if (measurementMils !== undefined) return measurementMils
  }
  return undefined
}
