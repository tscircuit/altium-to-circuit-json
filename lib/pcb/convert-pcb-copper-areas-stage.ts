import { convertAltiumCopperAreas } from "./convert-altium-copper-areas"
import type { PcbConversionContext } from "./types"

export function convertPcbCopperAreas(context: PcbConversionContext): void {
  if (context.options.includeCopperAreas === false) return
  context.elements.push(
    ...convertAltiumCopperAreas(context.document, {
      getSourceNetId: context.netContext.getSourceNetId,
    }),
  )
}
