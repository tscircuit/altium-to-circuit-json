import type { AltiumPrjPcb } from "altiumts"
import type { PcbCopperLayerMap } from "../layers"
import { getAltiumPcbLayerDisplayName } from "../layers"
import { replaceMatchingSpecialString } from "./replaceMatchingSpecialString"
import { resolvePcbProjectSpecialStrings } from "./resolvePcbProjectSpecialStrings"

export function resolvePcbTextSpecialStrings({
  layer,
  layerMap,
  project,
  text,
}: {
  layer: string | undefined
  layerMap: PcbCopperLayerMap
  project?: AltiumPrjPcb
  text: string
}): string {
  const projectResolvedText = resolvePcbProjectSpecialStrings({ project, text })
  if (!projectResolvedText.toLowerCase().includes(".layer_name")) {
    return projectResolvedText
  }
  const layerDisplayName =
    layerMap.getDisplayName(layer) ?? getAltiumPcbLayerDisplayName(layer)
  if (!layerDisplayName) return projectResolvedText

  const replacement = { name: "Layer_Name", text: layerDisplayName }
  return replaceMatchingSpecialString({
    isQuoted: true,
    replacement,
    text: replaceMatchingSpecialString({
      isQuoted: false,
      replacement,
      text: projectResolvedText,
    }),
  })
}
