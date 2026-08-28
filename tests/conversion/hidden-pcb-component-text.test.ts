import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const componentTextPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=600mil|VY1=0mil|KIND2=0|VX2=600mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Component|ID=4|LAYER=TOP|X=100mil|Y=100mil|NAMEON=FALSE|COMMENTON=FALSE",
    "|RECORD=Text|COMPONENT=4|LAYER=TOPOVERLAY|X=100mil|Y=100mil|HEIGHT=30mil|DESIGNATOR=TRUE|TEXT=HIDDEN DESIGNATOR",
    "|RECORD=Text|COMPONENT=4|LAYER=TOPOVERLAY|X=100mil|Y=150mil|HEIGHT=30mil|COMMENT=TRUE|TEXT=HIDDEN COMMENT",
    "|RECORD=Text|COMPONENT=4|LAYER=TOPOVERLAY|X=100mil|Y=200mil|HEIGHT=30mil|TEXT=VISIBLE BOARD TEXT",
    "|RECORD=Component|ID=5|LAYER=TOP|X=350mil|Y=100mil|NAMEON=TRUE|COMMENTON=TRUE",
    "|RECORD=Text|COMPONENT=5|LAYER=TOPOVERLAY|X=350mil|Y=100mil|HEIGHT=30mil|DESIGNATOR=TRUE|TEXT=VISIBLE DESIGNATOR",
    "|RECORD=Text|COMPONENT=5|LAYER=TOPOVERLAY|X=350mil|Y=150mil|HEIGHT=30mil|COMMENT=TRUE|TEXT=VISIBLE COMMENT",
  ].join("\n"),
)

test("respects Altium component designator and comment visibility", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(componentTextPcbDoc)
  const texts = circuitJson.filter(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text",
  )

  expect(texts.map((text) => text.text)).toEqual([
    "VISIBLE BOARD TEXT",
    "VISIBLE DESIGNATOR",
    "VISIBLE COMMENT",
  ])

  const altiumSvg = serializeAltiumPcbToSvg(componentTextPcbDoc, {
    height: 800,
    title: "Altium component text visibility source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 800,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB component text visibility",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
