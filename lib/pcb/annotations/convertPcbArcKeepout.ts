import { type AltiumArcRecord, approximateAltiumArc } from "altiumts"
import type { PCBKeepout } from "circuit-json"
import {
  approximatePcbKeepoutCircle,
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

  // A full-circle stroke fills the center when its width reaches the diameter.
  if (isDedicatedKeepout && isFullCircle && widthMils >= radiusMils * 2) {
    return {
      type: "pcb_keepout",
      pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
      shape: "circle",
      center: toMillimeterPoint(center),
      radius: milsToMillimeters(radiusMils + widthMils / 2),
      layers: layerMap.layers,
      description: "Altium circular keepout",
    }
  }

  const layer = layerMap.getLayer(record.layer)
  const layers = isDedicatedKeepout ? layerMap.layers : layer ? [layer] : []
  if (layers.length === 0) return undefined
  const outline = (
    isFullCircle
      ? approximatePcbKeepoutCircle({
          center,
          radiusMils,
          startAngleDegrees: record.startAngle,
          widthMils,
        })
      : approximateAltiumArc({
          center,
          radius: radiusMils,
          startAngleDegrees: record.startAngle,
          endAngleDegrees: record.endAngle,
        })
  ).map(toMillimeterPoint)
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
