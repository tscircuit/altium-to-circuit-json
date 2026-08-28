import { expect, test } from "bun:test"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { getAltiumSchematicColorOverrides } from "../helpers/altium-schematic-color-overrides"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const schematic = parseAltiumSchDoc(
  [
    "|RECORD=31|CUSTOMX=600|CUSTOMY=400|FONTIDCOUNT=1|SIZE1=9|FONTNAME1=Arial",
    "|RECORD=1|LIBREFERENCE=CustomIC|DESIGNATOR=U1|PARTCOUNT=1|DISPLAYMODECOUNT=1|INDEXINSHEET=1|OWNERPARTID=-1|LOCATION.X=300|LOCATION.Y=220|CURRENTPARTID=1|ALLPINCOUNT=2",
    "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=200|LOCATION.Y=220|NAME=INPUT|DESIGNATOR=1|PINLENGTH=20|ELECTRICAL=1|ORIENTATION=2|COLOR=136|FONTID=1|HIDDEN=FALSE",
    "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=400|LOCATION.Y=220|NAME=OUTPUT|DESIGNATOR=2|PINLENGTH=20|ELECTRICAL=2|ORIENTATION=0|COLOR=136|FONTID=1|HIDDEN=FALSE",
    "|RECORD=34|OWNERINDEX=1|OWNERPARTID=-1|NAME=Designator|TEXT=U1|LOCATION.X=250|LOCATION.Y=280|COLOR=8388608|FONTID=1",
    "|RECORD=41|OWNERINDEX=1|OWNERPARTID=-1|NAME=Value|TEXT=Controller|LOCATION.X=250|LOCATION.Y=160|COLOR=255|FONTID=1",
    "|RECORD=27|LOCATIONCOUNT=2|X1=100|Y1=80|X2=500|Y2=80|COLOR=34816",
    "|RECORD=25|LOCATION.X=300|LOCATION.Y=80|TEXT=BLUE_NET_LABEL|FONTID=1|COLOR=16711680",
  ].join("\n"),
)

test("preserves Altium colors for semantic schematic text", async () => {
  const circuitJson = convertAltiumSchDocToCircuitJson(schematic)
  const texts = circuitJson.filter(
    (element): element is SchematicText => element.type === "schematic_text",
  )

  expect(texts.find((text) => text.text === "U1")?.color).toBe("#000080")
  expect(texts.find((text) => text.text === "Controller")?.color).toBe(
    "#ff0000",
  )
  expect(texts.find((text) => text.text === "BLUE_NET_LABEL")?.color).toBe(
    "#0000ff",
  )

  const altiumSvg = serializeAltiumSheetToSvg(schematic, {
    height: 600,
    title: "Altium source colors",
    width: 800,
  })
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson, {
    colorOverrides: {
      schematic: getAltiumSchematicColorOverrides({ document: schematic }),
    },
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "Schematic source colors",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
