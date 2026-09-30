import type { SchematicText } from "circuit-json"

export function getTextFrameAnchor(
  alignment: number,
): Extract<SchematicText["anchor"], "left" | "center" | "right"> {
  return alignment === 2 ? "center" : alignment === 3 ? "right" : "left"
}
