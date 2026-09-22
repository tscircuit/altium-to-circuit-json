import type { AltiumPoint } from "altiumts"

export function scalePoint(point: AltiumPoint, scale: number): AltiumPoint {
  return { x: point.x * scale, y: point.y * scale }
}
