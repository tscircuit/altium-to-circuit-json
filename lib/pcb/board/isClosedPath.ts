import type { AltiumPoint } from "altiumts"
import { pointsApproximatelyEqual } from "./pointsApproximatelyEqual"

export function isClosedPath(points: AltiumPoint[]): boolean {
  const first = points[0]
  const last = points.at(-1)
  return Boolean(first && last && pointsApproximatelyEqual(first, last))
}
