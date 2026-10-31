import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { getPreferredPcbBoardOutline } from "../../lib/pcb/board/getPreferredPcbBoardOutline"

test("disconnected fabrication annotations do not prevent BeaglePlay outline recovery", async () => {
  const source = await Bun.file(
    new URL("../fixtures/beagleplay-board-outline.PcbDoc", import.meta.url),
  ).text()
  const expectedOutline = getPreferredPcbBoardOutline(parseAltiumPcbDoc(source))
  for (const layer of ["MECHANICAL1", "MECHANICAL15"]) {
    const annotation = [
      `|RECORD=Track|LAYER=${layer}|X1=-11500mil|Y1=11000mil|X2=-11400mil|Y2=11000mil`,
      `|RECORD=Track|LAYER=${layer}|X1=-11400mil|Y1=11000mil|X2=-11300mil|Y2=11000mil`,
      `|RECORD=Track|LAYER=${layer}|X1=-11400mil|Y1=11000mil|X2=-11400mil|Y2=11100mil`,
    ]
    const document = parseAltiumPcbDoc([source, ...annotation].join("\n"))
    expect(getPreferredPcbBoardOutline(document)).toEqual(expectedOutline)
    expect(expectedOutline).not.toEqual(document.boardGeometry.outline.points)
  }
})
