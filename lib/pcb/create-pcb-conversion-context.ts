import type { AltiumPcbDocument } from "altiumts"

import { createPcbNetContext } from "./create-pcb-net-context"
import type { ConvertAltiumPcbDocOptions, PcbConversionContext } from "./types"

export function createPcbConversionContext({
  document,
  options,
}: {
  document: AltiumPcbDocument
  options: ConvertAltiumPcbDocOptions
}): PcbConversionContext {
  return {
    document,
    elements: [],
    netContext: createPcbNetContext(document),
    options,
  }
}
