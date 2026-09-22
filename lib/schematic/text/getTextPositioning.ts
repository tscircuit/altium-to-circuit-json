import type { AltiumRecord } from "altiumts"
import type { SchematicText } from "circuit-json"

export function getTextPositioning(record: AltiumRecord): {
  anchor: SchematicText["anchor"]
  rotation: number
} {
  const justification = Math.min(
    Math.max(Math.round(record.getNumber("JUSTIFICATION") ?? 0), 0),
    8,
  )
  const orientation =
    ((Math.round(record.getNumber("ORIENTATION") ?? 0) % 4) + 4) % 4
  let column = justification % 3
  const row = Math.floor(justification / 3)
  if (orientation === 2 || orientation === 3) column = 2 - column
  const horizontal = ["left", "center", "right"][column] ?? "left"
  const vertical = ["bottom", "center", "top"][row] ?? "bottom"
  const anchor =
    horizontal === "center" && vertical === "center"
      ? "center"
      : (`${vertical}_${horizontal}` as SchematicText["anchor"])
  return { anchor, rotation: orientation === 1 || orientation === 3 ? 90 : 0 }
}
