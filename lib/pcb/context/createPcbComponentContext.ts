import { AltiumPadRecord, type AltiumPcbDocument } from "altiumts"
import { createSourceComponent } from "../../schematic/components/createSourceComponent"
import type { PcbComponentContext } from "../model"
import { getPcbComponentId } from "../identifiers"

export function createPcbComponentContext(
  document: AltiumPcbDocument,
): PcbComponentContext {
  const componentIndexByRecord = new Map(
    document.components.map((component, index) => [component, index]),
  )
  const sourceComponentIdByRecord = new Map(
    document.components.map((component, index) => [
      component,
      `source_component_altium_${index}`,
    ]),
  )
  const elements = document.components.map((component, index) => {
    const designator = component.designator?.trim() || `component_${index}`
    const ownedPads = document
      .getRecordsOwnedByComponent(component)
      .filter((record) => record instanceof AltiumPadRecord)

    return createSourceComponent({
      displayText: component.comment?.trim() ?? "",
      designator,
      libraryReference:
        component.sourceLibraryReference?.trim() ||
        component.footprint?.trim() ||
        "",
      pinCount: ownedPads.length,
      sourceComponentId: `source_component_altium_${index}`,
    })
  })

  const getComponentIndex = (
    record: Parameters<PcbComponentContext["getComponentIndex"]>[0],
  ) => {
    const component = document.getComponentForRecord(record)
    return component ? componentIndexByRecord.get(component) : undefined
  }

  return {
    elements,
    getComponentIndex,
    getPcbComponentId: (record) => {
      const index = getComponentIndex(record)
      return index === undefined ? undefined : getPcbComponentId(index)
    },
    getSourceComponentId: (record) => {
      const component = document.getComponentForRecord(record)
      return component ? sourceComponentIdByRecord.get(component) : undefined
    },
    getSourceComponentIdForComponent: (component) => {
      const sourceComponentId = sourceComponentIdByRecord.get(component)
      if (!sourceComponentId) {
        throw new Error("PCB component is absent from the document index")
      }
      return sourceComponentId
    },
  }
}
