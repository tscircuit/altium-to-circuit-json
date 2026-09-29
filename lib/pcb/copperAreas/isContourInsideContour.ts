import type { AltiumPcbContour } from "altiumts"
import { getCrossProduct } from "./getCrossProduct"
import { isPointOnSegment } from "./isPointOnSegment"

export function isContourInsideContour({
  innerContour,
  outerContour,
}: {
  innerContour: AltiumPcbContour
  outerContour: AltiumPcbContour
}): boolean {
  const innerBounds = innerContour.bounds
  const outerBounds = outerContour.bounds
  if (
    !innerBounds ||
    !outerBounds ||
    innerBounds.minX <= outerBounds.minX ||
    innerBounds.maxX >= outerBounds.maxX ||
    innerBounds.minY <= outerBounds.minY ||
    innerBounds.maxY >= outerBounds.maxY
  ) {
    return false
  }

  const innerPoints = innerContour.isExplicitlyClosed
    ? innerContour.points.slice(0, -1)
    : innerContour.points
  const outerPoints = outerContour.isExplicitlyClosed
    ? outerContour.points.slice(0, -1)
    : outerContour.points
  if (innerPoints.length < 3 || outerPoints.length < 3) return false

  for (const point of innerPoints) {
    let isInside = false
    for (let index = 0; index < outerPoints.length; index++) {
      const start = outerPoints[index]
      const end = outerPoints[(index + 1) % outerPoints.length]
      if (!start || !end) continue
      if (isPointOnSegment({ start, end, point })) return false
      if (
        start.y > point.y !== end.y > point.y &&
        point.x <
          start.x +
            ((point.y - start.y) * (end.x - start.x)) / (end.y - start.y)
      ) {
        isInside = !isInside
      }
    }
    if (!isInside) return false
  }

  for (let innerIndex = 0; innerIndex < innerPoints.length; innerIndex++) {
    const innerStart = innerPoints[innerIndex]
    const innerEnd = innerPoints[(innerIndex + 1) % innerPoints.length]
    if (!innerStart || !innerEnd) continue
    for (let outerIndex = 0; outerIndex < outerPoints.length; outerIndex++) {
      const outerStart = outerPoints[outerIndex]
      const outerEnd = outerPoints[(outerIndex + 1) % outerPoints.length]
      if (!outerStart || !outerEnd) continue
      const innerStartSide = getCrossProduct({
        start: outerStart,
        end: outerEnd,
        point: innerStart,
      })
      const innerEndSide = getCrossProduct({
        start: outerStart,
        end: outerEnd,
        point: innerEnd,
      })
      const outerStartSide = getCrossProduct({
        start: innerStart,
        end: innerEnd,
        point: outerStart,
      })
      const outerEndSide = getCrossProduct({
        start: innerStart,
        end: innerEnd,
        point: outerEnd,
      })
      if (
        (innerStartSide * innerEndSide < 0 &&
          outerStartSide * outerEndSide < 0) ||
        isPointOnSegment({
          start: innerStart,
          end: innerEnd,
          point: outerStart,
        })
      ) {
        return false
      }
    }
  }
  return true
}
