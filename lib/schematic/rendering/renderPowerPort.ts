import type { AltiumRecord } from "altiumts"
import type {
  AnyCircuitElement,
  SchematicPath,
  SchematicText,
} from "circuit-json"
import { SCHEMATIC_SHEET_ID, type SchematicContext } from "../document"
import { getLocation, scalePoint } from "../recordGeometry"
import { createDirectText, getFontSize } from "../text"
import { createPowerPortLine } from "./createPowerPortLine"
import { getPowerPortPoint } from "./getPowerPortPoint"
import type { SymbolRenderOptions } from "./types"

export function renderPowerPort({
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
  const orientation =
    ((Math.round(record.getNumber("ORIENTATION") ?? 0) % 4) + 4) % 4
  const direction = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ][orientation] ?? { x: 1, y: 0 }
  const perpendicular = { x: -direction.y, y: direction.x }
  const powerPortGeometry = { direction, location, perpendicular }
  const lineOptions = { color, index, scale: context.scale }
  const style = Math.round(Number(record.getCaseInsensitive("STYLE") ?? 2))
  const elements: AnyCircuitElement[] = []
  let labelDistance: number
  if (style === 2) {
    elements.push(
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 8 }),
        start: location,
        suffix: "power_port_stem",
      }),
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 8, across: 5 }),
        start: getPowerPortPoint({
          ...powerPortGeometry,
          along: 8,
          across: -5,
        }),
        suffix: "power_port_bar",
      }),
    )
    labelDistance = 12
  } else if (style === 5) {
    elements.push(
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 4 }),
        start: location,
        suffix: "power_port_stem",
      }),
      {
        type: "schematic_path",
        schematic_path_id: `schematic_power_port_altium_${index}`,
        schematic_sheet_id: SCHEMATIC_SHEET_ID,
        points: [
          getPowerPortPoint({ ...powerPortGeometry, along: 4, across: -7 }),
          getPowerPortPoint({ ...powerPortGeometry, along: 4, across: 7 }),
          getPowerPortPoint({ ...powerPortGeometry, along: 12 }),
        ].map((point) => scalePoint(point, context.scale)),
        stroke_width: 0.1,
        stroke_color: color,
        is_filled: false,
        is_dashed: false,
      } satisfies SchematicPath,
    )
    labelDistance = 16
  } else if (style === 4) {
    elements.push(
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 4 }),
        start: location,
        suffix: "power_port_stem",
      }),
      ...[
        { along: 4, halfWidth: 7 },
        { along: 8, halfWidth: 4.5 },
        { along: 12, halfWidth: 2 },
      ].map(({ along, halfWidth }, lineIndex) =>
        createPowerPortLine({
          ...lineOptions,
          end: getPowerPortPoint({
            ...powerPortGeometry,
            along,
            across: halfWidth,
          }),
          start: getPowerPortPoint({
            ...powerPortGeometry,
            along,
            across: -halfWidth,
          }),
          suffix: `power_port_ground_${lineIndex}`,
        }),
      ),
    )
    labelDistance = 16
  } else if (style === 6) {
    elements.push(
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 4 }),
        start: location,
        suffix: "power_port_stem",
      }),
      createPowerPortLine({
        ...lineOptions,
        end: getPowerPortPoint({ ...powerPortGeometry, along: 4, across: 7 }),
        start: getPowerPortPoint({
          ...powerPortGeometry,
          along: 4,
          across: -7,
        }),
        suffix: "power_port_chassis_bar",
      }),
      ...[
        { from: -7, to: -9 },
        { from: 0, to: -2 },
        { from: 7, to: 5 },
      ].map(({ from, to }, lineIndex) =>
        createPowerPortLine({
          ...lineOptions,
          end: getPowerPortPoint({
            ...powerPortGeometry,
            along: 9,
            across: to,
          }),
          start: getPowerPortPoint({
            ...powerPortGeometry,
            along: 4,
            across: from,
          }),
          suffix: `power_port_chassis_${lineIndex}`,
        }),
      ),
    )
    labelDistance = 14
  } else {
    elements.push({
      type: "schematic_path",
      schematic_path_id: `schematic_power_port_altium_${index}`,
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      points: [
        location,
        getPowerPortPoint({ ...powerPortGeometry, along: 10, across: -5 }),
        getPowerPortPoint({ ...powerPortGeometry, along: 10, across: 5 }),
      ].map((point) => scalePoint(point, context.scale)),
      stroke_width: 0.1,
      stroke_color: color,
      fill_color: color,
      is_filled: true,
      is_dashed: false,
    } satisfies SchematicPath)
    labelDistance = 14
  }
  const text = record.getDecoded("TEXT") ?? record.getDecoded("NAME")
  if (
    text &&
    options.includeText !== false &&
    record.getBoolean("SHOWNETNAME") !== false
  ) {
    const vertical = direction.y !== 0
    const anchor: SchematicText["anchor"] = vertical
      ? direction.y > 0
        ? "bottom_center"
        : "top_center"
      : direction.x > 0
        ? "center_left"
        : "center_right"
    elements.push(
      createDirectText({
        id: `schematic_power_port_text_altium_${index}`,
        text,
        location: getPowerPortPoint({
          ...powerPortGeometry,
          along: labelDistance,
        }),
        fontSize: getFontSize(record, context),
        color,
        scale: context.scale,
        rotation: 0,
        anchor,
      }),
    )
  }
  return elements
}
