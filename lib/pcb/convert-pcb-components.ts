import type { AltiumPcbDocument } from "altiumts"
import type { PcbComponent } from "circuit-json"
import { convertPcbCourtyards } from "./convert-pcb-courtyards"
import { milsToMillimeters, toMillimeterPoint } from "./coordinates"
import { getPcbComponentId } from "./ids"
import type { PcbConversionContext } from "./types"

export function convertPcbComponents(context: PcbConversionContext): void {
  if (context.options.includeComponents === false) return
  context.elements.push(...createComponents(context.document))
  if (context.options.includeCourtyards !== false) {
    context.elements.push(...convertPcbCourtyards(context.document))
  }
}

function createComponents(document: AltiumPcbDocument): PcbComponent[] {
  return document.components.flatMap((component, index) => {
    const position = component.position
    if (!position) return []
    const bounds = document.getComponentBounds(component)
    return [
      {
        type: "pcb_component",
        pcb_component_id: getPcbComponentId(index),
        source_component_id: `source_component_altium_${index}`,
        center: toMillimeterPoint(position),
        width: milsToMillimeters(
          bounds ? bounds.maxX - bounds.minX : (component.heightMils ?? 20),
        ),
        height: milsToMillimeters(
          bounds ? bounds.maxY - bounds.minY : (component.heightMils ?? 20),
        ),
        layer: component.side === "bottom" ? "bottom" : "top",
        rotation: component.rotation,
        position_mode: "none",
        obstructs_within_bounds: false,
      } satisfies PcbComponent,
    ]
  })
}
