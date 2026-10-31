import { expect, test } from "bun:test"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "EBAZ4205 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: "ebaz4205.PcbDoc",
        pcbName: "EBAZ4205",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    expect(
      circuitJson.filter(
        (e) =>
          e.type === "pcb_keepout" &&
          e.pcb_keepout_id.startsWith("pcb_keepout_altium_arc_") &&
          e.shape === "brep",
      ),
    ).toHaveLength(4)
    expect(
      circuitJson.filter(
        (e) => e.type === "pcb_keepout" && e.shape === "circle",
      ),
    ).toHaveLength(0)
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 180_000 },
)
