import type { AltiumTrackRecord } from "altiumts"
import type { PCBKeepout } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { isKeepoutLayer, type PcbCopperLayerMap } from "../layers"

export function convertPcbTrackKeepout({
  layerMap,
  record,
  recordIndex,
}: {
  layerMap: PcbCopperLayerMap
  record: AltiumTrackRecord
  recordIndex: number
}): PCBKeepout | undefined {
  const start = record.start
  const end = record.end
  if (!start || !end) return undefined
  const layer = layerMap.getLayer(record.layer)
  const layers = isKeepoutLayer(record.layer)
    ? layerMap.layers
    : layer
      ? [layer]
      : []
  if (layers.length === 0) return undefined

  return {
    type: "pcb_keepout",
    pcb_keepout_id: `pcb_keepout_altium_track_${recordIndex}`,
    shape: "outline",
    outline: [toMillimeterPoint(start), toMillimeterPoint(end)],
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    layers,
    description: "Altium track keepout",
  }
}
