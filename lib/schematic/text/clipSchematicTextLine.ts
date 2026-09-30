import { estimateSchematicGlyphWidth } from "./estimateSchematicGlyphWidth"

type HorizontalAnchor = "left" | "center" | "right"

export interface ClippedSchematicTextLine {
  text: string
  horizontalOffset: number
}

export function clipSchematicTextLine({
  text,
  maximumWidth,
  fontSize,
  fontFamily,
  horizontalAnchor,
}: {
  text: string
  maximumWidth: number
  fontSize: number
  fontFamily: string
  horizontalAnchor: HorizontalAnchor
}): ClippedSchematicTextLine {
  const characters = [...text]
  const cumulativeWidths = [0]
  for (const character of characters) {
    cumulativeWidths.push(
      cumulativeWidths.at(-1)! +
        estimateSchematicGlyphWidth({
          character,
          fontSize,
          fontFamily,
        }),
    )
  }
  const fullWidth = cumulativeWidths.at(-1)!
  if (fullWidth <= maximumWidth) return { text, horizontalOffset: 0 }

  const visibleStart =
    horizontalAnchor === "right"
      ? fullWidth - maximumWidth
      : horizontalAnchor === "center"
        ? (fullWidth - maximumWidth) / 2
        : 0
  const visibleEnd = visibleStart + maximumWidth
  let startIndex = 0
  while (
    startIndex < characters.length &&
    cumulativeWidths[startIndex]! < visibleStart
  ) {
    startIndex += 1
  }
  let endIndex = startIndex
  while (
    endIndex < characters.length &&
    cumulativeWidths[endIndex + 1]! <= visibleEnd
  ) {
    endIndex += 1
  }

  const clippedWidth =
    cumulativeWidths[endIndex]! - cumulativeWidths[startIndex]!
  const horizontalOffset =
    horizontalAnchor === "center"
      ? -fullWidth / 2 + cumulativeWidths[startIndex]! + clippedWidth / 2
      : 0

  return {
    text: characters.slice(startIndex, endIndex).join(""),
    horizontalOffset,
  }
}
