import type { AltiumPadRecord, getAltiumPcbPadGeometry } from "altiumts"
import type { LayerRef, PcbPlatedHole } from "circuit-json"
import type { PcbCopperLayerMap } from "../layers"

export type ConvertedPcbPadStackEntry =
  | { layer: LayerRef; shape: "circle"; radius: number }
  | {
      layer: LayerRef
      shape: "rect"
      width: number
      height: number
      ccw_rotation?: number
      corner_radius?: number
    }
  | {
      layer: LayerRef
      shape: "pill"
      width: number
      height: number
      radius: number
      ccw_rotation?: number
    }
  | {
      layer: LayerRef
      shape: "polygon"
      points: Array<{ x: number; y: number }>
    }

export type ConvertedPcbPadStack = ConvertedPcbPadStackEntry[]

/**
 * Forward-compatible converter output. `pad_stack` is validated by the
 * circuit-json schema introduced in tscircuit/circuit-json#836.
 */
export type ConvertedPcbPlatedHole = PcbPlatedHole & {
  pad_stack?: ConvertedPcbPadStack
}

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
