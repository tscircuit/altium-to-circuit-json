import { expect, test } from "bun:test"
import { AltiumArcRecord } from "altiumts"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "SimpleFOC Mini PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg, document } =
      await createOpenSourcePcbComparison({
        filename: "simplefocmini-2024-04-26.PcbDoc",
        pcbName: "SimpleFOC Mini",
      })

    const sourceArcs = document.records.filter(
      (record) =>
        record instanceof AltiumArcRecord &&
        record.layer === "KEEPOUT" &&
        record.getBoolean("KEEPOUT") === true,
    )
    expect(sourceArcs).toHaveLength(4)
    const keepouts = circuitJson.filter((e) => e.type === "pcb_keepout")
    expect(keepouts).toHaveLength(sourceArcs.length)
    for (const keepout of keepouts) {
      expect(keepout).toMatchObject({
        shape: "outline",
        stroke_width: 0.254,
        layers: ["top", "bottom"],
      })
    }

    expectValidImportedPcb({
      circuitJson,
      circuitJsonSvg,
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
