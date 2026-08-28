import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Track|LAYER=MECHANICAL1|X1=50mil|Y1=50mil|X2=200mil|Y2=50mil|WIDTH=6mil",
    "|RECORD=Arc|LAYER=MECHANICAL1|LOCATION.X=250mil|LOCATION.Y=100mil|RADIUS=50mil|STARTANGLE=0|ENDANGLE=180|WIDTH=6mil",
    "|RECORD=Region|LAYER=MECHANICAL1|REGIONKIND=OTHER|HOLECOUNT=0|KIND0=0|VX0=350mil|VY0=50mil|KIND1=0|VX1=450mil|VY1=50mil|KIND2=0|VX2=400mil|VY2=120mil|KIND3=0|VX3=350mil|VY3=50mil",
    "|RECORD=Fill|LAYER=MECHANICAL1|X1=220mil|Y1=170mil|X2=280mil|Y2=210mil|ROTATION=0",
    "|RECORD=Text|LAYER=MECHANICAL1|X=50mil|Y=180mil|HEIGHT=35mil|JUSTIFICATION=1|TEXT=ASSEMBLY LIMIT",
    "|RECORD=Text|LAYER=DRILLDRAWING|X=350mil|Y=180mil|HEIGHT=35mil|JUSTIFICATION=1|TEXT=.Legend",
    "|RECORD=Dimension|LAYER=MECHANICAL1|DIMENSIONKIND=LINEAR|REFERENCES_COUNT=2|REFERENCE0POINTX=100mil|REFERENCE0POINTY=250mil|REFERENCE1POINTX=400mil|REFERENCE1POINTY=250mil|X1=100mil|Y1=330mil|TEXTX=250mil|TEXTY=330mil|TEXTDIMENSIONUNIT=MILLIMETERS|TEXTPRECISION=2|TEXTHEIGHT=35mil|LINEWIDTH=5mil|ARROWSIZE=25mil",
  ].join("\n"),
)

test("imports Altium mechanical and drill annotations", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const dimension = circuitJson.find(
    (element) => element.type === "pcb_fabrication_note_dimension",
  )
  const paths = circuitJson.filter(
    (element) => element.type === "pcb_fabrication_note_path",
  )
  const texts = circuitJson.filter(
    (element) => element.type === "pcb_fabrication_note_text",
  )
  const rectangles = circuitJson.filter(
    (element) => element.type === "pcb_fabrication_note_rect",
  )

  expect(dimension).toMatchObject({
    arrow_size: 0.635,
    color: "#ec4899",
    font_size: 0.889,
    from: { x: 2.54, y: 6.35 },
    offset_direction: { x: 0, y: 1 },
    offset_distance: 2.032,
    text: "7.62 mm",
    to: { x: 10.16, y: 6.35 },
  })
  expect(paths).toHaveLength(3)
  expect(rectangles).toHaveLength(1)
  expect(texts.map((text) => text.text)).toEqual(["ASSEMBLY LIMIT", ".Legend"])
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)

  const altiumSvg = serializeAltiumPcbToSvg(document, {
    height: 600,
    title: "Altium annotations source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 600,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB mechanical annotations",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
