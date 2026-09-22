import {
  AltiumArcRecord,
  type AltiumDimensionRecord,
  type AltiumPcbDocument,
  type AltiumPoint,
  type AltiumRecord,
  AltiumTrackRecord,
  approximateAltiumArc,
  getPcbLayerStack,
  parseAltiumMeasurementToMils,
} from "altiumts"
import type {
  LayerRef,
  PCBKeepoutCircle,
  PcbFabricationNoteDimension,
  PcbFabricationNotePath,
} from "circuit-json"

import {
  BOARD_GRAPHICS_COMPONENT_ID,
  FABRICATION_NOTE_COLOR,
  MILS_TO_MILLIMETERS,
} from "./constants"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import { getPcbComponentIdForRecord } from "./ids"
import {
  getRecordLayer,
  isCourtyardLayer,
  mapCourtyardLayer,
  mapMechanicalLayer,
} from "./layers"
import { mapAltiumCopperLayer } from "./map-altium-copper-layer"

export function isExplodedPcbDimensionGraphic(
  document: AltiumPcbDocument,
  record: AltiumRecord,
): record is AltiumTrackRecord | AltiumArcRecord {
  if (
    !(record instanceof AltiumTrackRecord) &&
    !(record instanceof AltiumArcRecord)
  ) {
    return false
  }
  if (!isCourtyardLayer(getRecordLayer(record))) return false

  // EasyEDA exports dimensions as anonymous components made entirely from
  // vector strokes on Mechanical 15 instead of native Altium Dimension
  // records. Real component courtyards on this layer belong to top/bottom
  // components, while these exploded dimension graphics have no PCB side.
  return document.getComponentForRecord(record)?.side === "unknown"
}

export function convertPcbFabricationNotePath({
  record,
  recordIndex,
}: {
  record: AltiumTrackRecord | AltiumArcRecord
  recordIndex: number
}): PcbFabricationNotePath | undefined {
  let route: AltiumPoint[]
  if (record instanceof AltiumTrackRecord) {
    if (!record.start || !record.end) return undefined
    route = [record.start, record.end]
  } else {
    if (!record.center || !record.radiusMils) return undefined
    route = approximateAltiumArc({
      center: record.center,
      radius: record.radiusMils,
      startAngleDegrees: record.startAngle,
      endAngleDegrees: record.endAngle,
    })
  }

  return {
    type: "pcb_fabrication_note_path",
    pcb_fabrication_note_path_id: `pcb_fabrication_note_path_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    layer: mapCourtyardLayer(getRecordLayer(record)),
    route: route.map(toMillimeterPoint),
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    color: FABRICATION_NOTE_COLOR,
  }
}

export function convertPcbCircularKeepout({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumArcRecord
  recordIndex: number
}): PCBKeepoutCircle | undefined {
  const center = record.center
  const radiusMils = record.radiusMils
  const rawSweepDegrees = record.endAngle - record.startAngle
  const isFullCircle = rawSweepDegrees === 0 || Math.abs(rawSweepDegrees) >= 360
  if (!center || !radiusMils || !isFullCircle) return undefined

  return {
    type: "pcb_keepout",
    pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
    shape: "circle",
    center: toMillimeterPoint(center),
    radius: milsToMillimeters(radiusMils + (record.widthMils ?? 0) / 2),
    layers: getCopperLayers(document),
    description: "Altium circular keepout",
  }
}

export function convertPcbDimension({
  record,
  recordIndex,
}: {
  record: AltiumDimensionRecord
  recordIndex: number
}): PcbFabricationNoteDimension | undefined {
  const start = record.start
  const end = record.end
  if (!start || !end) return undefined

  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const lengthMils = Math.hypot(deltaX, deltaY)
  if (lengthMils === 0) return undefined

  const perpendicular = {
    x: -deltaY / lengthMils,
    y: deltaX / lengthMils,
  }
  const lineAnchor = record.dimensionLineAnchor ?? start
  const signedOffsetMils =
    (lineAnchor.x - start.x) * perpendicular.x +
    (lineAnchor.y - start.y) * perpendicular.y
  const offsetSign = signedOffsetMils < 0 ? -1 : 1

  return {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: `pcb_fabrication_note_dimension_altium_${recordIndex}`,
    pcb_component_id: BOARD_GRAPHICS_COMPONENT_ID,
    layer: mapMechanicalLayer(getRecordLayer(record)),
    from: toMillimeterPoint(start),
    to: toMillimeterPoint(end),
    text: getDimensionText(record, lengthMils),
    offset_distance: milsToMillimeters(Math.abs(signedOffsetMils)),
    offset_direction: {
      x: perpendicular.x * offsetSign,
      y: perpendicular.y * offsetSign,
    },
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.textHeightMils ?? 50),
    arrow_size: milsToMillimeters(getMeasurement(record, "ARROWSIZE") ?? 40),
    color: FABRICATION_NOTE_COLOR,
  }
}

function getCopperLayers(document: AltiumPcbDocument): LayerRef[] {
  if (!document.board) return ["top", "bottom"]
  const layers: LayerRef[] = getPcbLayerStack(document.board).entries.flatMap(
    (entry) => {
      const layer = mapAltiumCopperLayer(entry.name ?? entry.layerId)
      return layer ? [layer] : []
    },
  )
  return layers.length > 0 ? [...new Set(layers)] : ["top", "bottom"]
}

function getDimensionText(
  record: AltiumDimensionRecord,
  measuredDistanceMils: number,
): string {
  const explicitText = record.getDecoded("TEXTFORMAT")?.trim()
  const isMeasurementShapedFormat =
    explicitText !== undefined &&
    parseAltiumMeasurementToMils(explicitText) !== undefined
  if (explicitText && explicitText !== "<>" && !isMeasurementShapedFormat) {
    return explicitText
  }

  const precision = Math.min(Math.max(record.precision ?? 2, 0), 6)
  const normalizedUnit = record.unit?.toUpperCase() ?? "MILS"
  let amount = measuredDistanceMils
  let unitLabel = "mil"
  if (normalizedUnit.includes("MILLIMETER")) {
    amount *= MILS_TO_MILLIMETERS
    unitLabel = "mm"
  } else if (normalizedUnit.includes("CENTIMETER")) {
    amount *= MILS_TO_MILLIMETERS / 10
    unitLabel = "cm"
  } else if (normalizedUnit.includes("INCH")) {
    amount /= 1000
    unitLabel = "in"
  }
  const suffix = record.suffix?.trim() ? record.suffix : ` ${unitLabel}`
  return `${record.prefix ?? ""}${amount.toFixed(precision)}${suffix}`
}

function getMeasurement(record: AltiumRecord, key: string): number | undefined {
  return parseAltiumMeasurementToMils(record.getCaseInsensitive(key))
}
