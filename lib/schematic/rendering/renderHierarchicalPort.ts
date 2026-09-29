import { type AltiumRecord, getSchematicPortDirection } from "altiumts"
import type { AnyCircuitElement, SchematicPath } from "circuit-json"
import { SCHEMATIC_SHEET_ID, type SchematicContext } from "../document"
import { getCoordinateOrFallback, getLocation, scalePoint } from "../geometry"
import { altiumColorToCss, createDirectText, getFontSize } from "../text"
import { getHierarchicalPortGeometry } from "./getHierarchicalPortGeometry"
import type { SymbolRenderOptions } from "./types"

export function renderHierarchicalPort({
  record,
  index,
  context,
  options,
  color,
}: {
  record: AltiumRecord
  index: number
  context: SchematicContext
  options: SymbolRenderOptions
  color: string
}): AnyCircuitElement[] {
  const location = getLocation(record)
  if (!location) return []
  const width = Math.max(
    getCoordinateOrFallback({ record, key: "WIDTH", fallback: 16 }),
    10,
  )
  const height = Math.max(
    getCoordinateOrFallback({ record, key: "HEIGHT", fallback: 10 }),
    4,
  )
  const direction = getSchematicPortDirection({
    record,
    segments: context.schematicConnectionSegments ?? [],
    width,
  })
  const { points, textLocation } = getHierarchicalPortGeometry({
    ...direction,
    height,
    location,
    width,
  })
  const elements: AnyCircuitElement[] = [
    {
      type: "schematic_path",
      schematic_path_id: `schematic_port_altium_${index}`,
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      points: points.map((point) => scalePoint(point, context.scale)),
      stroke_width: 0.1,
      stroke_color: color,
      fill_color: altiumColorToCss(
        record.getCaseInsensitive("AREACOLOR"),
        "#ffffff",
      ),
      is_filled: true,
      is_dashed: false,
    } satisfies SchematicPath,
  ]
  const name = record.getDecoded("NAME")
  if (name && options.includeText !== false) {
    elements.push(
      createDirectText({
        id: `schematic_port_text_altium_${index}`,
        text: name,
        location: textLocation,
        fontSize: getFontSize(record, context),
        color: altiumColorToCss(record.getCaseInsensitive("TEXTCOLOR"), color),
        scale: context.scale,
        ccwRotationDegrees: direction.vertical ? 90 : 0,
        anchor: "center",
      }),
    )
  }
  return elements
}
