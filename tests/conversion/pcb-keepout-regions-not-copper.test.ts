import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("component keepout regions and fills do not become copper", () => {
  // BeaglePlay's component pad keepouts use COPPER region kind on a copper
  // layer, with KEEPOUT=TRUE distinguishing them from physical copper.
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil",
      "|RECORD=Region|LAYER=BOTTOM|REGIONKIND=COPPER|KEEPOUT=TRUE|KEEPOUTRESTRICTIONS=1|KIND0=0|VX0=50mil|VY0=50mil|KIND1=0|VX1=102mil|VY1=50mil|KIND2=0|VX2=102mil|VY2=93mil|KIND3=0|VX3=50mil|VY3=93mil",
      "|RECORD=Fill|LAYER=TOP|KEEPOUT=TRUE|X1=200mil|Y1=50mil|X2=250mil|Y2=100mil",
      "|RECORD=Fill|LAYER=TOP|KEEPOUT=FALSE|X1=300mil|Y1=50mil|X2=350mil|Y2=100mil",
    ].join("\n"),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  expect(
    circuitJson.filter(({ type }) => type === "pcb_copper_pour"),
  ).toMatchObject([
    {
      layer: "top",
      shape: "rect",
      pcb_copper_pour_id: "pcb_copper_pour_altium_fill_3",
    },
  ])
})
