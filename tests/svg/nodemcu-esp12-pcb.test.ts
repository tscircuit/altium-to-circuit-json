import { expect, test } from "bun:test"
import { AltiumArcRecord, AltiumTrackRecord } from "altiumts"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "NodeMCU ESP-12 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg, document } =
      await createOpenSourcePcbComparison({
        filename: "nodemcu-esp12.PcbDoc",
        pcbName: "NodeMCU ESP-12",
      })

    const sourceSegments = document.records.flatMap((record, recordIndex) =>
      record instanceof AltiumTrackRecord && record.layer === "KEEPOUT"
        ? [{ record, recordIndex }]
        : [],
    )
    expect(sourceSegments).toHaveLength(10)
    for (const { record, recordIndex } of sourceSegments) {
      const start = record.start
      const end = record.end
      if (!start || !end) throw new Error("Expected keepout segment endpoints")
      const keepout = circuitJson.find(
        (e) =>
          e.type === "pcb_keepout" &&
          e.pcb_keepout_id === `pcb_keepout_altium_track_${recordIndex}`,
      )
      expect(keepout).toMatchObject({
        shape: "outline",
        outline: [
          { x: start.x * 0.0254, y: start.y * 0.0254 },
          { x: end.x * 0.0254, y: end.y * 0.0254 },
        ],
        stroke_width: 0.2032,
        layers: ["top", "bottom"],
      })
    }

    const sourceArcs = document.records.flatMap((record, recordIndex) =>
      record instanceof AltiumArcRecord && record.layer === "KEEPOUT"
        ? [{ recordIndex }]
        : [],
    )
    expect(sourceArcs).toHaveLength(6)
    for (const { recordIndex } of sourceArcs) {
      expect(
        circuitJson.find(
          (e) =>
            e.type === "pcb_keepout" &&
            e.pcb_keepout_id === `pcb_keepout_altium_arc_${recordIndex}`,
        ),
      ).toMatchObject({
        shape: "outline",
        stroke_width: 0.2032,
        layers: ["top", "bottom"],
      })
    }
    expect(circuitJson.filter((e) => e.type === "pcb_keepout")).toHaveLength(16)

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
