import type { AltiumRecord } from "altiumts"
import {
  clipSchematicTextLine,
  type ClippedSchematicTextLine,
} from "./clipSchematicTextLine"
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
}): ClippedSchematicTextLine[] {
  const lines =
    record.getBoolean("WORDWRAP") === false
      ? text.split("\n")
      : wrapSchematicText({
          text,
          maximumWidth: availableWidth,
          fontSize,
          fontFamily,
        })
  if (record.getBoolean("CLIPTORECT") === false) {
    return lines.map((line) => ({ text: line, horizontalOffset: 0 }))
  }

  return lines
    .slice(0, Math.max(Math.floor(availableHeight / fontSize), 0))
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
