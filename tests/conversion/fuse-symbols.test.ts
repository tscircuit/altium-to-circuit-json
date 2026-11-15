import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { convertSingleSchematicComponent } from "../helpers/convert-single-schematic-component"

test("uses horizontal fuse symbol for horizontally-aligned fuse", () => {
  const elements = convertSingleSchematicComponent({
    comment: "500mA",
    designator: "F1",
    displayText: "500mA",
    libraryReference: "FUSE",
  })
  const component = elements.find(
    (element) => element.type === "schematic_component",
  )
  expect(component?.symbol_name).toBe("fuse_horz")
  expect(component?.symbol_display_value).toBe("500mA")
  expect(
    elements.filter(
      (element) =>
        element.type === "schematic_port" &&
        element.schematic_component_id === component?.schematic_component_id,
    ),
  ).toHaveLength(2)
})

test("uses vertical fuse symbol for vertically-aligned fuse", () => {
  const source = [
    "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
    "|RECORD=1|LibReference=FUSE|Designator=F1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=50|Location.Y=50|Orientation=0|CurrentPartId=1|AllPinCount=2",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=40|Name=1|Designator=1|PinLength=10|Electrical=3|Orientation=3|Hidden=False",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=60|Name=2|Designator=2|PinLength=10|Electrical=3|Orientation=1|Hidden=False",
    "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Value|Text=1A",
    "|RECORD=41|OwnerIndex=1|OwnerPartId=-1|Name=Comment|Text=1A",
  ].join("\n")

  const elements = convertAltiumSchDocToCircuitJson(parseAltiumSchDoc(source), {
    centerOnSchematicSheet: false,
    schematicUnitScale: 0.1,
  })
  const component = elements.find(
    (element) => element.type === "schematic_component",
  )
  expect(component?.symbol_name).toBe("fuse_vert")
  expect(
    elements.filter(
      (element) =>
        element.type === "schematic_port" &&
        element.schematic_component_id === component?.schematic_component_id,
    ),
  ).toHaveLength(2)
})

test("classifies ZD and TVS designator prefixes as diodes", () => {
  const zener = convertSingleSchematicComponent({
    comment: "5.1V",
    designator: "ZD1",
    displayText: "5.1V",
    libraryReference: "BZX84C5V1",
  })
  const tvs = convertSingleSchematicComponent({
    comment: "ESD",
    designator: "TVS1",
    displayText: "5V",
    libraryReference: "PESD5V0",
  })
  expect(
    zener.find((element) => element.type === "schematic_component")
      ?.symbol_name,
  ).toMatch(/^diode_/u)
  expect(
    tvs.find((element) => element.type === "schematic_component")?.symbol_name,
  ).toMatch(/^diode_/u)
})
