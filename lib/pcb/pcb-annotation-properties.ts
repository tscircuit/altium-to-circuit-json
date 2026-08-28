import type { AltiumPcbDocument, AltiumRecord } from "altiumts"

const BOARD_GRAPHICS_COMPONENT_ID = "pcb_component_altium_board_graphics"
const MECHANICAL_LAYER_COLOR = "#ec4899"
const DRILL_LAYER_COLOR = "#f59e0b"

export function getPcbAnnotationLayer({
  document,
  record,
}: {
  document: AltiumPcbDocument
  record: AltiumRecord
}): "top" | "bottom" {
  const layer = normalizePcbLayer(record.getDecoded("LAYER"))
  if (layer === "MECHANICAL16" || layer.startsWith("BOTTOM")) return "bottom"
  return document.getComponentForRecord(record)?.side === "bottom"
    ? "bottom"
    : "top"
}

export function getPcbAnnotationColor(record: AltiumRecord): string {
  const layer = normalizePcbLayer(record.getDecoded("LAYER"))
  if (layer.startsWith("MECHANICAL")) return MECHANICAL_LAYER_COLOR
  if (layer === "TOP" || layer === "TOPLAYER") return "#ef4444"
  if (layer === "BOTTOM" || layer === "BOTTOMLAYER") return "#3b82f6"
  if (layer === "TOPOVERLAY") return "#f8fafc"
  if (layer === "BOTTOMOVERLAY") return "#fde68a"
  if (layer === "TOPPASTE") return "#cbd5e1"
  if (layer === "BOTTOMPASTE") return "#94a3b8"
  if (layer === "TOPSOLDER") return "#4ade80"
  if (layer === "BOTTOMSOLDER" || layer === "MULTILAYER") return "#22c55e"
  if (layer === "KEEPOUT") return "#a855f7"
  if (layer.startsWith("MID") || layer.startsWith("INTERNALPLANE")) {
    return "#f97316"
  }
  return DRILL_LAYER_COLOR
}

export function getPcbAnnotationComponentId(record: AltiumRecord): string {
  const componentIndex = getPcbComponentIndex(record)
  return componentIndex === undefined
    ? BOARD_GRAPHICS_COMPONENT_ID
    : `pcb_component_altium_${componentIndex}`
}

export function getPcbComponentIndex(record: AltiumRecord): number | undefined {
  const componentIndex = record.getNumber("COMPONENT")
  return componentIndex === undefined || componentIndex === 65_535
    ? undefined
    : componentIndex
}

export function isMechanicalOrDrillLayer(layer: string): boolean {
  return (
    layer.startsWith("MECHANICAL") ||
    layer === "DRILLDRAWING" ||
    layer === "DRILLGUIDE"
  )
}

export function normalizePcbLayer(layer: string | undefined): string {
  return (layer ?? "").replace(/[\s_.-]+/gu, "").toUpperCase()
}
