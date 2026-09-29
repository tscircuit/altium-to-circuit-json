import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicPath, SchematicText } from "circuit-json"
import { createSchematicConversionContext } from "../../lib/schematic/document"
import { renderHierarchicalPort } from "../../lib/schematic/rendering"

test("vertical hierarchical port paths follow the shared Altium direction", () => {
  const document = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100",
      "|RECORD=18|LOCATION.X=30|LOCATION.Y=0|WIDTH=10|HEIGHT=4|STYLE=4|ORIENTATION=1|IOTYPE=2|NAME=VERTICAL",
      "|RECORD=27|LOCATIONCOUNT=2|X1=30|Y1=10|X2=30|Y2=20",
    ].join("\n"),
  )
  const record = document.records[1]
  if (!record) throw new Error("Expected vertical hierarchical port")
  const context = createSchematicConversionContext({
    document,
    options: { centerOnSchematicSheet: false, schematicUnitScale: 1 },
  })
  const [path, text] = renderHierarchicalPort({
    color: "#ff0000",
    context,
    index: 1,
    options: { includeText: true },
    record,
  }) as [SchematicPath, SchematicText]
  const expectedPoints = [
    { x: 28, y: 0 },
    { x: 28, y: 7.8 },
    { x: 30, y: 10 },
    { x: 32, y: 7.8 },
    { x: 32, y: 0 },
  ]

  expect(path.points).toHaveLength(expectedPoints.length)
  for (const [index, expectedPoint] of expectedPoints.entries()) {
    expect(path.points[index]?.x).toBeCloseTo(expectedPoint.x)
    expect(path.points[index]?.y).toBeCloseTo(expectedPoint.y)
  }
  expect(text).toMatchObject({
    position: { x: 30, y: 5 },
    rotation: 90,
    text: "VERTICAL",
  })
})
