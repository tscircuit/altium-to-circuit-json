import { type AltiumPcbDocument, getPcbLayerStack } from "altiumts"

export function getBoardThicknessMillimeters(
  document: AltiumPcbDocument,
): number | undefined {
  if (!document.board) return undefined
  const entries = getPcbLayerStack(document.board).entries.filter(
    (entry) => entry.source === "v8",
  )
  const hasCopperThickness = entries.some(
    (entry) => entry.copperThickness !== undefined,
  )
  const hasDielectricHeight = entries.some(
    (entry) => entry.dielectricHeight !== undefined,
  )
  if (!hasCopperThickness || !hasDielectricHeight) return undefined

  const thickness = entries.reduce(
    (total, entry) =>
      total +
      (entry.copperThickness?.toMillimeters() ?? 0) +
      (entry.dielectricHeight?.toMillimeters() ?? 0),
    0,
  )
  return Number.isFinite(thickness) && thickness > 0 ? thickness : undefined
}
