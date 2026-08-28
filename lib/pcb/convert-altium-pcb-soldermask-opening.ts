import type { AltiumRecord } from "altiumts"
import type { PcbSoldermaskOpening } from "circuit-json"
import { getAltiumFabricationGraphic } from "./get-altium-fabrication-graphic"

export function convertAltiumPcbSoldermaskOpening({
  record,
  recordIndex,
}: {
  record: AltiumRecord
  recordIndex: number
}): PcbSoldermaskOpening | undefined {
  const layer = mapSoldermaskLayer(record.getDecoded("LAYER"))
  if (!layer) return undefined
  const graphic = getAltiumFabricationGraphic({ record })
  if (!graphic) return undefined

  const base = {
    type: "pcb_soldermask_opening" as const,
    pcb_soldermask_opening_id: `pcb_soldermask_opening_altium_${recordIndex}`,
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

function mapSoldermaskLayer(
  layer: string | undefined,
): "top" | "bottom" | undefined {
  const normalized = normalizeLayer(layer)
  if (normalized === "TOPSOLDER") return "top"
  if (normalized === "BOTTOMSOLDER") return "bottom"
  return undefined
}

function normalizeLayer(layer: string | undefined): string {
  return (layer ?? "").replace(/[\s_.-]+/gu, "").toUpperCase()
}
