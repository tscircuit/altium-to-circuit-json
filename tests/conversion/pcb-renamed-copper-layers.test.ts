import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { PcbCopperLayerMap } from "../../lib/pcb/layers"

test("preserves native identities when copper layer display names are swapped", () => {
  const boards = [
    "|RECORD=Board|LAYER_V8_0NAME=Top Layer|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=MidLayer 1|LAYER_V8_1LAYERID=16777219|LAYER_V8_2NAME=MidLayer 2|LAYER_V8_2LAYERID=16777218|LAYER_V8_3NAME=Bottom Layer|LAYER_V8_3LAYERID=16842751",
    "|RECORD=Board|LAYERV7_0NAME=Top Layer|LAYERV7_0LAYERID=16777217|LAYERV7_0NEXT=16777219|LAYERV7_1NAME=MidLayer 2|LAYERV7_1LAYERID=16777218|LAYERV7_1NEXT=16842751|LAYERV7_2NAME=MidLayer 1|LAYERV7_2LAYERID=16777219|LAYERV7_2NEXT=16777218|LAYERV7_3NAME=Bottom Layer|LAYERV7_3LAYERID=16842751",
    "|RECORD=Board|LAYER1NAME=Top Layer|LAYER1NEXT=3|LAYER2NAME=MidLayer 2|LAYER2NEXT=32|LAYER3NAME=MidLayer 1|LAYER3NEXT=2|LAYER32NAME=Bottom Layer|LAYER32NEXT=0",
  ]
  const trackLayers = ["MID-LAYER2", "MID-LAYER1", "16777219", "16777218"]
  for (const board of boards) {
    const source = [
      board,
      ...trackLayers.map(
        (layer) =>
          `|RECORD=Track|LAYER=${layer}|X1=0mil|Y1=0mil|X2=100mil|Y2=0mil|WIDTH=10mil`,
      ),
    ].join("\r\n")
    const document = parseAltiumPcbDoc(source)
    const layerMap = new PcbCopperLayerMap(document)
    expect(layerMap.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    expect(layerMap.getLayer("MID2")).toBe("inner1")
    expect(layerMap.getLayer("MidLayer 2")).toBe("inner1")
    expect(layerMap.getLayer("MID1")).toBe("inner2")
    expect(layerMap.getLayer("MidLayer 1")).toBe("inner2")
    expect(layerMap.getDisplayName("MID2")).toBe("MidLayer 1")
    expect(layerMap.getDisplayName("MID1")).toBe("MidLayer 2")
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    expect(
      circuitJson
        .filter((element) => element.type === "pcb_trace")
        .map(
          (trace) =>
            trace.route.find((point) => point.route_type === "wire")?.layer,
        ),
    ).toEqual(["inner1", "inner2", "inner1", "inner2"])
    expect(document.getString()).toBe(source)
  }

  const renamedPlane = parseAltiumPcbDoc(
    "|RECORD=Board|LAYER_V8_0NAME=Top Layer|LAYER_V8_0LAYERID=16777217|LAYER_V8_1NAME=MidLayer1|LAYER_V8_1LAYERID=16842753|LAYER_V8_2NAME=Bottom Layer|LAYER_V8_2LAYERID=16842751",
  )
  const planeLayerMap = new PcbCopperLayerMap(renamedPlane)
  expect(planeLayerMap.getLayer("INTERNALPLANE1")).toBe("inner1")
  expect(planeLayerMap.getDisplayName("INTERNALPLANE1")).toBe("MidLayer1")
  expect(() => planeLayerMap.getLayer("MID-LAYER1")).toThrow(
    /ambiguous copper layer/i,
  )
})
