import {
  type AltiumPoint,
  type AltiumRecord,
  getSchematicRecordPoints,
} from "altiumts"
import type { SchematicNetLabel, SchematicPort } from "circuit-json"

import {
  type CardinalDirection,
  getLocation,
  pointKey,
  type SchematicPointKey,
} from "./geometry"
import type { SchematicSegment } from "./semantic-types"

export const DIRECTION_BY_ORIENTATION: readonly CardinalDirection[] = [
  "right",
  "up",
  "left",
  "down",
]

export const VECTOR_BY_DIRECTION: Readonly<
  Record<CardinalDirection, AltiumPoint>
> = {
  down: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
}

export function isPointOnSegment(
  point: AltiumPoint,
  start: AltiumPoint,
  end: AltiumPoint,
): boolean {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const cross = (point.x - start.x) * dy - (point.y - start.y) * dx
  const tolerance = 0.000001 * Math.max(Math.abs(dx), Math.abs(dy), 1)
  if (Math.abs(cross) > tolerance) return false
  const dot = (point.x - start.x) * dx + (point.y - start.y) * dy
  if (dot < -tolerance) return false
  const lengthSquared = dx * dx + dy * dy
  return dot <= lengthSquared + tolerance
}

export function splitSegmentAtPoints(
  start: AltiumPoint,
  end: AltiumPoint,
  candidates: AltiumPoint[],
): AltiumPoint[] {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return [start]

  const pointsByKey = new Map<SchematicPointKey, AltiumPoint>([
    [pointKey(start), start],
    [pointKey(end), end],
  ])
  for (const candidate of candidates) {
    if (isPointOnSegment(candidate, start, end)) {
      pointsByKey.set(pointKey(candidate), candidate)
    }
  }
  return [...pointsByKey.values()].sort((left, right) => {
    const leftDistance = (left.x - start.x) * dx + (left.y - start.y) * dy
    const rightDistance = (right.x - start.x) * dx + (right.y - start.y) * dy
    return leftDistance - rightDistance
  })
}

export function getWireSegments(wires: AltiumRecord[]): SchematicSegment[] {
  return wires.flatMap((wire) => {
    const points = getSchematicRecordPoints(wire)
    const segments: SchematicSegment[] = []
    for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
      const start = points[pointIndex - 1]
      const end = points[pointIndex]
      if (start && end) segments.push({ end, start })
    }
    return segments
  })
}

export function getPortConnectionGeometry(
  record: AltiumRecord,
  wireSegments: SchematicSegment[],
): { anchor: AltiumPoint; bodyDirection: CardinalDirection } | undefined {
  const origin = getLocation(record)
  if (!origin) return undefined

  const originToExtremity = getRecordDirection(record)
  const directionVector = VECTOR_BY_DIRECTION[originToExtremity]
  const width = Math.max(record.getNumber("WIDTH") ?? 16, 0)
  const extremity = {
    x: origin.x + directionVector.x * width,
    y: origin.y + directionVector.y * width,
  }
  const originConnected = doesPointTouchWireEndpoint(origin, wireSegments)
  const extremityConnected = doesPointTouchWireEndpoint(extremity, wireSegments)
  const connectedEnd = record.getNumber("CONNECTEDEND")
  const connectsAtExtremity =
    connectedEnd === 2 ||
    (connectedEnd !== 1 &&
      connectedEnd !== 3 &&
      !originConnected &&
      extremityConnected)

  return connectsAtExtremity
    ? {
        anchor: extremity,
        bodyDirection: getOppositeDirection(originToExtremity),
      }
    : { anchor: origin, bodyDirection: originToExtremity }
}

function doesPointTouchWireEndpoint(
  point: AltiumPoint,
  wireSegments: SchematicSegment[],
): boolean {
  return wireSegments.some((segment) =>
    isPointNearSegmentEndpoint(point, segment.start, segment.end),
  )
}

function isPointNearSegmentEndpoint(
  point: AltiumPoint,
  start: AltiumPoint,
  end: AltiumPoint,
): boolean {
  return isPointNear(point, start) || isPointNear(point, end)
}

function isPointNear(point: AltiumPoint, other: AltiumPoint): boolean {
  const tolerance = 1.1
  return (point.x - other.x) ** 2 + (point.y - other.y) ** 2 <= tolerance ** 2
}

function getOppositeDirection(direction: CardinalDirection): CardinalDirection {
  if (direction === "up") return "down"
  if (direction === "down") return "up"
  return direction === "left" ? "right" : "left"
}

export function getRecordDirection(record: AltiumRecord): CardinalDirection {
  const orientation =
    ((Math.round(record.getNumber("ORIENTATION") ?? 0) % 4) + 4) % 4
  return DIRECTION_BY_ORIENTATION[orientation] ?? "right"
}

export function directionToSide(
  direction: CardinalDirection,
): NonNullable<SchematicPort["side_of_component"]> {
  if (direction === "up") return "top"
  if (direction === "down") return "bottom"
  return direction
}

export function directionToOppositeSide(
  direction: CardinalDirection,
): SchematicNetLabel["anchor_side"] {
  if (direction === "up") return "bottom"
  if (direction === "down") return "top"
  return direction === "left" ? "right" : "left"
}
