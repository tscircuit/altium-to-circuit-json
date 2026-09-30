import type { AltiumRecord } from "altiumts"
import { clipSchematicTextLine } from "./clipSchematicTextLine"
import { wrapSchematicText } from "./wrapSchematicText"

export function getTextFrameLines({
  record,
  text,
  availableWidth,
  availableHeight,
  fontSize,
  fontFamily,
  horizontalAnchor,
}: {
  record: AltiumRecord
  text: string
  availableWidth: number
  availableHeight: number
  fontSize: number
  fontFamily: string
  horizontalAnchor: "left" | "center" | "right"
}): string[] {
  const lines =
    record.getBoolean("WORDWRAP") === false
      ? text.split("\n")
      : wrapSchematicText({
          text,
          maximumWidth: availableWidth,
          fontSize,
          fontFamily,
        })
  if (record.getBoolean("CLIPTORECT") === false) return lines

  return lines
    .slice(0, Math.max(Math.ceil(availableHeight / fontSize), 1))
    .map((line) =>
      clipSchematicTextLine({
        text: line,
        maximumWidth: availableWidth,
        fontSize,
        fontFamily,
        horizontalAnchor,
      }),
    )
}
