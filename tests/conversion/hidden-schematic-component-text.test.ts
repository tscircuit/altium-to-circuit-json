import { expect, test } from "bun:test"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const source = [
  "|RECORD=31|CUSTOMX=180|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
  "|RECORD=1|LibReference=HiddenBox|Designator=U_HIDDEN|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=50|Location.Y=50|Orientation=0|CurrentPartId=1|AllPinCount=2",
  "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=30|Location.Y=50|Name=IN|Designator=1|PinLength=10|Electrical=3|Orientation=2|Hidden=False",
  "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=70|Location.Y=50|Name=OUT|Designator=2|PinLength=10|Electrical=3|Orientation=0|Hidden=False",
  "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=60|Corner.X=60|Corner.Y=40|IsSolid=True",
  "|RECORD=34|OwnerIndex=1|OwnerPartId=-1|Name=Designator|Text=U_HIDDEN|Location.X=40|Location.Y=65|IsHidden=True",
  "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Value|Text=hidden-value|Location.X=40|Location.Y=35|IsHidden=True",
  "|RECORD=1|LibReference=VisibleBox|Designator=U_VISIBLE|PartCount=1|DisplayModeCount=1|IndexInSheet=2|OwnerPartId=-1|Location.X=130|Location.Y=50|Orientation=0|CurrentPartId=1|AllPinCount=2",
  "|RECORD=2|OwnerIndex=7|OwnerPartId=1|Location.X=110|Location.Y=50|Name=IN|Designator=1|PinLength=10|Electrical=3|Orientation=2|Hidden=False",
  "|RECORD=2|OwnerIndex=7|OwnerPartId=1|Location.X=150|Location.Y=50|Name=OUT|Designator=2|PinLength=10|Electrical=3|Orientation=0|Hidden=False",
  "|RECORD=14|OwnerIndex=7|OwnerPartId=1|Location.X=120|Location.Y=60|Corner.X=140|Corner.Y=40|IsSolid=True",
  "|RECORD=34|OwnerIndex=7|OwnerPartId=-1|Name=Designator|Text=U_VISIBLE|Location.X=120|Location.Y=65|IsHidden=False",
  "|RECORD=41|OwnerIndex=7|OwnerPartId=-1|Name=Value|Text=visible-value|Location.X=120|Location.Y=35|IsHidden=False",
].join("\n")

const document = parseAltiumSchDoc(source)

function getComponentText(includeHidden = false): SchematicText[] {
  return convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    includeHidden,
    schematicUnitScale: 0.1,
  }).filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_text_id.startsWith("schematic_component_"),
  )
}

test("respects hidden schematic component designators and values", async () => {
  expect(getComponentText().map((text) => text.text)).toEqual([
    "U_VISIBLE",
    "visible-value",
  ])
  expect(getComponentText(true).map((text) => text.text)).toEqual([
    "U_HIDDEN",
    "hidden-value",
    "U_VISIBLE",
    "visible-value",
  ])

  const circuitJson = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    schematicUnitScale: 0.1,
  })
  const altiumSvg = serializeAltiumSheetToSvg(document, {
    height: 600,
    title: "Altium hidden component text source",
    width: 800,
  })
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "Hidden schematic component text",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
