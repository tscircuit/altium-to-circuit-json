import {
  type AltiumPoint,
  type AltiumRecord,
  getSchematicConnectedEnd,
} from "altiumts"
import {
  type CardinalDirection,
  getCoordinateOrFallback,
  getLocation,
} from "../geometry"
import type { SchematicSegment } from "../model"
import { VECTOR_BY_DIRECTION } from "./constants"
import { getOppositeDirection } from "./getOppositeDirection"
import { getRecordDirection } from "./getRecordDirection"

export function getPortConnectionGeometry(
  record: AltiumRecord,
  connectionSegments: SchematicSegment[],
): { anchor: AltiumPoint; bodyDirection: CardinalDirection } | undefined {
  const origin = getLocation(record)
  if (!origin) return undefined

  const originToExtremity = getRecordDirection(record)
  const directionVector = VECTOR_BY_DIRECTION[originToExtremity]
  const width = Math.max(
    getCoordinateOrFallback({ record, key: "WIDTH", fallback: 16 }),
    0,
  )
  const extremity = {
    x: origin.x + directionVector.x * width,
    y: origin.y + directionVector.y * width,
  }
  const connectedEnd = getSchematicConnectedEnd({
    end: extremity,
    segments: connectionSegments,
    start: origin,
  })
  const savedConnectedEnd = record.getNumber("CONNECTEDEND")
  const connectsAtExtremity =
    connectedEnd === "end" ||
    (connectedEnd === undefined && savedConnectedEnd === 2)

  return connectsAtExtremity
    ? {
        anchor: extremity,
        bodyDirection: getOppositeDirection(originToExtremity),
      }
    : { anchor: origin, bodyDirection: originToExtremity }
}
