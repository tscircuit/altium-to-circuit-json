import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("BeaglePlay board outline from its published Altium export", async () => {
  const source = await Bun.file(
    new URL("../fixtures/beagleplay-board-outline.PcbDoc", import.meta.url),
  ).text()
  const circuitJson = convertAltiumPcbDocToCircuitJson(
    parseAltiumPcbDoc(source),
  )
  const board = circuitJson.find((element) => element.type === "pcb_board")
  expect(board?.width).toBeCloseTo(80.00238, 5)
  expect(board?.height).toBeCloseTo(80.00238, 5)

  await expect(
    convertCircuitJsonToPcbSvg(circuitJson, {
      width: 800,
      height: 800,
      showSolderMask: true,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
