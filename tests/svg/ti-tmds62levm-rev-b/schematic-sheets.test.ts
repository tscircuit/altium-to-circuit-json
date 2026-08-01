import { expect, test } from "bun:test"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import {
  type AnyCircuitElement,
  any_circuit_element,
  type SchematicComponent,
  type SchematicPort,
} from "circuit-json"
import {
  convertAltiumSchDocToCircuitJson,
  TSCIRCUIT_SCHEMATIC_UNIT_CONVENTIONS,
} from "../../../lib"
import {
  TI_TMDS62LEVM_FIXTURE_NAME,
  TI_TMDS62LEVM_SCHEMATIC_SHEET_NUMBERS,
} from "../../../scripts/references/reference-manifest"
import { findDetachedSymbolPortIds } from "../../helpers/find-detached-symbol-ports"
import { readReferenceBytes } from "../../helpers/read-reference"
import { renderImportedSchematicToSvg } from "../../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../../helpers/stack-svg-comparison"

for (const sheetNumber of TI_TMDS62LEVM_SCHEMATIC_SHEET_NUMBERS) {
  test(
    `TI TMDS62LEVM Rev. B schematic sheet ${sheetNumber}`,
    async () => {
      const filename = `${TI_TMDS62LEVM_FIXTURE_NAME}/${sheetNumber}.SchDoc`
      const source = await readReferenceBytes(filename)
      const document = parseAltiumSchDoc(source)
      const circuitJson = convertAltiumSchDocToCircuitJson(document, {
        sheetName: `TI TMDS62LEVM Rev. B — sheet ${sheetNumber}`,
      })

      expect(
        circuitJson.filter((element) => element.type === "schematic_sheet"),
      ).toHaveLength(1)
      expect(circuitJson.length).toBeGreaterThan(1)
      expect(
        circuitJson.every(
          (element) => any_circuit_element.safeParse(element).success,
        ),
      ).toBe(true)
      expect(findDetachedSymbolPortIds(circuitJson)).toEqual([])
      expectGenericBoxesToUseTscircuitPitch(circuitJson)

      const title = `TI TMDS62LEVM Rev. B schematic sheet ${sheetNumber}`
      const altiumSvg = serializeAltiumSheetToSvg(document, {
        height: 600,
        title: `${title} — altiumts source`,
        width: 800,
      })
      const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
      expect(circuitJsonSvg).toContain(
        'data-circuit-json-type="schematic_sheet"',
      )
      expect(circuitJsonSvg).not.toContain("Could not match ports")
      expect(circuitJsonSvg).not.toContain("Symbol not found")
      expect(circuitJsonSvg).not.toContain("NaN")
      const comparisonSvg = stackAltiumAndCircuitJsonSvgs(
        altiumSvg,
        circuitJsonSvg,
        title,
      )

      await expect(comparisonSvg).toMatchSvgSnapshot(
        import.meta.path,
        `sheet-${sheetNumber}`,
      )
    },
    { timeout: 45_000 },
  )
}

function expectGenericBoxesToUseTscircuitPitch(
  circuitJson: AnyCircuitElement[],
): void {
  const { pinPitch, portDistanceFromEdge } =
    TSCIRCUIT_SCHEMATIC_UNIT_CONVENTIONS.genericComponent
  const genericComponents = circuitJson.filter(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" && !element.symbol_name,
  )

  for (const component of genericComponents) {
    expect(component.pin_spacing).toBe(pinPitch)
    const ports = circuitJson.filter(
      (element): element is SchematicPort =>
        element.type === "schematic_port" &&
        element.schematic_component_id === component.schematic_component_id,
    )
    expect(
      ports.every(
        (port) => port.distance_from_component_edge === portDistanceFromEdge,
      ),
    ).toBe(true)

    for (const side of ["left", "right", "top", "bottom"] as const) {
      const sidePorts = ports
        .filter((port) => port.side_of_component === side)
        .sort((left, right) =>
          side === "left" || side === "right"
            ? left.center.y - right.center.y
            : left.center.x - right.center.x,
        )
      for (let index = 1; index < sidePorts.length; index++) {
        const previous = sidePorts[index - 1]
        const current = sidePorts[index]
        const spacing =
          side === "left" || side === "right"
            ? (current?.center.y ?? 0) - (previous?.center.y ?? 0)
            : (current?.center.x ?? 0) - (previous?.center.x ?? 0)
        expect(spacing).toBeCloseTo(pinPitch, 8)
      }
    }
  }
}
