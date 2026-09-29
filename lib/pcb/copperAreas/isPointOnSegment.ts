import { getCrossProduct, type OrientedPoint } from "./getCrossProduct"

export function isPointOnSegment({
  start,
  end,
  point,
}: OrientedPoint): boolean {
  // Allow rounding across the coordinate differences and cross product.
  const toleranceMils =
    8 *
    Number.EPSILON *
    Math.max(
      1,
      Math.abs(start.x),
      Math.abs(start.y),
      Math.abs(end.x),
      Math.abs(end.y),
      Math.abs(point.x),
      Math.abs(point.y),
    )
  const segmentSpanMils = Math.max(
    Math.abs(end.x - start.x),
    Math.abs(end.y - start.y),
  )
  return (
    Math.abs(getCrossProduct({ start, end, point })) <=
      toleranceMils * segmentSpanMils &&
    point.x >= Math.min(start.x, end.x) - toleranceMils &&
    point.x <= Math.max(start.x, end.x) + toleranceMils &&
    point.y >= Math.min(start.y, end.y) - toleranceMils &&
    point.y <= Math.max(start.y, end.y) + toleranceMils
  )
}
