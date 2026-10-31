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
  if (!board?.outline) throw new Error("Missing BeaglePlay outline")
  let twiceSignedArea = 0
  for (const [index, point] of board.outline.entries()) {
    const next = board.outline[(index + 1) % board.outline.length]!
    twiceSignedArea += point.x * next.y - next.x * point.y
  }
  // An 80.00238 mm square with four 1.27 mm corner radii. The malformed
  // diagonal loses about 49 mm² despite retaining exactly the same bounds.
  const expectedArea = 80.00238 ** 2 - (4 - Math.PI) * 1.27 ** 2
  expect(Math.abs(Math.abs(twiceSignedArea) / 2 - expectedArea)).toBeLessThan(
    0.05,
  )

  await expect(
    convertCircuitJsonToPcbSvg(circuitJson, {
      width: 800,
      height: 800,
      showSolderMask: true,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
