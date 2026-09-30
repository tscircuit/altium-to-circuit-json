import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const components = [
  { id: 7, index: 0, layer: "top", overlay: "TOPOVERLAY", courtyard: 15 },
  { id: 2, index: 1, layer: "bottom", overlay: "BOTTOMOVERLAY", courtyard: 16 },
] as const

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=600mil|VY1=0mil|KIND2=0|VX2=600mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    ...components.map(
      ({ id, layer }) =>
        `|RECORD=Component|ID=${id}|LAYER=${layer.toUpperCase()}|X=300mil|Y=250mil|SOURCEDESIGNATOR=U${id}`,
    ),
    ...components
      .toReversed()
      .flatMap(({ id, layer, overlay, courtyard }) =>
        [
          `|RECORD=Track|LAYER=${overlay}|X1=100mil|Y1=350mil|X2=250mil|Y2=350mil|WIDTH=5mil`,
          `|RECORD=Arc|LAYER=${overlay}|LOCATION.X=400mil|LOCATION.Y=325mil|RADIUS=50mil|STARTANGLE=0|ENDANGLE=180|WIDTH=5mil`,
          `|RECORD=Fill|LAYER=${overlay}|X1=100mil|Y1=225mil|X2=225mil|Y2=275mil`,
          `|RECORD=Region|LAYER=${overlay}|REGIONKIND=COPPER|KIND0=0|VX0=350mil|VY0=225mil|KIND1=0|VX1=450mil|VY1=225mil|KIND2=0|VX2=400mil|VY2=275mil`,
          `|RECORD=Text|LAYER=${overlay}|X=100mil|Y=125mil|HEIGHT=35mil|TEXT=U${id}`,
          `|RECORD=Text|LAYER=${layer.toUpperCase()}|X=300mil|Y=125mil|HEIGHT=35mil|TEXT=CU${id}`,
          "|RECORD=Text|LAYER=MECHANICAL1|X=250mil|Y=400mil|HEIGHT=35mil|TEXT=.DESIGNATOR",
          `|RECORD=Region|LAYER=MECHANICAL${courtyard}|REGIONKIND=COPPER|KIND0=0|VX0=75mil|VY0=75mil|KIND1=0|VX1=500mil|VY1=75mil|KIND2=0|VX2=500mil|VY2=450mil|KIND3=0|VX3=75mil|VY3=450mil|KIND4=0|VX4=75mil|VY4=75mil`,
        ].map((record) => `${record}|COMPONENT=${id}`),
      ),
  ].join("\n"),
)

test.each([...components])(
  "renders graphics owned by sparse component ID $id on $layer",
  async ({ id, index, layer }) => {
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)
    // A whole-board render hides dangling ownership because graphics use
    // absolute coordinates. Isolate by the emitted ID to expose that bug.
    const componentElements = circuitJson.filter(
      (element) =>
        element.type === "pcb_board" ||
        ("pcb_component_id" in element &&
          element.pcb_component_id === `pcb_component_altium_${index}`),
    )
    const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
      altiumSvg: serializeAltiumPcbToSvg(document, {
        componentIndices: [id],
        height: 600,
        width: 720,
        title: `U${id} owned graphics`,
      }),
      circuitJsonSvg: convertCircuitJsonToPcbSvg(componentElements, {
        height: 600,
        width: 720,
        matchBoardAspectRatio: true,
        showCourtyards: true,
        showPcbNotes: true,
      }),
      label: `U${id} component ownership (${layer})`,
    })

    await expect(comparisonSvg).toMatchSvgSnapshot(
      import.meta.path,
      `u${id}-${layer}`,
    )
  },
)
