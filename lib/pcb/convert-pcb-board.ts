import {
  AltiumPadRecord,
  type AltiumPcbDocument,
  type AltiumPoint,
  type AltiumRecord,
  AltiumTrackRecord,
  AltiumViaRecord,
  getAltiumBounds,
  getPcbLayerStack,
} from "altiumts"
import type { PcbBoard, PcbCutout } from "circuit-json"

import { BOARD_ID } from "./constants"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import { getPreferredPcbBoardOutline } from "./get-board-outline"
import { mapAltiumCopperLayer } from "./map-altium-copper-layer"
import type { PcbConversionContext } from "./types"

export function convertPcbBoard(context: PcbConversionContext): void {
  if (context.options.includeBoardOutline === false) return
  context.elements.push(createBoard(context.document))
  for (const [
    index,
    cutout,
  ] of context.document.boardGeometry.cutouts.entries()) {
    if (cutout.outline.points.length < 3) continue
    context.elements.push({
      type: "pcb_cutout",
      pcb_cutout_id: `pcb_cutout_altium_${index}`,
      pcb_board_id: BOARD_ID,
      shape: "polygon",
      points: cutout.outline.points.map(toMillimeterPoint),
    } satisfies PcbCutout)
  }
}

function createBoard(document: AltiumPcbDocument): PcbBoard {
  const altiumOutline = getPreferredPcbBoardOutline(document)
  const outline = altiumOutline.map(toMillimeterPoint)
  const bounds =
    getAltiumBounds(altiumOutline) ?? getFallbackPcbBounds(document.records)
  const width = Math.max(milsToMillimeters(bounds.maxX - bounds.minX), 0.1)
  const height = Math.max(milsToMillimeters(bounds.maxY - bounds.minY), 0.1)

  return {
    type: "pcb_board",
    pcb_board_id: BOARD_ID,
    center: {
      x: milsToMillimeters((bounds.minX + bounds.maxX) / 2),
      y: milsToMillimeters((bounds.minY + bounds.maxY) / 2),
    },
    width,
    height,
    ...(outline.length >= 3 ? { shape: "polygon" as const, outline } : {}),
    thickness: 1.6,
    num_layers: getBoardLayerCount(document),
    material: "fr4",
  }
}

function getBoardLayerCount(document: AltiumPcbDocument): number {
  if (!document.board) return 2

  const entries = getPcbLayerStack(document.board).entries
  const modernCopperLayerCount = entries.filter(
    (entry) => entry.source === "v8" && entry.copperThickness !== undefined,
  ).length
  if (modernCopperLayerCount > 0) {
    return Math.max(modernCopperLayerCount, 2)
  }

  return Math.max(
    entries.filter((entry) =>
      Boolean(mapAltiumCopperLayer(entry.name ?? entry.layerId)),
    ).length,
    2,
  )
}

function getFallbackPcbBounds(records: AltiumRecord[]): {
  maxX: number
  maxY: number
  minX: number
  minY: number
} {
  const points: AltiumPoint[] = []
  for (const record of records) {
    if (
      record instanceof AltiumPadRecord ||
      record instanceof AltiumViaRecord
    ) {
      if (record.position) points.push(record.position)
    } else if (record instanceof AltiumTrackRecord) {
      if (record.start) points.push(record.start)
      if (record.end) points.push(record.end)
    }
  }
  return getAltiumBounds(points) ?? { minX: 0, minY: 0, maxX: 1000, maxY: 800 }
}
