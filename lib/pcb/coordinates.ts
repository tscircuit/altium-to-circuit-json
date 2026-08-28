import type { AltiumPoint } from "altiumts"

const MILS_TO_MILLIMETERS = 0.0254

export function milsToMillimeters(value: number): number {
  return value * MILS_TO_MILLIMETERS
}

export function toMillimeterPoint(point: AltiumPoint): {
  x: number
  y: number
} {
  return { x: milsToMillimeters(point.x), y: milsToMillimeters(point.y) }
}

export function approximateAltiumArc({
  center,
  radiusMils,
  startAngle,
  endAngle,
}: {
  center: AltiumPoint
  radiusMils: number
  startAngle: number
  endAngle: number
}): AltiumPoint[] {
  const sweep = endAngle - startAngle || 360
  const segmentCount = Math.max(8, Math.ceil(Math.abs(sweep) / 7.5))
  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    const angle = startAngle + (sweep * index) / segmentCount
    const radians = (angle * Math.PI) / 180
    return {
      x: center.x + Math.cos(radians) * radiusMils,
      y: center.y + Math.sin(radians) * radiusMils,
    }
  })
}
