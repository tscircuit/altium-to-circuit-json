import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicNetLabel } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test("hierarchical ports use shared Altium connection geometry", () => {
  const document = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100",
      "|RECORD=18|LOCATION.X=0|LOCATION.Y=10|WIDTH=10|HEIGHT=4|IOTYPE=1|NAME=DIRECT_PIN",
      "|RECORD=2|LOCATION.X=0|LOCATION.Y=10|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=18|LOCATION.X=0|LOCATION.Y=30|WIDTH=10|HEIGHT=4|IOTYPE=1|NAME=WIRE_INTERIOR",
      "|RECORD=27|LOCATIONCOUNT=2|X1=5|Y1=30|X2=15|Y2=30",
      "|RECORD=18|LOCATION.X=30|LOCATION.Y=0|WIDTH=10|HEIGHT=4|STYLE=4|ORIENTATION=1|IOTYPE=2|NAME=VERTICAL",
      "|RECORD=27|LOCATIONCOUNT=2|X1=30|Y1=10|X2=30|Y2=20",
    ].join("\n"),
  )
  const labels = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    includeText: false,
    schematicUnitScale: 1,
  }).filter(
    (element): element is SchematicNetLabel =>
      element.type === "schematic_net_label",
  )

  expect(
    labels.map(({ anchor_position, anchor_side, text }) => ({
      anchor_position,
      anchor_side,
      text,
    })),
  ).toEqual([
    {
      anchor_position: { x: 10, y: 10 },
      anchor_side: "right",
      text: "DIRECT_PIN",
    },
    {
      anchor_position: { x: 10, y: 30 },
      anchor_side: "right",
      text: "WIRE_INTERIOR",
    },
    {
      anchor_position: { x: 30, y: 10 },
      anchor_side: "top",
      text: "VERTICAL",
    },
  ])
})
