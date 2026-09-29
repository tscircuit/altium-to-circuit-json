import type { AltiumPcbContour } from "altiumts"

type ContourPoint = AltiumPcbContour["points"][number]

export type OrientedPoint = {
  start: ContourPoint
  end: ContourPoint
  point: ContourPoint
}

export function getCrossProduct({ start, end, point }: OrientedPoint): number {
  return (
    (end.x - start.x) * (point.y - start.y) -
    (end.y - start.y) * (point.x - start.x)
  )
}
