import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"

test.failing.each([0, 1, 2, 3])(
  "preserves an interior label attachment at orientation %i",
  (orientation) => {
    const vertical = orientation % 2 === 1
    const document = parseAltiumSchDoc(
      [
        "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
        vertical
          ? "|RECORD=27|LOCATIONCOUNT=2|X1=50|Y1=10|X2=50|Y2=90"
          : "|RECORD=27|LOCATIONCOUNT=2|X1=10|Y1=50|X2=90|Y2=50",
        `|RECORD=25|LOCATION.X=${vertical ? 50 : 40}|LOCATION.Y=${vertical ? 40 : 50}|TEXT=SIGNAL|ORIENTATION=${orientation}|FONTID=1`,
      ].join("\n"),
    )
    const label = convertAltiumSchDocToCircuitJson(document, {
      centerOnSchematicSheet: false,
      schematicUnitScale: 0.1,
    }).find(
      (element): element is SchematicText =>
        element.type === "schematic_text" && element.text === "SIGNAL",
    )!

    expect(label.position).toEqual(vertical ? { x: 5, y: 4 } : { x: 4, y: 5 })
    expect(label.anchor).toBe(orientation < 2 ? "bottom_left" : "bottom_right")
    expect(label.rotation).toBe(vertical ? -90 : 0)
    expect(label.source_trace_id).toBeDefined()
  },
)

test.failing("preserves the six original DRV8307EVM HU+/UH+ attachment points", async () => {
  const document = parseAltiumSchDoc(
    await readReferenceBytes("ti-drv8307evm.SchDoc"),
  )
  const labels = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    schematicUnitScale: 0.1,
  }).filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      ["HU+", "UH+"].includes(element.text),
  )

  // These are the locations stored by the six RECORD=25 labels in TI's file.
  expect(labels.map((label) => label.position)).toEqual([
    { x: 110, y: 53.5 },
    { x: 70.5, y: 114 },
    { x: 96, y: 57.5 },
    { x: 95, y: 71 },
    { x: 73.5, y: 72.5 },
    { x: 73, y: 45 },
  ])
  expect(labels.map((label) => label.text)).toEqual([
    "HU+",
    "HU+",
    "HU+",
    "UH+",
    "HU+",
    "HU+",
  ])
  expect(new Set(labels.map((label) => label.source_trace_id))).toEqual(
    new Set(["source_trace_altium_18"]),
  )
})

test("snapshots the original DRV8307EVM schematic label placement", async () => {
  const document = parseAltiumSchDoc(
    await readReferenceBytes("ti-drv8307evm.SchDoc"),
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  await expect(renderImportedSchematicToSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
