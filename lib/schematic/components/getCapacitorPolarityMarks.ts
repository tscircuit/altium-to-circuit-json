import {
  type AltiumPoint,
  type AltiumRecord,
  AltiumSchLabelRecord,
  getSchematicRecordPoints,
} from "altiumts"
import { getCorner, getLocation } from "../geometry"

export function getCapacitorPolarityMarks(
  records: AltiumRecord[],
): { point: AltiumPoint; graphic: boolean }[] {
  const marks: { point: AltiumPoint; graphic: boolean }[] = []
  const strokes: { start: AltiumPoint; end: AltiumPoint }[] = []
  for (const record of records) {
    if (record.getBoolean("ISHIDDEN")) continue
    const location = getLocation(record),
      corner = getCorner(record)
    if (
      record instanceof AltiumSchLabelRecord &&
      record.text?.trim() === "+" &&
      location
    )
      marks.push({ point: location, graphic: false })
    if (
      ["10", "14"].includes(record.recordKind ?? "") &&
      record.getBoolean("ISSOLID") &&
      location &&
      corner
    ) {
      const width = Math.abs(location.x - corner.x),
        height = Math.abs(location.y - corner.y)
      if (width > height * 3)
        strokes.push({
          start: { x: location.x, y: (location.y + corner.y) / 2 },
          end: { x: corner.x, y: (location.y + corner.y) / 2 },
        })
      if (height > width * 3)
        strokes.push({
          start: { x: (location.x + corner.x) / 2, y: location.y },
          end: { x: (location.x + corner.x) / 2, y: corner.y },
        })
    }
    const points =
      record.recordKind === "13" && location && corner
        ? [location, corner]
        : record.recordKind === "6"
          ? getSchematicRecordPoints(record)
          : []
    for (let index = 1; index < points.length; index++)
      strokes.push({ start: points[index - 1]!, end: points[index]! })
  }
  const horizontalStrokes: typeof strokes = []
  const verticalStrokes: typeof strokes = []
  const tolerance = 1e-5
  // A plus can be split at its crossing, across either polyline vertices or
  // separate records. Check the centers of complete strokes, not each piece.
  for (const [axis, mergedStrokes] of [
    ["x", horizontalStrokes],
    ["y", verticalStrokes],
  ] as const) {
    const crossAxis = axis === "x" ? "y" : "x"
    const lineGroups: (typeof strokes)[] = []
    for (const stroke of strokes) {
      if (
        Math.abs(stroke.start[crossAxis] - stroke.end[crossAxis]) >=
          tolerance ||
        stroke.start[axis] === stroke.end[axis]
      )
        continue
      const forward = stroke.start[axis] < stroke.end[axis]
      const normalized = {
        start: { ...(forward ? stroke.start : stroke.end) },
        end: { ...(forward ? stroke.end : stroke.start) },
      }
      const group = lineGroups.find(
        ([first]) =>
          first &&
          Math.abs(first.start[crossAxis] - normalized.start[crossAxis]) <
            tolerance,
      )
      if (group) group.push(normalized)
      else lineGroups.push([normalized])
    }
    for (const group of lineGroups) {
      group.sort((left, right) => left.start[axis] - right.start[axis])
      const mergedGroup: typeof strokes = []
      for (const stroke of group) {
        const previous = mergedGroup.at(-1)
        if (previous && stroke.start[axis] <= previous.end[axis] + tolerance) {
          if (stroke.end[axis] > previous.end[axis]) previous.end = stroke.end
        } else mergedGroup.push(stroke)
      }
      mergedStrokes.push(...mergedGroup)
    }
  }
  for (const horizontal of horizontalStrokes) {
    for (const vertical of verticalStrokes) {
      const width = Math.abs(horizontal.end.x - horizontal.start.x),
        height = Math.abs(vertical.end.y - vertical.start.y)
      const x = vertical.start.x,
        y = horizontal.start.y
      // A plus crosses near the center of both strokes, unlike a pin/plate T.
      if (
        width / height < 0.5 ||
        width / height > 2 ||
        Math.abs(x - (horizontal.start.x + horizontal.end.x) / 2) >
          width * 0.15 ||
        Math.abs(y - (vertical.start.y + vertical.end.y) / 2) > height * 0.15
      )
        continue
      marks.push({ point: { x, y }, graphic: true })
    }
  }
  return marks
}
