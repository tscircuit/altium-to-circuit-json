import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("derives board thickness from the physical v8 layer stack", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board" +
        "|LAYER_V8_0NAME=Top Solder|LAYER_V8_0LAYERID=16973834|LAYER_V8_0DIELHEIGHT=0.4mil" +
        "|LAYER_V8_1NAME=Top Layer|LAYER_V8_1LAYERID=16777217|LAYER_V8_1COPTHICK=2mil" +
        "|LAYER_V8_2NAME=Dielectric 1|LAYER_V8_2LAYERID=17039361|LAYER_V8_2DIELHEIGHT=50mil" +
        "|LAYER_V8_3NAME=Bottom Layer|LAYER_V8_3LAYERID=16842751|LAYER_V8_3COPTHICK=2mil" +
        "|LAYER_V8_4NAME=Bottom Solder|LAYER_V8_4LAYERID=16973835|LAYER_V8_4DIELHEIGHT=0.4mil" +
        "|LAYERV7_0NAME=Mechanical 1|LAYERV7_0LAYERID=16908289|LAYERV7_0COPTHICK=100mil|LAYERV7_0DIELHEIGHT=100mil",
    ].join("\n"),
  )

  const board = convertAltiumPcbDocToCircuitJson(document).find(
    (element) => element.type === "pcb_board",
  )

  expect(board?.thickness).toBeCloseTo(1.39192, 8)
})

test("falls back to the default thickness when v8 stack dimensions are absent", () => {
  const document = parseAltiumPcbDoc("|RECORD=Board")

  const board = convertAltiumPcbDocToCircuitJson(document).find(
    (element) => element.type === "pcb_board",
  )

  expect(board?.thickness).toBe(1.6)
})
