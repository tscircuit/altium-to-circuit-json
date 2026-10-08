import { expect, test } from "bun:test"
import { AltiumComponentBodyRecord, parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent, PcbComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { toMillimeterPoint } from "../../lib/pcb/geometry"
import { readReferenceBytes } from "../helpers/read-reference"

const PCB_FILENAME = "ti-dp83825evm.PcbDoc"

test("uses the component position for a corrupt Altium CAD model anchor", async () => {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(PCB_FILENAME),
  )
  const bodyIndex = document.componentBodies.findIndex((body) => {
    if (!(body instanceof AltiumComponentBodyRecord)) return false
    return (
      document.getComponentForRecord(body)?.designator === "J9" &&
      document.getEmbeddedModelForComponentBody(body) !== undefined
    )
  })
  const body = document.componentBodies[bodyIndex]
  if (!(body instanceof AltiumComponentBodyRecord)) {
    throw new Error("DP83825EVM J9 has no embedded CAD model body")
  }

  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${embeddedModel.index}.step`,
  })
  const cadComponent = circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.cad_component_id === `cad_component_altium_${bodyIndex}`,
  )
  const pcbComponent = circuitJson.find(
    (element): element is PcbComponent =>
      element.type === "pcb_component" &&
      element.pcb_component_id === cadComponent?.pcb_component_id,
  )
  const rawModelPosition = body.modelPosition

  expect(rawModelPosition).toBeDefined()
  expect(rawModelPosition && toMillimeterPoint(rawModelPosition)).toEqual({
    x: 341.21551772,
    y: 445.19678804,
  })
  expect(cadComponent?.position.x).toBeCloseTo(pcbComponent?.center.x ?? 0, 8)
  expect(cadComponent?.position.y).toBeCloseTo(pcbComponent?.center.y ?? 0, 8)
})
