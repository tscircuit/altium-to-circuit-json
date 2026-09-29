import { expect, test } from "bun:test"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "SimpleFOC Mini PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: "simplefocmini-2024-04-26.PcbDoc",
        focusOnBoard: true,
        pcbName: "SimpleFOC Mini",
      })

    expectValidImportedPcb({
      circuitJson,
      circuitJsonSvg,
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
