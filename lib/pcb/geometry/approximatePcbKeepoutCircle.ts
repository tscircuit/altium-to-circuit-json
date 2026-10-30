import { type AltiumPoint, approximateAltiumArc } from "altiumts"

export function approximatePcbKeepoutCircle({
  center,
  radiusMils,
  startAngleDegrees,
  widthMils,
}: {
  center: AltiumPoint
  radiusMils: number
  startAngleDegrees: number
  widthMils: number
}): AltiumPoint[] {
  const innerRadiusMils = radiusMils - widthMils / 2
  // Keep chord error below half the hole radius so a wide stroke stays annular.
  const maxStepDegrees =
    innerRadiusMils > 0
      ? (Math.acos(1 - innerRadiusMils / (2 * radiusMils)) * 360) / Math.PI
      : 360
  // altiumts samples each arc into at least eight segments.
  const arcCount = Math.max(1, Math.ceil(360 / maxStepDegrees / 8))
  return Array.from({ length: arcCount }, (_, index) =>
    approximateAltiumArc({
      center,
      radius: radiusMils,
      startAngleDegrees: startAngleDegrees + (index * 360) / arcCount,
      // Equal endpoints explicitly request a full turn, including fractional starts.
      endAngleDegrees:
        arcCount === 1
          ? startAngleDegrees
          : startAngleDegrees + ((index + 1) * 360) / arcCount,
    }),
  ).flatMap((points, index) => (index === 0 ? points : points.slice(1)))
}
