import type { AltiumRecord } from "altiumts"

export function isMechanicalLayer(layer: string | undefined): boolean {
  return normalizeLayer(layer).startsWith("MECHANICAL")
}

export function isOverlayLayer(layer: string | undefined): boolean {
  const normalizedLayer = normalizeLayer(layer)
  return normalizedLayer === "TOPOVERLAY" || normalizedLayer === "BOTTOMOVERLAY"
}

export function isKeepoutLayer(layer: string | undefined): boolean {
  return normalizeLayer(layer) === "KEEPOUT"
}

export function isCourtyardLayer(layer: string | undefined): boolean {
  const normalizedLayer = normalizeLayer(layer)
  return (
    normalizedLayer === "MECHANICAL15" || normalizedLayer === "MECHANICAL16"
  )
}

export function mapCourtyardLayer(layer: string | undefined): "top" | "bottom" {
  return normalizeLayer(layer) === "MECHANICAL16" ? "bottom" : "top"
}

export function mapMechanicalLayer(
  layer: string | undefined,
): "top" | "bottom" {
  return normalizeLayer(layer).includes("BOTTOM") ? "bottom" : "top"
}

export function mapOverlayLayer(layer: string | undefined): "top" | "bottom" {
  return normalizeLayer(layer) === "BOTTOMOVERLAY" ? "bottom" : "top"
}

export function getRecordLayer(record: AltiumRecord): string | undefined {
  return record.getDecoded("LAYER")
}

export function normalizeLayer(layer: string | undefined): string {
  return (layer ?? "").replace(/[\s_.-]+/gu, "").toUpperCase()
}
