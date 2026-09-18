import { expect, test } from "bun:test"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import type { SchematicPort, SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { getPageFitScale } from "../../lib/schematic/sheet-layout"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const schematic = parseAltiumSchDoc(
  [
    "|RECORD=31|CUSTOMX=1000|CUSTOMY=800|FONTIDCOUNT=3|SIZE1=10|FONTNAME1=Arial|SIZE2=12|FONTNAME2=Arial|SIZE3=6|FONTNAME3=Arial",
    "|RECORD=1|LIBREFERENCE=CustomIC|DESIGNATOR=U1|PARTCOUNT=1|DISPLAYMODECOUNT=1|INDEXINSHEET=1|OWNERPARTID=-1|LOCATION.X=500|LOCATION.Y=400|CURRENTPARTID=1|ALLPINCOUNT=2",
    "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=400|LOCATION.Y=400|NAME=INPUT|DESIGNATOR=1|PINLENGTH=20|ELECTRICAL=1|ORIENTATION=2|FONTID=3|HIDDEN=FALSE",
    "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=600|LOCATION.Y=400|NAME=OUTPUT|DESIGNATOR=2|PINLENGTH=20|ELECTRICAL=2|ORIENTATION=0|FONTID=3|HIDDEN=FALSE",
    "|RECORD=34|OWNERINDEX=1|OWNERPARTID=-1|NAME=Designator|TEXT=U1|LOCATION.X=450|LOCATION.Y=450|FONTID=1",
    "|RECORD=41|OWNERINDEX=1|OWNERPARTID=-1|NAME=Value|TEXT=Controller|LOCATION.X=450|LOCATION.Y=350|FONTID=2",
    "|RECORD=4|LOCATION.X=100|LOCATION.Y=700|TEXT=Ten point annotation|FONTID=1|COLOR=128",
    "|RECORD=27|LOCATIONCOUNT=2|X1=100|Y1=150|X2=900|Y2=150",
    "|RECORD=25|LOCATION.X=500|LOCATION.Y=150|TEXT=TWELVE_POINT_NET|FONTID=2|COLOR=128",
  ].join("\n"),
)

test("preserves Altium schematic font sizes in Circuit JSON units", async () => {
  const circuitJson = convertAltiumSchDocToCircuitJson(schematic)
  const texts = circuitJson.filter(
    (element): element is SchematicText => element.type === "schematic_text",
  )
  const ports = circuitJson.filter(
    (element): element is SchematicPort => element.type === "schematic_port",
  )
  const scale = getPageFitScale({ height: 800, width: 1000 })

  expect(
    texts.find((text) => text.text === "Ten point annotation")?.font_size,
  ).toBeCloseTo(10 * scale)
  expect(
    texts.find((text) => text.text === "TWELVE_POINT_NET")?.font_size,
  ).toBeCloseTo(12 * scale)
  expect(texts.find((text) => text.text === "U1")?.font_size).toBeCloseTo(
    10 * scale,
  )
  expect(
    texts.find((text) => text.text === "Controller")?.font_size,
  ).toBeCloseTo(12 * scale)
  expect(
    ports.every((port) => port.display_pin_label_font_size === 6 * scale),
  ).toBe(true)

  const altiumSvg = serializeAltiumSheetToSvg(schematic, {
    height: 600,
    title: "Altium font-size source",
    width: 800,
  })
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "Schematic font sizes",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
