import {
  type AltiumPolygonRecord,
  type AltiumRegionRecord,
  getPcbContour,
  getPcbRegionGeometry,
} from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import type { PcbCopperLayerMap } from "../layers"
import { contourToPoints } from "./contourToPoints"

export function convertCopperPolygon({
  cutouts,
  polygonIndex,
  layerMap,
  record,
  sourceNetId,
}: {
  cutouts: AltiumRegionRecord[]
  polygonIndex: number
  layerMap: PcbCopperLayerMap
  record: AltiumPolygonRecord
  sourceNetId: string | undefined
}): PcbCopperPour[] {
  const layer = layerMap.getLayer(record.layer)
  if (!layer) return []
  const points = contourToPoints(getPcbContour(record))
  if (points.length < 3) return []
  const cutoutGeometries = cutouts.map(getPcbRegionGeometry)
  const innerRings = cutoutGeometries
    .map((geometry) => ({ vertices: contourToPoints(geometry.outline) }))
    .filter((ring) => ring.vertices.length >= 3)
  const islandPours: PcbCopperPour[] = cutoutGeometries.flatMap(
    (geometry, cutoutIndex) =>
      geometry.holes.flatMap((hole, holeIndex) => {
        const islandPoints = contourToPoints(hole)
        return islandPoints.length < 3
          ? []
          : [
              {
                type: "pcb_copper_pour" as const,
                pcb_copper_pour_id: `pcb_copper_pour_altium_polygon_${polygonIndex}_cutout_${cutoutIndex}_island_${holeIndex}`,
                ...(sourceNetId ? { source_net_id: sourceNetId } : {}),
                covered_with_solder_mask: true,
                layer,
                shape: "polygon" as const,
                points: islandPoints,
              },
            ]
      }),
  )

  return [
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: `pcb_copper_pour_altium_polygon_${polygonIndex}`,
      ...(sourceNetId ? { source_net_id: sourceNetId } : {}),
      covered_with_solder_mask: true,
      layer,
      ...(innerRings.length === 0
        ? { shape: "polygon" as const, points }
        : {
            shape: "brep" as const,
            brep_shape: {
              outer_ring: { vertices: points },
              inner_rings: innerRings,
            },
          }),
    },
    ...islandPours,
  ]
}
