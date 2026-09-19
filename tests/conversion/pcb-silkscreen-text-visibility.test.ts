import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("honors component designator and comment visibility", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil",
      "|RECORD=Component|ID=0|NAMEON=FALSE|COMMENTON=FALSE",
      "|RECORD=Text|COMPONENT=0|LAYER=TOPOVERLAY|X=100mil|Y=100mil|TEXT=R1|DESIGNATOR=TRUE",
      "|RECORD=Text|COMPONENT=0|LAYER=TOPOVERLAY|X=100mil|Y=150mil|TEXT=hidden value|COMMENT=TRUE",
      "|RECORD=Component|ID=1|NAMEON=TRUE|COMMENTON=TRUE",
      "|RECORD=Text|COMPONENT=1|LAYER=TOPOVERLAY|X=400mil|Y=100mil|TEXT=R2|DESIGNATOR=TRUE",
      "|RECORD=Text|COMPONENT=1|LAYER=TOPOVERLAY|X=400mil|Y=150mil|TEXT=10k|COMMENT=TRUE",
      "|RECORD=Text|LAYER=TOPOVERLAY|X=300mil|Y=300mil|TEXT=BOARD LABEL",
    ].join("\n"),
  )

  const texts = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text",
  )

  expect(texts.map(({ text }) => text)).toEqual(["R2", "10k", "BOARD LABEL"])
})
