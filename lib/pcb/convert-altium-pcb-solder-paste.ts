import type { AltiumRecord } from "altiumts"
import type { PcbSolderPaste } from "circuit-json"
import { getAltiumFabricationGraphic } from "./get-altium-fabrication-graphic"

export function convertAltiumPcbSolderPaste({
  record,
  recordIndex,
}: {
  record: AltiumRecord
  recordIndex: number
}): PcbSolderPaste | undefined {
  const layer = mapSolderPasteLayer(record.getDecoded("LAYER"))
  if (!layer) return undefined
  const graphic = getAltiumFabricationGraphic({ record })
  if (!graphic) return undefined

  const base = {
    type: "pcb_solder_paste" as const,
    pcb_solder_paste_id: `pcb_solder_paste_altium_${recordIndex}`,
    pcb_component_id: graphic.pcbComponentId,
    layer,
  }
  if (graphic.shape === "polygon") {
    return { ...base, shape: "polygon", points: graphic.points }
  }
  if (graphic.shape === "rotated_rect") {
    return {
      ...base,
      shape: "rotated_rect",
      x: graphic.x,
      y: graphic.y,
      width: graphic.width,
      height: graphic.height,
      ccw_rotation: graphic.ccwRotation,
    }
  }
  return {
    ...base,
    shape: "rect",
    x: graphic.x,
    y: graphic.y,
    width: graphic.width,
    height: graphic.height,
  }
}

function mapSolderPasteLayer(
  layer: string | undefined,
): "top" | "bottom" | undefined {
  const normalized = normalizeLayer(layer)
  if (normalized === "TOPPASTE") return "top"
  if (normalized === "BOTTOMPASTE") return "bottom"
  return undefined
}

function normalizeLayer(layer: string | undefined): string {
  return (layer ?? "").replace(/[\s_.-]+/gu, "").toUpperCase()
}
