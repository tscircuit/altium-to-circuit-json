import type { AltiumPadRecord, getAltiumPcbPadGeometry } from "altiumts"
import type { PcbCopperLayerMap } from "../layers"

export interface ThroughHolePadConversionOptions {
  cornerRadius: number | undefined
  geometry: ReturnType<typeof getAltiumPcbPadGeometry>
  height: number
  holeDiameter: number
  id: string
  layerMap: PcbCopperLayerMap
  record: AltiumPadRecord
  shape: string
  width: number
  x: number
  y: number
}
