import { expect, test } from "bun:test"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "NodeMCU ESP-12 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: "nodemcu-esp12.PcbDoc",
        pcbName: "NodeMCU ESP-12",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    const silkscreenRegions = circuitJson.filter(
      (element) => element.type === "pcb_silkscreen_graphic",
    )
    expect(
      silkscreenRegions.filter((region) => region.layer === "top"),
    ).toHaveLength(4)
    expect(
      silkscreenRegions.filter((region) => region.layer === "bottom"),
    ).toHaveLength(13)
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
