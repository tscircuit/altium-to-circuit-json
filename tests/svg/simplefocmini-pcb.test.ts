import { expect, test } from "bun:test"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"
import { getPcbBoardViewportBounds } from "../helpers/get-pcb-board-viewport-bounds"

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
    const board = circuitJson.find((element) => element.type === "pcb_board")
    expect(board).toBeDefined()
    if (!board) throw new Error("SimpleFOC Mini did not produce a PCB board")
    const bounds = getPcbBoardViewportBounds(board)
    const svgTag = circuitJsonSvg.match(/<svg\b[^>]*>/u)?.[0] ?? ""
    const width = Number(svgTag.match(/\bwidth="([^"]+)"/u)?.[1])
    const height = Number(svgTag.match(/\bheight="([^"]+)"/u)?.[1])
    expect(width / height).toBeCloseTo(
      (bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY),
      6,
    )
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
