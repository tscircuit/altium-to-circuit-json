import type { AltiumDimensionRecord } from "altiumts"

export function getDimensionAxis(record: AltiumDimensionRecord): {
  x: number
  y: number
} {
  const angleDegrees = record.getNumber("ANGLE")
  if (angleDegrees !== undefined && Number.isFinite(angleDegrees)) {
    const angleRadians = (angleDegrees * Math.PI) / 180
    return { x: Math.cos(angleRadians), y: Math.sin(angleRadians) }
  }

  const start = record.start
  const end = record.end
  if (!start || !end) return { x: 1, y: 0 }
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const distance = Math.hypot(deltaX, deltaY)
  if (distance === 0) return { x: 1, y: 0 }
  return { x: deltaX / distance, y: deltaY / distance }
}
