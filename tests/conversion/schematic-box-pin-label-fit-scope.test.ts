import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test.each([
  { orientation: "horizontal", vertical: false },
  { orientation: "vertical", vertical: true },
])(
  "preserves noncolliding rows when fitting $orientation labels",
  ({ vertical }) => {
    const pinLabels = [
      { name: "BUFFERED_INPUT_SIGNAL", fontId: 1 },
      { name: "BUFFERED_OUTPUT_SIGNAL", fontId: 2 },
      { name: "CLK", fontId: 1 },
      { name: "EN", fontId: 1 },
      { name: "GND", fontId: 2 },
      { name: "VCC", fontId: 2 },
    ]
    const pins = pinLabels.map(({ name, fontId }, pinIndex) => {
      const opposite = pinIndex % 2 === 1
      const row = 80 + Math.floor(pinIndex / 2) * 20
      const edge = opposite ? 150 : 50
      const pinLocation = vertical
        ? `|Location.X=${row}|Location.Y=${edge}|PinConglomerate=${opposite ? 57 : 59}`
        : `|Location.X=${edge}|Location.Y=${row}|PinConglomerate=${opposite ? 56 : 58}`
      return `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Name=${name}|Designator=${pinIndex + 1}|PinLength=10|PINNAME_POSITIONCONGLOMERATE=16|NAME_CUSTOMFONTID=${fontId}${pinLocation}`
    })
    const source = [
      "|RECORD=31|CUSTOMX=250|CUSTOMY=250|SYSTEMFONT=1|SIZE1=10|FONTNAME1=Times New Roman|SIZE2=10|FONTNAME2=Arial",
      "|RECORD=1|LibReference=Signal_Buffer|Designator=U1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=100|Location.Y=100|CurrentPartId=1|AllPinCount=6",
      "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|Corner.X=150|Corner.Y=150",
      ...pins,
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
    expect(ports.map((port) => port.display_pin_label)).toEqual(
      pinLabels.map(({ name }) => name),
    )
    const fontSizes = ports.map((port) => port.display_pin_label_font_size)
    expect(fontSizes[0]).toBeGreaterThan(0)
    expect(fontSizes[0]).toBeLessThan(0.1)
    expect(fontSizes[1]).toBe(fontSizes[0])
    expect(fontSizes.slice(2)).toEqual([0.1, 0.1, 0.1, 0.1])
  },
)
