import type { AltiumPoint } from "altiumts"
import { pointKey, type SchematicPointKey } from "../geometry"
import type { PointDisjointSet } from "./PointDisjointSet"

export function addGraphPoint(
  disjointSet: PointDisjointSet,
  pointValues: Map<SchematicPointKey, AltiumPoint>,
  point: AltiumPoint,
): void {
  const key = pointKey(point)
  disjointSet.add(key)
  pointValues.set(key, point)
}
