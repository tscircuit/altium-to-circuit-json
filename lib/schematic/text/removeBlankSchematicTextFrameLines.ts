export function removeBlankSchematicTextFrameLines(lines: string[]): string[] {
  return lines.filter((line) => line.trim().length > 0)
}
