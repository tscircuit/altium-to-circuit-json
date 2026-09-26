import type { AltiumTrackRecord } from "altiumts"
import type { PcbSilkscreenLine } from "circuit-json"
import { milsToMillimeters, withNumberedPoints } from "../geometry"
import {
  getPcbComponentIdForRecord,
  type PcbComponentIdMap,
} from "../identifiers"
import { mapOverlayLayer } from "../layers"

export function convertPcbSilkscreenLine({
  componentIds,
  record,
  recordIndex,
}: {
  componentIds: PcbComponentIdMap
  record: AltiumTrackRecord
  recordIndex: number
}): PcbSilkscreenLine | undefined {
  if (!record.start || !record.end) return undefined
  return {
    type: "pcb_silkscreen_line",
    pcb_silkscreen_line_id: `pcb_silkscreen_line_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record, componentIds),
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    ...withNumberedPoints(record.start, record.end),
    layer: mapOverlayLayer(record.layer),
  }
}
