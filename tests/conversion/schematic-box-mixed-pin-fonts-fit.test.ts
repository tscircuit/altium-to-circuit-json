import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test("fits a substituted opposite font while preserving custom size ratios", () => {
  const source = [
    "|RECORD=31|CUSTOMX=250|CUSTOMY=250|SYSTEMFONT=1|SIZE1=10|FONTNAME1=Arial|SIZE2=18|FONTNAME2=Times New Roman",
    "|RECORD=1|LibReference=Signal_Buffer|Designator=U1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=100|Location.Y=100|CurrentPartId=1|AllPinCount=2",
    "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|Corner.X=150|Corner.Y=150",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Name=BUFFERED_INPUT_SIGNAL|Designator=1|PinLength=10|Location.X=50|Location.Y=100|PinConglomerate=58|PINNAME_POSITIONCONGLOMERATE=0|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Name=BUFFERED_OUTPUT_SIGNAL|Designator=2|PinLength=10|Location.X=150|Location.Y=100|PinConglomerate=56|PINNAME_POSITIONCONGLOMERATE=16|NAME_CUSTOMFONTID=2|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
  ].join("\n")
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
    {
      centerOnSchematicSheet: false,
      schematicUnitScale: 0.01,
    },
  )
  const [firstPort, secondPort] = circuitJson.filter(
    (element) => element.type === "schematic_port",
  )
  const firstFontSize = firstPort?.display_pin_label_font_size
  const secondFontSize = secondPort?.display_pin_label_font_size
  if (firstFontSize === undefined || secondFontSize === undefined)
    throw new Error("Missing pin label font size")
  expect(firstFontSize).toBeGreaterThan(0)
  expect(firstFontSize).toBeLessThan(0.1)
  expect(secondFontSize / firstFontSize).toBeCloseTo(1.8)
})
