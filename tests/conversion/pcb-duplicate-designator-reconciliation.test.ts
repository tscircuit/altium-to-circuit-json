import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, parseAltiumSchDoc } from "altiumts"
import {
  convertAltiumPcbDocToCircuitJson,
  convertAltiumProjectToCircuitJson,
} from "../../lib"

test.each(
  [
    {
      description: "an original suffixed name",
      designators: ["U1", "U1", "U1_1"],
      allocatedNames: ["U1", "U1_2", "U1_1"],
    },
    {
      description: "a mixed-case reserved name",
      designators: ["U1", "U1", "u1_1"],
      allocatedNames: ["U1", "U1_2", "u1_1"],
    },
    {
      description: "a mixed-case used name",
      designators: ["U1", "u1", "U1_1"],
      allocatedNames: ["U1", "u1_2", "U1_1"],
    },
    {
      description: "mixed-case names with surrounding whitespace",
      designators: [" U1 ", "u1", " u1_1 "],
      allocatedNames: ["U1", "u1_2", "u1_1"],
    },
  ].flatMap((designatorCase) =>
    ["component", "owned_text"].map((designatorSource) => ({
      ...designatorCase,
      designatorSource,
    })),
  ),
)(
  "preserves PCB identity for $description from $designatorSource",
  ({ designatorSource, designators, allocatedNames }) => {
    const pcbDocument = parseAltiumPcbDoc(
      [
        "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil",
        ...designators.flatMap((designator, componentIndex) => {
          const componentDesignator =
            designatorSource === "component"
              ? `|SOURCEDESIGNATOR=${designator}`
              : ""
          const xMils = 100 + componentIndex * 100
          return [
            `|RECORD=Component|ID=${componentIndex}|LAYER=TOP|X=${xMils}mil|Y=100mil${componentDesignator}`,
            `|RECORD=Text|COMPONENT=${componentIndex}|LAYER=TOPOVERLAY|X=${xMils}mil|Y=100mil|HEIGHT=30mil|WIDESTRING=${designator}|DESIGNATOR=TRUE`,
            `|RECORD=Pad|NAME=1|COMPONENT=${componentIndex}|LAYER=TOP|X=${xMils}mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE`,
          ]
        }),
      ].join("\n"),
    )
    const schematicDocument = parseAltiumSchDoc(
      [
        "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
        "|RECORD=1|LOCATION.X=20|LOCATION.Y=20|DESIGNATOR=U1_1|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
        "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=20|LOCATION.Y=20|PINLENGTH=10|ORIENTATION=0",
      ].join("\n"),
    )
    const projectCircuitJson = convertAltiumProjectToCircuitJson({
      pcb: { document: pcbDocument },
      schematics: [{ document: schematicDocument }],
    })
    const schematicComponent = projectCircuitJson.find(
      (element) => element.type === "schematic_component",
    )
    const pcbComponents = projectCircuitJson.filter(
      (element) => element.type === "pcb_component",
    )
    expect(schematicComponent).toBeDefined()
    expect(pcbComponents).toHaveLength(3)
    expect(
      new Set(pcbComponents.map((component) => component.source_component_id))
        .size,
    ).toBe(3)
    expect(pcbComponents[2]?.source_component_id).toBe(
      schematicComponent?.source_component_id,
    )
    expect(pcbComponents[1]?.source_component_id).not.toBe(
      schematicComponent?.source_component_id,
    )

    const sourceComponents = convertAltiumPcbDocToCircuitJson(
      pcbDocument,
    ).filter((element) => element.type === "source_component")
    expect(
      sourceComponents.map(({ name, display_name }) => ({
        name,
        display_name,
      })),
    ).toEqual(
      allocatedNames.map((name, componentIndex) => ({
        name,
        display_name: designators[componentIndex]?.trim(),
      })),
    )
  },
)
