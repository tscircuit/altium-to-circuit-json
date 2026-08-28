import type { AltiumDimensionRecord, AltiumPcbDocument } from "altiumts"
import type { PcbFabricationNoteDimension } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import {
  getPcbAnnotationColor,
  getPcbAnnotationComponentId,
  getPcbAnnotationLayer,
} from "./pcb-annotation-properties"

export function convertAltiumPcbDimension({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumDimensionRecord
  recordIndex: number
}): PcbFabricationNoteDimension | undefined {
  const start = record.start
  const end = record.end
  if (!start || !end) return undefined

  const measuredDelta = { x: end.x - start.x, y: end.y - start.y }
  const measuredDistanceMils = Math.hypot(measuredDelta.x, measuredDelta.y)
  if (measuredDistanceMils === 0) return undefined

  const perpendicular = {
    x: normalizeSignedZero(-measuredDelta.y / measuredDistanceMils),
    y: normalizeSignedZero(measuredDelta.x / measuredDistanceMils),
  }
  const lineAnchor = record.dimensionLineAnchor ?? start
  const signedOffsetMils =
    (lineAnchor.x - start.x) * perpendicular.x +
    (lineAnchor.y - start.y) * perpendicular.y
  const offsetDirection =
    signedOffsetMils < 0
      ? {
          x: normalizeSignedZero(-perpendicular.x),
          y: normalizeSignedZero(-perpendicular.y),
        }
      : perpendicular

  return {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: `pcb_fabrication_note_dimension_altium_${recordIndex}`,
    pcb_component_id: getPcbAnnotationComponentId(record),
    layer: getPcbAnnotationLayer({ document, record }),
    from: toMillimeterPoint(start),
    to: toMillimeterPoint(end),
    text: getDimensionLabel({ measuredDistanceMils, record }),
    offset_distance: milsToMillimeters(Math.abs(signedOffsetMils)),
    offset_direction: offsetDirection,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.textHeightMils ?? 50),
    color: getPcbAnnotationColor(record),
    arrow_size: milsToMillimeters(
      record.getAltiumMeasurement("ARROWSIZE")?.toMils() ?? 40,
    ),
  }
}

function getDimensionLabel({
  measuredDistanceMils,
  record,
}: {
  measuredDistanceMils: number
  record: AltiumDimensionRecord
}): string {
  const textFormat = record.getDecoded("TEXTFORMAT")?.trim()
  if (textFormat && textFormat !== "<>") return textFormat

  const precision = Math.min(Math.max(record.precision ?? 2, 0), 6)
  const { amount, unitLabel } = convertMilsToDimensionUnit({
    measuredDistanceMils,
    unit: record.unit,
  })
  return `${record.prefix ?? ""}${amount.toFixed(precision)}${record.suffix ?? ` ${unitLabel}`}`
}

function convertMilsToDimensionUnit({
  measuredDistanceMils,
  unit,
}: {
  measuredDistanceMils: number
  unit: string | undefined
}): { amount: number; unitLabel: string } {
  const normalizedUnit = unit?.toUpperCase() ?? "MILS"
  if (normalizedUnit.includes("MILLIMETER")) {
    return { amount: milsToMillimeters(measuredDistanceMils), unitLabel: "mm" }
  }
  if (normalizedUnit.includes("CENTIMETER")) {
    return { amount: measuredDistanceMils * 0.00254, unitLabel: "cm" }
  }
  if (normalizedUnit.includes("INCH")) {
    return { amount: measuredDistanceMils / 1_000, unitLabel: "in" }
  }
  return { amount: measuredDistanceMils, unitLabel: "mil" }
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}
