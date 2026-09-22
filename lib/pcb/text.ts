import type { NinePointAnchor, PcbFabricationNoteText } from "circuit-json"

const ALTIUM_TEXT_ANCHORS: readonly NinePointAnchor[] = [
  "top_left",
  "center_left",
  "bottom_left",
  "top_center",
  "center",
  "bottom_center",
  "top_right",
  "center_right",
  "bottom_right",
]

export function mapTextAnchor(
  justification: string | undefined,
): NinePointAnchor {
  const numericAnchor = ALTIUM_TEXT_ANCHORS[Number(justification) - 1]
  if (numericAnchor) return numericAnchor

  const normalizedJustification = justification
    ?.replace(/[\s_-]+/gu, "")
    .toUpperCase()
  if (normalizedJustification?.includes("CENTER")) return "bottom_center"
  if (normalizedJustification?.includes("RIGHT")) return "bottom_right"
  if (normalizedJustification?.includes("LEFT")) return "bottom_left"
  return "center"
}

export function mapFabricationTextAnchor(
  justification: string | undefined,
): PcbFabricationNoteText["anchor_alignment"] {
  const anchor = mapTextAnchor(justification)
  return anchor === "top_left" ||
    anchor === "top_right" ||
    anchor === "bottom_left" ||
    anchor === "bottom_right"
    ? anchor
    : "center"
}
