import {
  type AltiumPoint,
  type AltiumRecord,
  type AltiumSchDoc,
  AltiumSchJunctionRecord,
  AltiumSchWireRecord,
  getSchematicRecordPoints,
} from "altiumts"
import type {
  AnyCircuitElement,
  SchematicTrace,
  SourceNet,
  SourceTrace,
} from "circuit-json"
import {
  createPortLeadEdges,
  getEquivalentPortPrunedSegmentKeys,
} from "./connectivity-geometry"
import {
  getLocation,
  pointKey,
  pointsEqual,
  type SchematicPointKey,
  scalePoint,
} from "./geometry"
import { isGroundNet, isPowerNet, sanitizeId, segmentKey } from "./ids"
import { splitSegmentAtPoints } from "./semantic-geometry"
import type {
  ConnectivityConversion,
  ConvertedPort,
  SemanticNetGraph,
  SemanticSchematicOptions,
  SourceNetName,
} from "./semantic-types"

export function convertConnectivity({
  convertedPorts,
  document,
  elements,
  handledRecords,
  options,
  semanticNetGraph: graph,
}: {
  convertedPorts: ConvertedPort[]
  document: AltiumSchDoc
  elements: AnyCircuitElement[]
  handledRecords: Set<AltiumRecord>
  options: SemanticSchematicOptions
  semanticNetGraph: SemanticNetGraph
}): ConnectivityConversion {
  const sourceNetIdByName = new Map<SourceNetName, string>()
  const sourceNetIdByRecord = new Map<AltiumRecord, string>()
  const sourcePortCountByRecord = new Map<AltiumRecord, number>()
  const sourceTraceIdByRecord = new Map<AltiumRecord, string>()
  const schematicTraceIdByRecord = new Map<AltiumRecord, string>()
  const portsByPoint = groupByPoint(convertedPorts)

  for (const [netIndex, net] of graph.nets.entries()) {
    const wires = net.records.filter(
      (record): record is AltiumSchWireRecord =>
        record instanceof AltiumSchWireRecord,
    )
    const connectedConvertedPorts = uniqueConvertedPorts(
      net.points.flatMap((point) => portsByPoint.get(pointKey(point)) ?? []),
    )
    const connectedPorts = connectedConvertedPorts.map(
      ({ sourcePort }) => sourcePort.source_port_id,
    )
    if (
      wires.length === 0 &&
      !(
        (net.names.length > 0 && connectedPorts.length > 0) ||
        connectedPorts.length > 1
      )
    ) {
      continue
    }
    const sourceNetIds = net.names.map((name) =>
      getOrCreateSourceNet({
        elements,
        name,
        sourceNetIdByName,
      }),
    )
    for (const record of net.records) {
      const firstSourceNetId = sourceNetIds[0]
      if (firstSourceNetId) sourceNetIdByRecord.set(record, firstSourceNetId)
    }

    const sourceTraceId = `source_trace_altium_${netIndex}`
    for (const record of net.records) {
      sourcePortCountByRecord.set(record, connectedPorts.length)
      sourceTraceIdByRecord.set(record, sourceTraceId)
    }
    const sourceTrace: SourceTrace = {
      type: "source_trace",
      connected_source_net_ids: sourceNetIds,
      connected_source_port_ids: connectedPorts,
      display_name: net.names[0],
      name: net.names[0],
      source_trace_id: sourceTraceId,
    }
    elements.push(sourceTrace)

    const netJunctions = document.records
      .filter(
        (record) =>
          record instanceof AltiumSchJunctionRecord &&
          net.points.some((point) => pointsEqual(point, getLocation(record))),
      )
      .flatMap((record) => {
        handledRecords.add(record)
        const location = getLocation(record)
        return location ? [scalePoint(location, options.scale)] : []
      })

    for (const wire of wires) handledRecords.add(wire)
    const prunedSegmentKeys = getEquivalentPortPrunedSegmentKeys({
      convertedPorts: connectedConvertedPorts,
      net,
      wires,
    })
    let renderedWireIndex = 0
    for (const wire of wires) {
      const wireRecordIndex = document.records.indexOf(wire)
      const schematicTraceId = `schematic_trace_altium_${wireRecordIndex}`
      const points = getSchematicRecordPoints(wire)
      const edges: SchematicTrace["edges"] = []
      for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
        const from = points[pointIndex - 1]
        const to = points[pointIndex]
        if (!from || !to) continue
        const segmentPoints = splitSegmentAtPoints(from, to, net.points)
        for (
          let segmentPointIndex = 1;
          segmentPointIndex < segmentPoints.length;
          segmentPointIndex++
        ) {
          const segmentFrom = segmentPoints[segmentPointIndex - 1]
          const segmentTo = segmentPoints[segmentPointIndex]
          if (!segmentFrom || !segmentTo) continue
          if (prunedSegmentKeys.has(segmentKey(segmentFrom, segmentTo))) {
            continue
          }
          const fromPort = portsByPoint
            .get(pointKey(segmentFrom))
            ?.find((port) => port.isSchematicVisible)
          const toPort = portsByPoint
            .get(pointKey(segmentTo))
            ?.find((port) => port.isSchematicVisible)
          const fromPortId = getPortIdAtElectricalPoint(
            fromPort,
            segmentFrom,
            options.scale,
          )
          const toPortId = getPortIdAtElectricalPoint(
            toPort,
            segmentTo,
            options.scale,
          )
          edges.push({
            from: scalePoint(segmentFrom, options.scale),
            to: scalePoint(segmentTo, options.scale),
            ...(fromPortId ? { from_schematic_port_id: fromPortId } : {}),
            ...(toPortId ? { to_schematic_port_id: toPortId } : {}),
          })
        }
      }
      if (edges.length === 0) continue
      schematicTraceIdByRecord.set(wire, schematicTraceId)
      elements.push({
        type: "schematic_trace",
        edges,
        junctions: renderedWireIndex === 0 ? netJunctions : [],
        schematic_sheet_id: options.schematicSheetId,
        schematic_trace_id: schematicTraceId,
        source_trace_id: sourceTraceId,
      } satisfies SchematicTrace)
      renderedWireIndex++
    }

    for (const convertedPort of connectedConvertedPorts) {
      if (!convertedPort.isSchematicVisible) continue
      const electricalTerminal = scalePoint(convertedPort.point, options.scale)
      if (pointsEqual(convertedPort.schematicPort.center, electricalTerminal)) {
        continue
      }
      const portRecordIndex = document.records.indexOf(convertedPort.record)
      elements.push({
        type: "schematic_trace",
        edges: createPortLeadEdges(convertedPort, electricalTerminal),
        junctions: [],
        schematic_sheet_id: options.schematicSheetId,
        schematic_trace_id: `schematic_trace_altium_port_lead_${portRecordIndex}`,
        source_trace_id: sourceTraceId,
      } satisfies SchematicTrace)
    }

    const connectedPortIds = new Set(connectedPorts)
    for (const convertedPort of convertedPorts) {
      if (
        convertedPort.isSchematicVisible &&
        connectedPortIds.has(convertedPort.sourcePort.source_port_id)
      ) {
        convertedPort.schematicPort.is_connected = true
      }
    }
  }

  return {
    schematicTraceIdByRecord,
    sourceNetIdByName,
    sourceNetIdByRecord,
    sourcePortCountByRecord,
    sourceTraceIdByRecord,
  }
}

export function getOrCreateSourceNet({
  elements,
  name,
  sourceNetIdByName,
}: {
  elements: AnyCircuitElement[]
  name: string
  sourceNetIdByName: Map<SourceNetName, string>
}): string {
  const normalizedName = name.trim().toUpperCase() as SourceNetName
  const existing = sourceNetIdByName.get(normalizedName)
  if (existing) return existing

  const sourceNetIdBase = `source_net_altium_${sanitizeId(name)}`
  const existingIds = new Set(
    elements.flatMap((element) =>
      element.type === "source_net" ? [element.source_net_id] : [],
    ),
  )
  let sourceNetId = sourceNetIdBase
  let suffix = 2
  while (existingIds.has(sourceNetId)) {
    sourceNetId = `${sourceNetIdBase}_${suffix}`
    suffix++
  }
  const sourceNet: SourceNet = {
    type: "source_net",
    is_ground: isGroundNet(name),
    is_power: isPowerNet(name),
    member_source_group_ids: [],
    name,
    source_net_id: sourceNetId,
  }
  elements.push(sourceNet)
  sourceNetIdByName.set(normalizedName, sourceNetId)
  return sourceNetId
}

function groupByPoint(
  ports: ConvertedPort[],
): Map<SchematicPointKey, ConvertedPort[]> {
  const grouped = new Map<SchematicPointKey, ConvertedPort[]>()
  for (const port of ports) {
    const key = pointKey(port.point)
    const existing = grouped.get(key)
    if (existing) existing.push(port)
    else grouped.set(key, [port])
  }
  return grouped
}

function uniqueConvertedPorts(ports: ConvertedPort[]): ConvertedPort[] {
  const seenSourcePortIds = new Set<string>()
  return ports.filter((port) => {
    const sourcePortId = port.sourcePort.source_port_id
    if (seenSourcePortIds.has(sourcePortId)) return false
    seenSourcePortIds.add(sourcePortId)
    return true
  })
}

function getPortIdAtElectricalPoint(
  port: ConvertedPort | undefined,
  electricalPoint: AltiumPoint,
  scale: number,
): string | undefined {
  if (!port?.isSchematicVisible) return undefined
  return pointsEqual(
    port.schematicPort.center,
    scalePoint(electricalPoint, scale),
  )
    ? port.schematicPort.schematic_port_id
    : undefined
}
