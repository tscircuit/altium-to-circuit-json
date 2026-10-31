import { type AltiumArcRecord, approximateAltiumArc } from "altiumts"
import type { PCBKeepout } from "circuit-json"
import {
  createCircularKeepoutBrep,
  milsToMillimeters,
  toMillimeterPoint,
} from "../geometry"
import { isKeepoutLayer, type PcbCopperLayerMap } from "../layers"

export function convertPcbArcKeepout({
  layerMap,
  record,
  recordIndex,
}: {
  layerMap: PcbCopperLayerMap
  record: AltiumArcRecord
  recordIndex: number
}): PCBKeepout | undefined {
  const center = record.center
  const radiusMils = record.radiusMils
  if (!center || !radiusMils) return undefined

  const isFullCircle = record.isFullCircle
  const widthMils = record.widthMils ?? 4
  const isDedicatedKeepout = isKeepoutLayer(record.layer)

  const layer = layerMap.getLayer(record.layer)
  const layers = isDedicatedKeepout ? layerMap.layers : layer ? [layer] : []
  if (layers.length === 0) return undefined

  if (isFullCircle && widthMils > 0) {
    const outerRadius = milsToMillimeters(radiusMils + widthMils / 2)
    const innerRadius = milsToMillimeters(
      Math.max(0, radiusMils - widthMils / 2),
    )
    const common = {
      type: "pcb_keepout" as const,
      pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
      layers,
      description: "Altium circular keepout",
    }
    if (innerRadius === 0) {
      return {
        ...common,
        shape: "circle",
        center: toMillimeterPoint(center),
        radius: outerRadius,
      }
    }
    return {
      ...common,
      shape: "brep",
      brep_shape: createCircularKeepoutBrep({
        center: toMillimeterPoint(center),
        innerRadius,
        outerRadius,
      }),
    }
  }

  const outline = approximateAltiumArc({
    center,
    radius: radiusMils,
    startAngleDegrees: record.startAngle,
    endAngleDegrees: record.endAngle,
  }).map(toMillimeterPoint)
  const firstPoint = outline[0]
  if (!firstPoint || outline.length < 2) return undefined
  if (isFullCircle) outline[outline.length - 1] = firstPoint

  return {
    type: "pcb_keepout",
    pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
    shape: "outline",
    outline,
    stroke_width: milsToMillimeters(widthMils),
    layers,
    description: "Altium arc keepout",
  }
}
