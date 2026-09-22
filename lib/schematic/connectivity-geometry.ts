import {
  type AltiumPoint,
  AltiumSchLabelRecord,
  AltiumSchNetLabelRecord,
  AltiumSchPortRecord,
  AltiumSchPowerPortRecord,
  type AltiumSchWireRecord,
  getSchematicRecordPoints,
} from "altiumts"
import type { SchematicTrace } from "circuit-json"

import {
  getLocation,
  pointKey,
  pointsEqual,
  type SchematicPointKey,
} from "./geometry"
import { type SchematicSegmentKey, segmentKey } from "./ids"
import {
  getPortConnectionGeometry,
  getWireSegments,
  splitSegmentAtPoints,
} from "./semantic-geometry"
import type { ConvertedPort, SemanticNet } from "./semantic-types"

interface PrunableSegment {
  endKey: SchematicPointKey
  key: SchematicSegmentKey
  startKey: SchematicPointKey
}

export function getEquivalentPortPrunedSegmentKeys({
  convertedPorts,
  net,
  wires,
}: {
  convertedPorts: ConvertedPort[]
  net: SemanticNet
  wires: AltiumSchWireRecord[]
}): Set<SchematicSegmentKey> {
  const hiddenPortPoints = convertedPorts
    .filter((port) => !port.isSchematicVisible)
    .map((port) => port.point)
  if (hiddenPortPoints.length === 0) return new Set()

  const wireSegments = getWireSegments(wires)
  const protectedPointKeys = new Set(
    convertedPorts
      .filter((port) => port.isSchematicVisible)
      .map((port) => pointKey(port.point)),
  )
  for (const record of net.records) {
    if (
      !(record instanceof AltiumSchLabelRecord) &&
      !(record instanceof AltiumSchNetLabelRecord) &&
      !(record instanceof AltiumSchPortRecord) &&
      !(record instanceof AltiumSchPowerPortRecord)
    ) {
      continue
    }
    const location =
      record instanceof AltiumSchPortRecord
        ? getPortConnectionGeometry(record, wireSegments)?.anchor
        : getLocation(record)
    if (location) protectedPointKeys.add(pointKey(location))
  }

  const segments = new Map<SchematicSegmentKey, PrunableSegment>()
  const segmentKeysByPoint = new Map<
    SchematicPointKey,
    Set<SchematicSegmentKey>
  >()

  for (const wire of wires) {
    const wirePoints = getSchematicRecordPoints(wire)
    for (let pointIndex = 1; pointIndex < wirePoints.length; pointIndex++) {
      const from = wirePoints[pointIndex - 1]
      const to = wirePoints[pointIndex]
      if (!from || !to) continue
      const segmentPoints = splitSegmentAtPoints(from, to, net.points)
      for (
        let splitIndex = 1;
        splitIndex < segmentPoints.length;
        splitIndex++
      ) {
        const segmentFrom = segmentPoints[splitIndex - 1]
        const segmentTo = segmentPoints[splitIndex]
        if (!segmentFrom || !segmentTo) continue
        const key = segmentKey(segmentFrom, segmentTo)
        segments.set(key, {
          endKey: pointKey(segmentTo),
          key,
          startKey: pointKey(segmentFrom),
        })
        addIncidentSegment({ point: segmentFrom, key, segmentKeysByPoint })
        addIncidentSegment({ point: segmentTo, key, segmentKeysByPoint })
      }
    }
  }

  const removedSegmentKeys = new Set<SchematicSegmentKey>()
  const pendingPointKeys = hiddenPortPoints.map((point) => pointKey(point))
  while (pendingPointKeys.length > 0) {
    const currentPointKey = pendingPointKeys.shift()
    if (!currentPointKey || protectedPointKeys.has(currentPointKey)) continue
    const activeSegmentKeys = [
      ...(segmentKeysByPoint.get(currentPointKey) ?? []),
    ].filter((key) => !removedSegmentKeys.has(key))
    if (activeSegmentKeys.length !== 1) continue
    const onlySegmentKey = activeSegmentKeys[0]
    if (!onlySegmentKey) continue
    const segment = segments.get(onlySegmentKey)
    if (!segment) continue
    removedSegmentKeys.add(segment.key)
    pendingPointKeys.push(
      segment.startKey === currentPointKey ? segment.endKey : segment.startKey,
    )
  }
  return removedSegmentKeys
}

export function createPortLeadEdges(
  convertedPort: ConvertedPort,
  electricalTerminal: AltiumPoint,
): SchematicTrace["edges"] {
  const portCenter = convertedPort.schematicPort.center
  const facingDirection =
    convertedPort.schematicPort.facing_direction ?? "right"
  const elbow =
    facingDirection === "left" || facingDirection === "right"
      ? { x: electricalTerminal.x, y: portCenter.y }
      : { x: portCenter.x, y: electricalTerminal.y }
  const points = [portCenter, elbow, electricalTerminal].filter(
    (point, index, allPoints) =>
      index === 0 || !pointsEqual(point, allPoints[index - 1]),
  )

  return points.slice(1).flatMap((to, index) => {
    const from = points[index]
    if (!from) return []
    return [
      {
        from,
        ...(index === 0
          ? {
              from_schematic_port_id:
                convertedPort.schematicPort.schematic_port_id,
            }
          : {}),
        to,
      },
    ]
  })
}

function addIncidentSegment({
  point,
  key,
  segmentKeysByPoint,
}: {
  point: AltiumPoint
  key: SchematicSegmentKey
  segmentKeysByPoint: Map<SchematicPointKey, Set<SchematicSegmentKey>>
}): void {
  const schematicPointKey = pointKey(point)
  const pointSegments = segmentKeysByPoint.get(schematicPointKey)
  if (pointSegments) pointSegments.add(key)
  else segmentKeysByPoint.set(schematicPointKey, new Set([key]))
}
