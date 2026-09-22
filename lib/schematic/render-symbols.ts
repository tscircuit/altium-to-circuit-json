import type { AltiumRecord } from "altiumts"
import type { AnyCircuitElement, SchematicPath } from "circuit-json"
import { getLocation, scalePoint } from "./coordinates"
import {
  altiumColorToCss,
  createDirectText,
  createLine,
  getFontSize,
} from "./render-text"
import { SCHEMATIC_SHEET_ID, type SchematicContext } from "./sheet-layout"

export interface SymbolRenderOptions {
  includeHidden?: boolean
  includeText?: boolean
}

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
  const width = Math.max(Number(record.getCaseInsensitive("WIDTH") ?? 16), 10)
  const height = Math.max(Number(record.getCaseInsensitive("HEIGHT") ?? 10), 4)
  const halfHeight = height / 2
  const pointDepth = Math.min(width * 0.22, height)
  const ioType = Number(record.getCaseInsensitive("IOTYPE") ?? 0)
  const points =
    ioType === 1
      ? [
          { x: location.x, y: location.y },
          { x: location.x + pointDepth, y: location.y + halfHeight },
          { x: location.x + width, y: location.y + halfHeight },
          { x: location.x + width, y: location.y - halfHeight },
          { x: location.x + pointDepth, y: location.y - halfHeight },
        ]
      : ioType === 2
        ? [
            { x: location.x, y: location.y + halfHeight },
            {
              x: location.x + width - pointDepth,
              y: location.y + halfHeight,
            },
            { x: location.x + width, y: location.y },
            {
              x: location.x + width - pointDepth,
              y: location.y - halfHeight,
            },
            { x: location.x, y: location.y - halfHeight },
          ]
        : [
            { x: location.x, y: location.y + halfHeight },
            { x: location.x + width, y: location.y + halfHeight },
            { x: location.x + width, y: location.y - halfHeight },
            { x: location.x, y: location.y - halfHeight },
          ]
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
        location: { x: location.x + width / 2, y: location.y },
        fontSize: getFontSize(record, context),
        color: altiumColorToCss(record.getCaseInsensitive("TEXTCOLOR"), color),
        scale: context.scale,
        rotation: 0,
        anchor: "center",
      }),
    )
  }
  return elements
}

export function renderPin({
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
  const pinConglomerate = record.getNumber("PINCONGLOMERATE")
  const hidden =
    record.getBoolean("ISHIDDEN") ||
    (pinConglomerate !== undefined && (pinConglomerate & 0x04) !== 0)
  if (hidden && !options.includeHidden) return []
  const orientation =
    (pinConglomerate ?? Number(record.getCaseInsensitive("ORIENTATION") ?? 0)) &
    3
  const direction = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ][orientation] ?? { x: 1, y: 0 }
  const length = Math.max(
    Number(record.getCaseInsensitive("PINLENGTH") ?? 10),
    1,
  )
  const end = {
    x: location.x + direction.x * length,
    y: location.y + direction.y * length,
  }
  const elements: AnyCircuitElement[] = [
    createLine({
      index,
      start: location,
      end,
      color,
      strokeWidth: 0.1,
      scale: context.scale,
      suffix: "pin",
    }),
  ]
  if (options.includeText === false) return elements
  const name = record.getDecoded("NAME") ?? ""
  const designator = record.getDecoded("DESIGNATOR") ?? ""
  const showName =
    pinConglomerate === undefined || (pinConglomerate & 0x08) !== 0
  const showDesignator =
    pinConglomerate === undefined || (pinConglomerate & 0x10) !== 0
  const rotation = orientation === 1 || orientation === 3 ? 90 : 0
  const directionMatchesText = orientation === 0 || orientation === 1
  const textOffset = 2
  if (showName && name) {
    elements.push(
      createDirectText({
        id: `schematic_pin_name_altium_${index}`,
        text: name,
        location: {
          x: location.x - direction.x * textOffset,
          y: location.y - direction.y * textOffset,
        },
        fontSize: 6,
        color,
        scale: context.scale,
        rotation,
        anchor: directionMatchesText ? "right" : "left",
      }),
    )
  }
  if (showDesignator && designator) {
    elements.push(
      createDirectText({
        id: `schematic_pin_designator_altium_${index}`,
        text: designator,
        location: {
          x: location.x + direction.x * textOffset,
          y: location.y + direction.y * textOffset,
        },
        fontSize: 6,
        color,
        scale: context.scale,
        rotation,
        anchor: directionMatchesText ? "left" : "right",
      }),
    )
  }
  return elements
}
