import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test.each([
  {
    title: "horizontal labels",
    vertical: false,
    staggered: false,
    fontFamily: "Times New Roman",
    fitted: true,
  },
  {
    title: "vertical labels",
    vertical: true,
    staggered: false,
    fontFamily: "Times New Roman",
    fitted: true,
  },
  {
    title: "staggered labels",
    vertical: false,
    staggered: true,
    fontFamily: "Times New Roman",
    fitted: false,
  },
  {
    title: "native sans-serif labels",
    vertical: false,
    staggered: false,
    fontFamily: "Arial",
    fitted: false,
  },
  {
    title: "narrow sans-serif labels",
    vertical: false,
    staggered: false,
    fontFamily: "Arial Narrow",
    fitted: true,
  },
  {
    title: "unmeasured Unicode labels",
    vertical: false,
    staggered: false,
    fontFamily: "Times New Roman",
    firstLabel: "BUFFERED_μV_INPUT",
    secondLabel: "BUFFERED_μV_OUTPUT",
    fitted: false,
  },
])(
  "fits substituted $title only when they collide",
  ({
    vertical,
    staggered,
    fontFamily,
    fitted,
    firstLabel = "BUFFERED_INPUT_SIGNAL",
    secondLabel = "BUFFERED_OUTPUT_SIGNAL",
  }) => {
    const firstPin = vertical
      ? "|Location.X=100|Location.Y=50|PinConglomerate=59"
      : "|Location.X=50|Location.Y=100|PinConglomerate=58"
    const secondPinY = staggered ? 120 : 100
    const secondPin = vertical
      ? "|Location.X=100|Location.Y=150|PinConglomerate=57"
      : `|Location.X=150|Location.Y=${secondPinY}|PinConglomerate=56`
    const source = [
      `|RECORD=31|CUSTOMX=250|CUSTOMY=250|SYSTEMFONT=1|SIZE1=10|FONTNAME1=${fontFamily}`,
      "|RECORD=1|LibReference=Signal_Buffer|Designator=U1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=100|Location.Y=100|CurrentPartId=1|AllPinCount=2",
      "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|Corner.X=150|Corner.Y=150",
      `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Name=${firstLabel}|Designator=1|PinLength=10${firstPin}`,
      `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Name=${secondLabel}|Designator=2|PinLength=10${secondPin}`,
    ].join("\n")
    const circuitJson = convertAltiumSchDocToCircuitJson(
      parseAltiumSchDoc(source),
      {
        centerOnSchematicSheet: false,
        schematicUnitScale: 0.01,
      },
    )
    const ports = circuitJson.filter(
      (element) => element.type === "schematic_port",
    )
    expect(ports.map((port) => port.display_pin_label)).toEqual([
      firstLabel,
      secondLabel,
    ])
    const [firstFontSize, secondFontSize] = ports.map(
      (port) => port.display_pin_label_font_size,
    )
    if (firstFontSize === undefined || secondFontSize === undefined)
      throw new Error("Missing pin label font size")
    expect(firstFontSize).toBeGreaterThan(0)
    expect(secondFontSize).toBe(firstFontSize)
    if (fitted) {
      expect(firstFontSize).toBeLessThan(0.1)
    } else {
      expect(firstFontSize).toBe(0.1)
    }
  },
)
