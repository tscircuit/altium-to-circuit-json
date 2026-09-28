import {
  AltiumTrackRecord,
  type AltiumPcbDocument,
  type AltiumRecord,
} from "altiumts"
import type { SourceNet, SourceTrace } from "circuit-json"
import { milsToMillimeters } from "../geometry"
import type { PcbNetContext } from "../model"

function getMode(values: number[]): number | undefined {
  const counts = new Map<number, number>()
  let mode: number | undefined
  let modeCount = 0
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1
    counts.set(value, count)
    if (
      count > modeCount ||
      (count === modeCount && (mode === undefined || value < mode))
    ) {
      mode = value
      modeCount = count
    }
  }
  return mode
}

export function createPcbNetContext(
  document: AltiumPcbDocument,
): PcbNetContext {
  const sourceNetIdByAltiumNet = new Map(
    document.nets.map((net, index) => [net, `source_net_altium_pcb_${index}`]),
  )
  const sourceTraceIdByAltiumNet = new Map(
    document.nets.map((net, index) => [
      net,
      `source_trace_altium_pcb_${index}`,
    ]),
  )
  const connectedSourcePortIdsByAltiumNet = new Map(
    document.nets.map((net) => [net, [] as string[]]),
  )
  const traceWidthsByAltiumNet = new Map(
    document.nets.map((net) => [net, [] as number[]]),
  )

  function getRecordNet(record: AltiumRecord) {
    const directNet = document.getNetForRecord(record)
    if (directNet) return directNet
    const polygon = document.getPolygonForRecord(record)
    return polygon ? document.getNetForRecord(polygon) : undefined
  }

  for (const record of document.records) {
    if (!(record instanceof AltiumTrackRecord) || !record.widthMils) continue
    const net = getRecordNet(record)
    if (!net) continue
    traceWidthsByAltiumNet.get(net)?.push(milsToMillimeters(record.widthMils))
  }

  return {
    connectSourcePort: (record, sourcePortId) => {
      const net = getRecordNet(record)
      if (!net) return
      const sourcePortIds = connectedSourcePortIdsByAltiumNet.get(net)
      if (sourcePortIds && !sourcePortIds.includes(sourcePortId)) {
        sourcePortIds.push(sourcePortId)
      }
    },
    getElements: () =>
      document.nets.flatMap((net, index) => {
        const name = net.name?.trim() || `Net ${index + 1}`
        const sourceNetId = sourceNetIdByAltiumNet.get(net)
        const sourceTraceId = sourceTraceIdByAltiumNet.get(net)
        if (!sourceNetId || !sourceTraceId) return []

        return [
          {
            type: "source_net",
            source_net_id: sourceNetId,
            name,
            member_source_group_ids: [],
          } satisfies SourceNet,
          {
            type: "source_trace",
            source_trace_id: sourceTraceId,
            connected_source_port_ids: [
              ...(connectedSourcePortIdsByAltiumNet.get(net) ?? []),
            ],
            connected_source_net_ids: [sourceNetId],
            name,
            display_name: name,
            min_trace_thickness: getMode(traceWidthsByAltiumNet.get(net) ?? []),
          } satisfies SourceTrace,
        ]
      }),
    getSourceNetId: (record) => {
      const net = getRecordNet(record)
      return net ? sourceNetIdByAltiumNet.get(net) : undefined
    },
    getSourceTraceId: (record) => {
      const net = getRecordNet(record)
      return net ? sourceTraceIdByAltiumNet.get(net) : undefined
    },
  }
}
