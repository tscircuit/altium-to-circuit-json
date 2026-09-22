import type { AltiumPoint } from "altiumts"
import type { SchematicLine } from "circuit-json"
import { SCHEMATIC_SHEET_ID } from "../document"

export function createLine({
  index,
  start,
  end,
  color,
  strokeWidth,
  scale,
  suffix = "line",
}: {
  index: number
  start: AltiumPoint
  end: AltiumPoint
  color: string
  strokeWidth: number
  scale: number
  suffix?: string
}): SchematicLine {
  return {
    type: "schematic_line",
    schematic_line_id: `schematic_line_altium_${index}_${suffix}`,
    schematic_sheet_id: SCHEMATIC_SHEET_ID,
    x1: start.x * scale,
    y1: start.y * scale,
    x2: end.x * scale,
    y2: end.y * scale,
    stroke_width: strokeWidth,
    color,
    is_dashed: false,
  }
}
