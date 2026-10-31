import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("PMP22650 native rules retain EARTH gaps and nonempty HV classes", async () => {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(TI_POWER_REFERENCE_PCB_FILENAMES.pmp22650),
  )
  const convert = () =>
    convertAltiumPcbDocToCircuitJson(document).find(
      (element) => element.type === "pcb_board",
    )!
  const rules = convert().clearance_rules!
  expect(rules.filter((rule) => rule.enabled)).toHaveLength(10)
  expect(
    rules.find((rule) => rule.name === "Clearance_Earth_Outside")!.clearance,
  ).toBeCloseTo(4.14, 5)
  expect(
    rules.find((rule) => rule.name === "Clearance_Earth_Inside")!.clearance,
  ).toBeCloseTo(1.6, 5)
  for (const [name, count] of [
    ["Clearance_HV_Inside", 25],
    ["Clearance_HV_SW_Inside", 81],
  ] as const) {
    const scope = rules.find((rule) => rule.name === name)!.scope1
    expect(scope.type).toBe("net")
    if (scope.type !== "net")
      throw new Error("Expected expanded native net class")
    expect(scope.net_ids).toHaveLength(count)
  }
  const rule = document.rules.find(
    (rule) => rule.name === "Clearance_Earth_Outside",
  )!
  rule.set("GAP", "1000mil")
  rule.set("GENERICCLEARANCE", "1000mil")
  expect(
    convert().clearance_rules!.find(
      (rule) => rule.name === "Clearance_Earth_Outside",
    )!.clearance,
  ).toBe(25.4)
})
