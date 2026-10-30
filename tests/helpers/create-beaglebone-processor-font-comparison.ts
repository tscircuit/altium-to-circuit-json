import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "./read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "./stack-svg-comparison"

export async function createBeagleboneProcessorFontComparison({
  sheet,
  sourceViewBox,
}: {
  sheet: "03" | "04"
  sourceViewBox: { x: number; y: number; width: number; height: number }
}) {
  const document = parseAltiumSchDoc(
    await readReferenceBytes(`beaglebone-black-processor-${sheet}.SchDoc`),
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    schematicUnitScale: 0.01,
  })
  const sourceComponent = circuitJson.find(
    (element) => element.type === "source_component" && element.name === "U5",
  )
  if (!sourceComponent || sourceComponent.type !== "source_component") {
    throw new Error("BeagleBone sheet has no U5 source component")
  }
  const component = circuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === sourceComponent.source_component_id,
  )
  if (!component || component.type !== "schematic_component") {
    throw new Error("BeagleBone sheet has no U5 schematic component")
  }
  const processorCircuitJson = circuitJson.filter(
    (element) =>
      element === sourceComponent ||
      element === component ||
      (element.type === "source_port" &&
        element.source_component_id === sourceComponent.source_component_id) ||
      (element.type === "schematic_port" &&
        element.schematic_component_id === component.schematic_component_id),
  )
  const ports = processorCircuitJson.filter(
    (element) => element.type === "schematic_port",
  )
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(document, {
      viewBox: sourceViewBox,
      width: 1000,
      height: 800,
    }),
    circuitJsonSvg: convertCircuitJsonToSchematicSvg(processorCircuitJson, {
      width: 1000,
      height: 800,
    }),
    label: `BeagleBone Black processor sheet ${sheet}`,
  })
  return { ports, comparisonSvg }
}
