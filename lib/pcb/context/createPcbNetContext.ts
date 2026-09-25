import type { AltiumPcbDocument, AltiumRecord } from "altiumts"
import type { SourceNet, SourceTrace } from "circuit-json"
import type { PcbNetContext } from "../model"

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
  const elements = document.nets.flatMap((net, index) => {
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
        connected_source_port_ids: [],
        connected_source_net_ids: [sourceNetId],
        name,
        display_name: name,
      } satisfies SourceTrace,
    ]
  })

  function getRecordNet(record: AltiumRecord) {
    const directNet = document.getNetForRecord(record)
    if (directNet) return directNet
    const polygon = document.getPolygonForRecord(record)
    return polygon ? document.getNetForRecord(polygon) : undefined
  }

  return {
    elements,
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
