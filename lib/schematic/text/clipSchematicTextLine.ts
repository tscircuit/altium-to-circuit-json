import { estimateSchematicTextWidth } from "./estimateSchematicTextWidth"

type HorizontalAnchor = "left" | "center" | "right"

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
}): string {
  if (
    estimateSchematicTextWidth({ text, fontSize, fontFamily }) <= maximumWidth
  ) {
    return text
  }

  const characters = [...text]
  let minimumLength = 0
  let maximumLength = characters.length
  while (minimumLength < maximumLength) {
    const candidateLength = Math.ceil((minimumLength + maximumLength) / 2)
    const candidateStart =
      horizontalAnchor === "right"
        ? characters.length - candidateLength
        : horizontalAnchor === "center"
          ? Math.floor((characters.length - candidateLength) / 2)
          : 0
    const candidate = characters
      .slice(candidateStart, candidateStart + candidateLength)
      .join("")
    if (
      estimateSchematicTextWidth({
        text: candidate,
        fontSize,
        fontFamily,
      }) <= maximumWidth
    ) {
      minimumLength = candidateLength
    } else {
      maximumLength = candidateLength - 1
    }
  }

  const start =
    horizontalAnchor === "right"
      ? characters.length - minimumLength
      : horizontalAnchor === "center"
        ? Math.floor((characters.length - minimumLength) / 2)
        : 0
  return characters.slice(start, start + minimumLength).join("")
}
