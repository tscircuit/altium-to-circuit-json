import { expect, test } from "bun:test"
import { AltiumArcRecord } from "altiumts"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { createRoutingConstraintsComparisonSvg } from "../helpers/create-routing-constraints-comparison-svg"
import { expectImportedPcbConnections } from "../helpers/expect-imported-pcb-connections"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI PMP22650 PCB: compare Altium, Circuit JSON, and routing constraints",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg, document } =
      await createOpenSourcePcbComparison({
        filename: TI_POWER_REFERENCE_PCB_FILENAMES.pmp22650,
        focusOnBoard: true,
        pcbName: "TI PMP22650",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    expectImportedPcbConnections({
      circuitJson,
      document,
      expectedConnectionCount: 410,
      expectedInheritedCopperAreaCount: 395,
    })
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "pcb_trace" && !("source_trace_id" in element),
      ),
    ).toHaveLength(0)

    const layerSpecificKeepoutArcs = circuitJson.filter(
      (element) =>
        element.type === "pcb_keepout" &&
        element.pcb_keepout_id.startsWith("pcb_keepout_altium_arc_") &&
        element.layers.length === 1,
    )
    expect(layerSpecificKeepoutArcs).toHaveLength(159)
    expect(layerSpecificKeepoutArcs).toContainEqual(
      expect.objectContaining({
        pcb_keepout_id: "pcb_keepout_altium_arc_4291",
        layers: ["top"],
      }),
    )
    const sourceCircles = document.records.flatMap((record, recordIndex) =>
      record instanceof AltiumArcRecord &&
      record.layer === "KEEPOUT" &&
      record.isFullCircle
        ? [{ record, recordIndex }]
        : [],
    )
    expect(sourceCircles).toHaveLength(16)
    for (const { record, recordIndex } of sourceCircles) {
      const center = record.center
      const radius = record.radiusMils
      if (!center || !radius) throw new Error("Expected full-circle geometry")
      const width = (record.widthMils ?? 4) * 0.0254
      const keepout = circuitJson.find(
        (e) =>
          e.type === "pcb_keepout" &&
          e.pcb_keepout_id === `pcb_keepout_altium_arc_${recordIndex}`,
      )
      expect(keepout).toMatchObject({
        shape: "brep",
        layers: [
          "top",
          "inner1",
          "inner2",
          "inner3",
          "inner4",
          "inner5",
          "inner6",
          "bottom",
        ],
      })
      if (keepout?.type !== "pcb_keepout" || keepout.shape !== "brep")
        throw new Error("Expected an annular BREP keepout")
      expect(keepout.brep_shape.inner_rings).toHaveLength(1)
      for (const [index, ring] of [
        keepout.brep_shape.outer_ring,
        ...keepout.brep_shape.inner_rings,
      ].entries()) {
        expect(ring.vertices).toHaveLength(2)
        for (const point of ring.vertices) {
          expect(point.bulge).toBe(index === 0 ? -1 : 1)
          expect(
            Math.hypot(
              point.x - center.x * 0.0254,
              point.y - center.y * 0.0254,
            ),
          ).toBeCloseTo(
            radius * 0.0254 + (index === 0 ? width / 2 : -width / 2),
            8,
          )
        }
      }
    }
    const board = circuitJson.find((element) => element.type === "pcb_board")
    if (!board) throw new Error("PMP22650 conversion did not emit a pcb_board")
    const sourceNets = circuitJson.filter(
      (element) => element.type === "source_net",
    )
    expect(board).toMatchObject({
      allow_blind_and_buried_vias: true,
      is_via_in_pad_allowed: true,
      min_via_hole_diameter: 0.1016,
      min_via_pad_diameter: 0.2032,
    })
    expect(board.min_trace_width).toBeCloseTo(0.1524)
    expect(sourceNets.every(({ trace_width }) => trace_width === 0.254)).toBe(
      true,
    )
    const routingConstraintsComparisonSvg =
      createRoutingConstraintsComparisonSvg({
        board,
        boardComparisonSvg: comparisonSvg,
        sourceNets,
      })

    await expect(routingConstraintsComparisonSvg).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  { timeout: 600_000 },
)
