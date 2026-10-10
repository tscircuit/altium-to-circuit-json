import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { getCapacitorPolarityMarks } from "../../lib/schematic/components/getCapacitorPolarityMarks"

test("segmented plus marks preserve the curved capacitor's native polarity and ports", () => {
  const body = [
    "|RECORD=31",
    "|RECORD=1|LibReference=ManufacturerPart|Designator=C1|CurrentPartId=1|Location.X=50|Location.Y=50",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=60|Name=2|Designator=2|PinLength=10|Orientation=1",
    "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=40|Name=1|Designator=1|PinLength=10|Orientation=3",
    "|RECORD=6|OwnerIndex=1|OwnerPartId=1|LocationCount=4|X1=50|Y1=60|X2=50|Y2=50|X3=60|Y3=50|X4=40|Y4=50",
    "|RECORD=6|OwnerIndex=1|OwnerPartId=1|LocationCount=2|X1=50|Y1=40|X2=50|Y2=46",
    "|RECORD=12|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=30|Radius=16|StartAngle=50|EndAngle=130",
  ]
  const drawings = [
    {
      kind: "6",
      strokes: [
        [
          [51, 58],
          [55, 58],
        ],
        [
          [53, 56],
          [53, 60],
        ],
      ],
    },
    {
      kind: "6",
      strokes: [
        [
          [51, 58],
          [53, 58],
          [55, 58],
        ],
        [
          [53, 56],
          [53, 58],
          [53, 60],
        ],
      ],
    },
    {
      kind: "13",
      strokes: [
        [
          [53, 58],
          [55, 58],
        ],
        [
          [53, 58],
          [53, 56],
        ],
        [
          [53, 58],
          [51, 58],
        ],
        [
          [53, 60],
          [53, 58],
        ],
      ],
    },
    {
      kind: "6",
      strokes: [
        [
          [55, 58],
          [54, 58],
        ],
        [
          [51, 58],
          [52, 58],
        ],
        [
          [52, 58],
          [54, 58],
        ],
        [
          [53, 58],
          [54, 58],
        ],
        [
          [53, 60],
          [53, 58],
          [53, 56],
        ],
      ],
    },
  ] as const
  for (const includeText of [true, false]) {
    const outputs = drawings.map(({ kind, strokes }) => {
      const records = strokes.map((points) => {
        const start = points[0],
          end = points[points.length - 1]!
        const geometry =
          kind === "13"
            ? `Location.X=${start[0]}|Location.Y=${start[1]}|Corner.X=${end[0]}|Corner.Y=${end[1]}`
            : `LocationCount=${points.length}|${points.map(([x, y], index) => `X${index + 1}=${x}|Y${index + 1}=${y}`).join("|")}`
        return `|RECORD=${kind}|OwnerIndex=1|OwnerPartId=1|${geometry}`
      })
      const document = parseAltiumSchDoc([...body, ...records].join("\n"))
      expect(getCapacitorPolarityMarks(document.records)).toEqual([
        { point: { x: 53, y: 58 }, graphic: true },
      ])
      const elements = convertAltiumSchDocToCircuitJson(document, {
        schematicUnitScale: 1,
        centerOnSchematicSheet: false,
        includeText,
      })
      expect(
        elements.find((e) => e.type === "schematic_component")?.symbol_name,
      ).toBe("capacitor_polarized_down")
      const ports = elements.filter((e) => e.type === "schematic_port")
      expect(ports.find((p) => p.pin_number === 2)?.center).toEqual({
        x: 50,
        y: 50.3,
      })
      expect(ports.find((p) => p.pin_number === 1)?.center).toEqual({
        x: 50,
        y: 49.7,
      })
      return elements
    })
    for (const output of outputs) expect(outputs[0]).toEqual(output)
  }
})
