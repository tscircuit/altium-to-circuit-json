import { expect, test } from "bun:test"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "SimpleFOC Shield V3 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: "simplefoc-shield-v3.PcbDoc",
        pcbName: "SimpleFOC Shield V3",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    expect(
      circuitJson.filter((element) => element.type === "pcb_solder_paste"),
    ).toHaveLength(20)
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
