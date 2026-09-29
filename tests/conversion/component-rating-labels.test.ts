import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test("preserves component rating text and visibility without duplicate labels", () => {
  for (const variant of ["native", "box", "pinless", "gate"] as const) {
    const source = [
      "|RECORD=31|CUSTOMX=200|CUSTOMY=120|SIZE1=9|SIZE2=6|FONTNAME1=Arial|FONTNAME2=Arial",
      `|RECORD=1|LibReference=${variant === "native" ? "Capacitor" : "CustomPart"}|Designator=${variant === "native" ? "C1" : "U1"}|CurrentPartId=1|PartCount=2|Location.X=50|Location.Y=50`,
      ...(variant === "pinless"
        ? []
        : [
            `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=30|Location.Y=50|Name=${variant === "gate" ? "A" : "1"}|Designator=1|PinLength=10|Orientation=2`,
            `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=70|Location.Y=50|Name=${variant === "gate" ? "Y" : "2"}|Designator=2|PinLength=10|Orientation=0`,
          ]),
      ...(variant === "gate"
        ? [
            "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=30|Location.Y=40|Name=B|Designator=3|PinLength=10|Orientation=2",
            "|RECORD=12|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|Radius=10|StartAngle=270|EndAngle=90",
          ]
        : [
            "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=60|Corner.X=60|Corner.Y=40",
          ]),
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Value|Text=1uF|Location.X=75|Location.Y=65",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Voltage|Text=25V|Location.X=70|Location.Y=35|FontID=2|Color=255|Orientation=1|Justification=8",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=wAtTaGe|Text=1W|Location.X=80|Location.Y=35|Orientation=2|Justification=0",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Tolerance|Text=5%|Location.X=90|Location.Y=35|Orientation=3|Justification=0",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Voltage|Text=hidden-rating|Location.X=70|Location.Y=30|IsHidden=True",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=2|Name=Voltage|Text=inactive-part|Location.X=70|Location.Y=25",
      "|RECORD=41|OwnerIndex=1|OwnerPartId=1|OwnerPartDisplayMode=1|Name=Voltage|Text=inactive-mode|Location.X=70|Location.Y=20",
    ].join("\n")
    const document = parseAltiumSchDoc(source)
    const options = { centerOnSchematicSheet: false, schematicUnitScale: 0.125 }
    const circuitJson = convertAltiumSchDocToCircuitJson(document, options)
    const texts = circuitJson.filter(
      (element) => element.type === "schematic_text",
    )
    for (const label of ["25V", "1W", "5%"]) {
      expect(
        texts.filter((element) => element.text === label),
        variant,
      ).toHaveLength(1)
    }
    const voltage = texts.find((element) => element.text === "25V")
    expect(voltage).toMatchObject({
      position: { x: 8.75, y: 4.375 },
      font_size: 0.75,
      color: "#ff0000",
      rotation: 90,
      anchor: "top_right",
    })
    expect(texts.find((element) => element.text === "1W")).toMatchObject({
      rotation: 0,
      anchor: "bottom_right",
    })
    expect(texts.find((element) => element.text === "5%")).toMatchObject({
      rotation: 90,
      anchor: "bottom_right",
    })
    expect(
      texts.some((element) =>
        ["hidden-rating", "inactive-part", "inactive-mode"].includes(
          element.text,
        ),
      ),
    ).toBe(false)
    expect(texts.filter((element) => element.text === "1uF")).toHaveLength(1)
    expect(
      circuitJson.every(
        (element) => any_circuit_element.safeParse(element).success,
      ),
    ).toBe(true)
    const component = circuitJson.find(
      (element) => element.type === "schematic_component",
    )
    if (variant === "native" || variant === "box") {
      expect(component?.symbol_display_value).toBe("")
      expect(texts.find((element) => element.text === "1uF")).toMatchObject({
        position: { x: 9.375, y: 8.125 },
      })
    }
    expect(
      circuitJson.find((element) => element.type === "source_component"),
    ).toHaveProperty("display_value", "1uF")
    if (variant === "native")
      expect(component?.symbol_name).toStartWith("capacitor")
    if (variant === "gate" || variant === "pinless")
      expect(component?.is_box_with_pins).toBe(false)
    const withHidden = convertAltiumSchDocToCircuitJson(document, {
      ...options,
      includeHidden: true,
    }).filter((element) => element.type === "schematic_text")
    expect(
      withHidden.filter((element) => element.text === "hidden-rating"),
    ).toHaveLength(1)
    expect(
      withHidden.some((element) =>
        ["inactive-part", "inactive-mode"].includes(element.text),
      ),
    ).toBe(false)
    const withoutText = convertAltiumSchDocToCircuitJson(document, {
      ...options,
      includeText: false,
    })
    expect(
      withoutText.filter(
        (element) =>
          element.type === "schematic_text" &&
          ["25V", "1W", "5%", "hidden-rating"].includes(element.text),
      ),
    ).toEqual([])
    expect(
      withoutText.filter(
        (element) =>
          element.type.startsWith("source_") ||
          element.type === "schematic_port" ||
          element.type === "schematic_trace",
      ),
    ).toEqual(
      circuitJson.filter(
        (element) =>
          element.type.startsWith("source_") ||
          element.type === "schematic_port" ||
          element.type === "schematic_trace",
      ),
    )
    if (variant === "native" || variant === "box") {
      for (const hiddenOnly of [
        source.replace(/\|Text=(25V|1W|5%)\|/g, "|IsHidden=True|Text=$1|"),
        source.replace(
          "|Name=Value|Text=1uF|Location.X=75|Location.Y=65",
          "|Name=Value|Text=1uF",
        ),
      ]) {
        const converted = convertAltiumSchDocToCircuitJson(
          parseAltiumSchDoc(hiddenOnly),
          options,
        )
        expect(
          converted.find((element) => element.type === "schematic_component")
            ?.symbol_display_value,
        ).toBe("1uF")
      }
    }
  }
})
