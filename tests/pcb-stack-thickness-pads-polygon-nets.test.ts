import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../lib"

const makeV8StackPcbDoc = () =>
  parseAltiumPcbDoc(
    [
      "|RECORD=Board|LAYER_V8_0NAME=Top Solder|LAYER_V8_0LAYERID=37|LAYER_V8_0DIELTYPE=3|LAYER_V8_0DIELHEIGHT=0.4mil|LAYER_V8_1NAME=Top Layer|LAYER_V8_1LAYERID=1|LAYER_V8_1COPTHICK=1.4mil|LAYER_V8_1DIELTYPE=0|LAYER_V8_1DIELHEIGHT=10mil|LAYER_V8_2NAME=Dielectric 1|LAYER_V8_2DIELTYPE=1|LAYER_V8_2DIELHEIGHT=8mil|LAYER_V8_3NAME=Inner 1|LAYER_V8_3LAYERID=2|LAYER_V8_3COPTHICK=0.7mil|LAYER_V8_4NAME=Core|LAYER_V8_4DIELTYPE=1|LAYER_V8_4DIELHEIGHT=39mil|LAYER_V8_5NAME=Inner 2|LAYER_V8_5LAYERID=3|LAYER_V8_5COPTHICK=0.7mil|LAYER_V8_6NAME=Dielectric 2|LAYER_V8_6DIELTYPE=2|LAYER_V8_6DIELHEIGHT=8mil|LAYER_V8_7NAME=Bottom Layer|LAYER_V8_7LAYERID=32|LAYER_V8_7COPTHICK=1.4mil|LAYER_V8_8NAME=Bottom Solder|LAYER_V8_8LAYERID=38|LAYER_V8_8DIELTYPE=3|LAYER_V8_8DIELHEIGHT=0.4mil|",
      "|RECORD=Net|ID=0|NAME=GND|",
      "|RECORD=Pad|LAYER=MULTILAYER|X=100mil|Y=100mil|XSIZE=60mil|YSIZE=60mil|HOLESIZE=30mil|SHAPE=ROUND|PLATED=TRUE|NAME=1|",
      "|RECORD=Polygon|LAYER=TOP|NET=0|SA0=0mil|SA1=0mil|VX0=0mil|VY0=0mil|VX1=200mil|VY1=0mil|VX2=200mil|VY2=200mil|VX3=0mil|VY3=200mil|",
      "|RECORD=Region|LAYER=TOP|KIND=0|POLYGONOUTLINE=FALSE|OWNERPARTID=-1|POLYGON=0|MAINCONTOURVERTEXCOUNT=4|VX0=0mil|VY0=0mil|VX1=100mil|VY1=0mil|VX2=100mil|VY2=100mil|VX3=0mil|VY3=100mil|",
      "|RECORD=Fill|LAYER=TOP|POLYGON=0|X1=110mil|Y1=10mil|X2=190mil|Y2=90mil|ROTATION=0|",
    ].join("\n"),
  )

test("derives pcb_board.thickness from native Altium V8 stack with 1.6mm fallback", () => {
  const doc = makeV8StackPcbDoc()
  const elements = convertAltiumPcbDocToCircuitJson(doc)
  const board = elements.find((e) => e.type === "pcb_board")
  if (!board) throw new Error("Expected pcb_board")

  // Expected: (0.4 + 1.4 + 8 + 0.7 + 39 + 0.7 + 8 + 1.4 + 0.4) mil = 60 mil = 1.524 mm
  // Note: LAYER_V8_1 has DIELTYPE=0 (NotUsed) so its 10mil DIELHEIGHT must be ignored.
  expect(board.thickness).toBeCloseTo(60 * 0.0254, 6)

  // Board without stack thickness falls back to 1.6 mm
  const fallbackDoc = parseAltiumPcbDoc(
    "|RECORD=Board|LAYER1NAME=TOP|LAYER32NAME=BOTTOM|\n|RECORD=Track|LAYER=TOP|X1=0mil|Y1=0mil|X2=100mil|Y2=0mil|WIDTH=10mil|",
  )
  const fallbackElements = convertAltiumPcbDocToCircuitJson(fallbackDoc)
  const fallbackBoard = fallbackElements.find((e) => e.type === "pcb_board")
  expect(fallbackBoard?.thickness).toBe(1.6)
})

test("through-hole pads span all physical copper layers on multi-layer boards", () => {
  const doc = makeV8StackPcbDoc()
  const elements = convertAltiumPcbDocToCircuitJson(doc)
  const platedHole = elements.find((e) => e.type === "pcb_plated_hole")
  if (!platedHole) throw new Error("Expected pcb_plated_hole")
  expect(platedHole.layers).toEqual(["top", "inner1", "inner2", "bottom"])
})

test("copper regions and fills owned by a net-assigned polygon inherit source_net_id", () => {
  const doc = makeV8StackPcbDoc()
  const elements = convertAltiumPcbDocToCircuitJson(doc)
  const gndNet = elements.find(
    (e) => e.type === "source_net" && e.name === "GND",
  )
  if (gndNet?.type !== "source_net") {
    throw new Error("Expected GND source_net")
  }

  const pours = elements.filter((e) => e.type === "pcb_copper_pour")
  expect(pours.length).toBe(2)
  for (const pour of pours) {
    expect(pour.source_net_id).toBe(gndNet.source_net_id)
  }
})
