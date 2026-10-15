import type { AltiumPcbLayerStackEntry } from "altiumts"
import { getCopperLayerIdentity } from "./getCopperLayerIdentity"
import { normalizeLayer } from "./normalizeLayer"

export function getCopperStackEntryKeys(
  entry: AltiumPcbLayerStackEntry,
): string[] {
  const identity = getCopperLayerIdentity(
    entry.layerId ??
      (entry.source === "legacy" ? String(entry.index) : undefined),
  )
  const nameIdentity = getCopperLayerIdentity(entry.name)
  return [
    entry.layerId,
    identity && nameIdentity && identity !== nameIdentity
      ? undefined
      : entry.name,
    entry.source === "legacy" ? String(entry.index) : undefined,
  ].flatMap((layer) =>
    layer ? [getCopperLayerIdentity(layer) ?? normalizeLayer(layer)] : [],
  )
}
