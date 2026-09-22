import type { AltiumPadRecord, getAltiumPcbPadGeometry } from "altiumts"

export function getRotatedHoleOffset(
  record: AltiumPadRecord,
  geometry: ReturnType<typeof getAltiumPcbPadGeometry>,
): { x: number; y: number } {
  const ccwPadRotationRadians = (record.rotation * Math.PI) / 180
  return {
    x:
      geometry.holeOffsetXMils * Math.cos(ccwPadRotationRadians) -
      geometry.holeOffsetYMils * Math.sin(ccwPadRotationRadians),
    y:
      geometry.holeOffsetXMils * Math.sin(ccwPadRotationRadians) +
      geometry.holeOffsetYMils * Math.cos(ccwPadRotationRadians),
  }
}
