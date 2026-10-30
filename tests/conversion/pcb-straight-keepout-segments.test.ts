import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const board =
  "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil|LAYER_V8_0NAME=Top Layer|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=MidLayer1|LAYER_V8_1LAYERID=16777218|LAYER_V8_2NAME=MidLayer2|LAYER_V8_2LAYERID=16777219|LAYER_V8_3NAME=Bottom Layer|LAYER_V8_3LAYERID=16842751"

test("preserves straight keepout geometry and layer scope without producing copper", () => {
  for (const example of [
    {
      layer: "KEEPOUT",
      flag: "",
      x2: 200,
      y2: 100,
      width: 8,
      layers: ["top", "inner1", "inner2", "bottom"],
    },
    {
      layer: "KEEPOUT",
      flag: "|KEEPOUT=TRUE",
      x2: 100,
      y2: 200,
      width: 12,
      layers: ["top", "inner1", "inner2", "bottom"],
    },
    {
      layer: "TOP",
      flag: "|KEEPOUT=TRUE",
      x2: 200,
      y2: 200,
      width: 10,
      layers: ["top"],
    },
    {
      layer: "MID-LAYER1",
      flag: "|KEEPOUT=TRUE",
      x2: 200,
      y2: 100,
      width: 6,
      layers: ["inner1"],
    },
    {
      layer: "BOTTOM",
      flag: "|KEEPOUT=TRUE",
      x2: 100,
      y2: 200,
      width: 4,
      layers: ["bottom"],
    },
  ]) {
    const document = parseAltiumPcbDoc(
      [
        board,
        `|RECORD=Track|LAYER=${example.layer}${example.flag}|X1=100mil|Y1=100mil|X2=${example.x2}mil|Y2=${example.y2}mil|WIDTH=${example.width}mil`,
        "|RECORD=Track|LAYER=TOP|KEEPOUT=FALSE|X1=300mil|Y1=300mil|X2=400mil|Y2=300mil|WIDTH=10mil",
        "|RECORD=Track|LAYER=TOPOVERLAY|X1=300mil|Y1=400mil|X2=400mil|Y2=400mil|WIDTH=4mil",
      ].join("\n"),
    )
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    const keepouts = circuitJson.filter((e) => e.type === "pcb_keepout")
    expect(keepouts).toHaveLength(1)
    expect(keepouts[0]).toMatchObject({
      shape: "outline",
      outline: [
        { x: 2.54, y: 2.54 },
        { x: example.x2 * 0.0254, y: example.y2 * 0.0254 },
      ],
      stroke_width: example.width * 0.0254,
      layers: example.layers,
    })
    expect(circuitJson.filter((e) => e.type === "pcb_trace")).toHaveLength(1)
    expect(
      circuitJson.filter((e) => e.type === "pcb_silkscreen_line"),
    ).toHaveLength(1)
    expect(
      circuitJson.every((e) => any_circuit_element.safeParse(e).success),
    ).toBe(true)
    const disabled = convertAltiumPcbDocToCircuitJson(document, {
      includeKeepouts: false,
    })
    expect(disabled.filter((e) => e.type === "pcb_keepout")).toHaveLength(0)
    expect(disabled.filter((e) => e.type === "pcb_trace")).toHaveLength(1)
    const withoutCopper = convertAltiumPcbDocToCircuitJson(document, {
      includeTraces: false,
    })
    expect(withoutCopper.filter((e) => e.type === "pcb_keepout")).toHaveLength(
      1,
    )
    expect(withoutCopper.filter((e) => e.type === "pcb_trace")).toHaveLength(0)
  }
})
