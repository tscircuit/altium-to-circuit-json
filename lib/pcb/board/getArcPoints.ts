import type { AltiumArcRecord, AltiumPoint } from "altiumts"

export function getArcPoints(record: AltiumArcRecord): AltiumPoint[] {
  const center = record.center
  const radius = record.radiusMils
  if (!center || !radius) return []
  const rawSweep = record.endAngle - record.startAngle
  const sweep =
    rawSweep === 0 || Math.abs(rawSweep) >= 360
      ? 360
      : ((rawSweep % 360) + 360) % 360
  const segmentCount = Math.max(8, Math.ceil(sweep / 7.5))

  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    const angle = record.startAngle + (sweep * index) / segmentCount
    const radians = (angle * Math.PI) / 180
    return {
      x: center.x + Math.cos(radians) * radius,
      y: center.y + Math.sin(radians) * radius,
    }
  })
}
