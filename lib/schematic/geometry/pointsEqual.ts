import { type AltiumPoint, altiumPointsEqual } from "altiumts"

export function pointsEqual(
  left: AltiumPoint,
  right: AltiumPoint | undefined,
): boolean {
  return right !== undefined && altiumPointsEqual(left, right)
}
