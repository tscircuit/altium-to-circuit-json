import type { AltiumTrackRecord } from "altiumts"
import { convertPcbTrackKeepout } from "../annotations"
import { isCourtyardLayer, isKeepoutLayer, isOverlayLayer } from "../layers"
import type { PcbConversionContext } from "../model"
import { convertPcbTrack } from "../routing"
import { convertPcbSilkscreenLine } from "../silkscreen"

export function convertPcbTrackRecord({
  context,
  record,
  recordIndex,
}: {
  context: PcbConversionContext
  record: AltiumTrackRecord
  recordIndex: number
}): void {
  const { elements, layerMap, netContext, options } = context
  if (isKeepoutLayer(record.layer) || record.getBoolean("KEEPOUT") === true) {
    if (options.includeKeepouts === false) return
    const keepout = convertPcbTrackKeepout({ layerMap, record, recordIndex })
    if (keepout) elements.push(keepout)
    return
  }

  if (isCourtyardLayer(record.layer)) return
  if (isOverlayLayer(record.layer)) {
    if (options.includeSilkscreen === false) return
    const line = convertPcbSilkscreenLine({ record, recordIndex })
    if (line) elements.push(line)
  } else if (options.includeTraces !== false) {
    const trace = convertPcbTrack({ layerMap, netContext, record, recordIndex })
    if (trace) elements.push(trace)
  }
}
