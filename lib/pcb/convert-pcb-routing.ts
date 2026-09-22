import {
  type AltiumArcRecord,
  type AltiumTrackRecord,
  type AltiumViaRecord,
  approximateAltiumArc,
} from "altiumts"
import type { PcbTrace, PcbVia } from "circuit-json"

import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import { mapAltiumCopperLayer } from "./map-altium-copper-layer"
import type { PcbNetContext } from "./types"

export function convertPcbTrack({
  record,
  recordIndex,
  netContext,
}: {
  record: AltiumTrackRecord
  recordIndex: number
  netContext: PcbNetContext
}): PcbTrace | undefined {
  const start = record.start
  const end = record.end
  const layer = mapAltiumCopperLayer(record.layer)
  if (!start || !end || !layer) return undefined
  const width = milsToMillimeters(record.widthMils ?? 4)
  const sourceTraceId = netContext.getSourceTraceId(record)
  return {
    type: "pcb_trace",
    pcb_trace_id: `pcb_trace_altium_${recordIndex}`,
    ...(sourceTraceId ? { source_trace_id: sourceTraceId } : {}),
    should_round_corners: true,
    route: [
      { route_type: "wire", ...toMillimeterPoint(start), width, layer },
      { route_type: "wire", ...toMillimeterPoint(end), width, layer },
    ],
  }
}

export function convertPcbArcTrack({
  record,
  recordIndex,
  netContext,
}: {
  record: AltiumArcRecord
  recordIndex: number
  netContext: PcbNetContext
}): PcbTrace | undefined {
  if (!record.center || !record.radiusMils) return undefined
  const layer = mapAltiumCopperLayer(record.layer)
  if (!layer) return undefined
  const width = milsToMillimeters(record.widthMils ?? 4)
  const points = approximateAltiumArc({
    center: record.center,
    radius: record.radiusMils,
    startAngleDegrees: record.startAngle,
    endAngleDegrees: record.endAngle,
  })
  const sourceTraceId = netContext.getSourceTraceId(record)

  return {
    type: "pcb_trace",
    pcb_trace_id: `pcb_trace_altium_arc_${recordIndex}`,
    ...(sourceTraceId ? { source_trace_id: sourceTraceId } : {}),
    should_round_corners: true,
    route: points.map((point) => ({
      route_type: "wire",
      ...toMillimeterPoint(point),
      width,
      layer,
    })),
  }
}

export function convertPcbVia({
  record,
  recordIndex,
  netContext,
}: {
  record: AltiumViaRecord
  recordIndex: number
  netContext: PcbNetContext
}): PcbVia | undefined {
  if (!record.position) return undefined
  const startLayer = mapAltiumCopperLayer(record.startLayer) ?? "top"
  const endLayer = mapAltiumCopperLayer(record.endLayer) ?? "bottom"
  const layers = startLayer === endLayer ? [startLayer] : [startLayer, endLayer]
  const outerDiameter = milsToMillimeters(record.diameterMils ?? 20)
  const sourceNetId = netContext.getSourceNetId(record)
  const sourceTraceId = netContext.getSourceTraceId(record)
  return {
    type: "pcb_via",
    pcb_via_id: `pcb_via_altium_${recordIndex}`,
    ...(sourceNetId ? { source_net_id: sourceNetId } : {}),
    ...(sourceTraceId ? { source_trace_id: sourceTraceId } : {}),
    ...toMillimeterPoint(record.position),
    outer_diameter: outerDiameter,
    hole_diameter: milsToMillimeters(
      record.holeSizeMils ?? (record.diameterMils ?? 20) * 0.45,
    ),
    layers,
    is_tented: record.tentedTop === true && record.tentedBottom === true,
  }
}
