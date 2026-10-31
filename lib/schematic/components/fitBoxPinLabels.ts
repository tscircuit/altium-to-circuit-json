import { AltiumSchPinRecord } from "altiumts"
import type { SchematicComponent } from "circuit-json"
import type { ConvertedPort } from "../model"
import { estimatePinLabelWidth } from "./estimatePinLabelWidth"
import { getAltiumPinNameFont } from "./getAltiumPinNameFont"
import type { ComponentConversionContext } from "./types"

// Circuit JSON dimensions are schematic millimeters; circuit-to-svg places
// box pin labels 0.1 mm inside each body edge.
const PIN_LABEL_INSET_MM = 0.1

export function fitBoxPinLabels(
  {
    componentPorts,
    size,
  }: {
    componentPorts: ConvertedPort[]
    size: SchematicComponent["size"]
  },
  context: ComponentConversionContext,
): void {
  const labels = componentPorts.flatMap(({ record, schematicPort }) => {
    let label = schematicPort.display_pin_label
    const fontSize = schematicPort.display_pin_label_font_size
    if (!label || fontSize === undefined) return []
    const fontFamily =
      record instanceof AltiumSchPinRecord
        ? getAltiumPinNameFont({
            pin: record,
            sheetRecord: context.sheetRecord,
          }).fontFamily
        : undefined
    const textParts = schematicPort.display_pin_label_text_parts
    if (textParts?.length) {
      label = textParts.map((part) => part.text).join("")
    } else if (label.startsWith("N_")) {
      label = label.slice(2)
    }
    return [
      {
        schematicPort,
        label,
        fontSize,
        fontSizeRatio: 1,
        isSubstitutedFont: Boolean(
          fontFamily &&
            !/^(?:arial|helvetica|sans-serif)$/iu.test(fontFamily.trim()),
        ),
      },
    ]
  })
  if (!labels.some(({ isSubstitutedFont }) => isSubstitutedFont)) return
  for (const currentLabel of labels) {
    const { schematicPort, label, fontSize, isSubstitutedFont } = currentLabel
    const side = schematicPort.side_of_component
    if (side !== "left" && side !== "bottom") continue
    const isHorizontal = side === "left"
    const oppositeSide = isHorizontal ? "right" : "top"
    const rowAxis = isHorizontal ? "y" : "x"
    const availableWidth =
      (isHorizontal ? size.width : size.height) - 2 * PIN_LABEL_INSET_MM
    if (availableWidth <= 0) continue
    for (const opposite of labels) {
      const oppositePort = opposite.schematicPort
      if (oppositePort.side_of_component !== oppositeSide) continue
      if (!isSubstitutedFont && !opposite.isSubstitutedFont) continue
      if (
        Math.abs(schematicPort.center[rowAxis] - oppositePort.center[rowAxis]) >
        1e-6
      )
        continue
      const labelWidth = estimatePinLabelWidth({ label, fontSize })
      const oppositeWidth = estimatePinLabelWidth({
        label: opposite.label,
        fontSize: opposite.fontSize,
      })
      if (labelWidth === undefined || oppositeWidth === undefined) continue
      const rowWidth = labelWidth + oppositeWidth
      if (rowWidth <= availableWidth) continue
      const labelGap = Math.max(fontSize, opposite.fontSize)
      const fontSizeRatio = availableWidth / (rowWidth + labelGap)
      currentLabel.fontSizeRatio = Math.min(
        currentLabel.fontSizeRatio,
        fontSizeRatio,
      )
      opposite.fontSizeRatio = Math.min(opposite.fontSizeRatio, fontSizeRatio)
    }
  }
  // Fit only colliding pairs, retaining their relative font sizes and leaving
  // labels on other rows at their authored sizes.
  for (const { schematicPort, fontSize, fontSizeRatio } of labels) {
    if (fontSizeRatio >= 1) continue
    schematicPort.display_pin_label_font_size = fontSize * fontSizeRatio
  }
}
