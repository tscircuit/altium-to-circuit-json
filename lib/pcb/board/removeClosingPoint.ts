import type { AltiumPoint } from "altiumts"
import { pointsApproximatelyEqual } from "./pointsApproximatelyEqual"

export function removeClosingPoint(points: AltiumPoint[]): AltiumPoint[] {
  const first = points[0]
  const last = points.at(-1)
  return first && last && pointsApproximatelyEqual(first, last)
    ? points.slice(0, -1)
    : points
}
