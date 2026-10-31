import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("preserves each side of via tenting with the current Circuit JSON schema", () => {
  for (const top of [true, false]) {
    for (const bottom of [true, false]) {
      const document = parseAltiumPcbDoc(
        `|RECORD=Board\n|RECORD=Via|X=100mil|Y=100mil|DIAMETER=20mil|HOLESIZE=10mil|STARTLAYER=TOP|ENDLAYER=BOTTOM|TENTINGTOP=${top ? "TRUE" : "FALSE"}|TENTINGBOTTOM=${bottom ? "TRUE" : "FALSE"}`,
      )
      const via = convertAltiumPcbDocToCircuitJson(document).find(
        (e) => e.type === "pcb_via",
      )
      if (!via) throw new Error("Expected a via")
      expect(via).toMatchObject({
        tented_on_top: top,
        tented_on_bottom: bottom,
      })
      expect(any_circuit_element.parse(via)).toEqual(via)
    }
  }
})
