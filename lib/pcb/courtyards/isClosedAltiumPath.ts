import type { AltiumPoint } from "altiumts"
import { altiumPointsApproximatelyEqual } from "./altiumPointsApproximatelyEqual"

export function isClosedAltiumPath(points: AltiumPoint[]): boolean {
  const first = points[0]
  const last = points.at(-1)
  return Boolean(first && last && altiumPointsApproximatelyEqual(first, last))
}
