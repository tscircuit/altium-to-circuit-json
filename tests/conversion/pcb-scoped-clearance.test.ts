import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("imports net classes, layer scopes and priorities without flattening clearance", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|LAYER_V8_0NAME=Layer 1|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=Layer 2|LAYER_V8_1LAYERID=16777218|LAYER_V8_2NAME=Layer 3|LAYER_V8_2LAYERID=16777219|LAYER_V8_3NAME=Layer 4|LAYER_V8_3LAYERID=16842751",
      "|RECORD=Net|NAME=EARTH",
      "|RECORD=Net|NAME=HV_A",
      "|RECORD=Net|NAME=HV_B",
      "|RECORD=Class|NAME=HV|KIND=0|M0=HV_A|M1=HV_B",
      "|RECORD=Rule|NAME=EARTH outer|RULEKIND=Clearance|ENABLED=TRUE|PRIORITY=1|SCOPE1EXPRESSION=(OnLayer('Layer 1') Or OnLayer('Layer 4')) And InNet('EARTH')|SCOPE2EXPRESSION=All|GAP=162.9921mil",
      "|RECORD=Rule|NAME=EARTH inner|RULEKIND=Clearance|ENABLED=TRUE|PRIORITY=2|SCOPE1EXPRESSION=InNet('EARTH')|SCOPE2EXPRESSION=All|GAP=62.9921mil",
      "|RECORD=Rule|NAME=HV|RULEKIND=Clearance|ENABLED=TRUE|PRIORITY=3|SCOPE1EXPRESSION=InNetClass('HV')|SCOPE2EXPRESSION=Not InNetClass('HV') And InAnyNet|GAP=60mil",
      "|RECORD=Rule|NAME=Unknown|RULEKIND=Clearance|ENABLED=FALSE|PRIORITY=4|SCOPE1EXPRESSION=InRoom('HV')|SCOPE2EXPRESSION=All|GAP=10mil",
    ].join("\n"),
  )
  const convert = () =>
    convertAltiumPcbDocToCircuitJson(document, { idPrefix: "test" }).find(
      (element) => element.type === "pcb_board",
    )!
  const board = convert()
  const rules = board.clearance_rules!
  expect(rules).toHaveLength(4)
  expect(rules[0]!.clearance).toBeCloseTo(4.14, 5)
  expect(rules[1]!.clearance).toBeCloseTo(1.6, 5)
  expect(rules[0]!.scope1).toEqual({
    type: "and",
    scopes: [
      {
        type: "or",
        scopes: [
          { type: "layer", layers: ["top"] },
          { type: "layer", layers: ["bottom"] },
        ],
      },
      { type: "net", net_ids: ["test_source_net_altium_pcb_0"] },
    ],
  })
  expect(rules[2]!.scope1).toEqual({
    type: "net",
    net_ids: ["test_source_net_altium_pcb_1", "test_source_net_altium_pcb_2"],
  })
  expect(rules[3]!.scope1).toEqual({
    type: "unsupported",
    expression: "InRoom('HV')",
  })
  expect(rules[3]!.enabled).toBe(false)
  expect(any_circuit_element.parse(board)).toEqual(board)
  document.rules[0]!.set("GAP", "1000mil")
  document.rules[0]!.set("GENERICCLEARANCE", "1000mil")
  expect(convert().clearance_rules![0]!.clearance).toBe(25.4)
})
