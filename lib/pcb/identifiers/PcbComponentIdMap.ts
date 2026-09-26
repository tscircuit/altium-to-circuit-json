import type {
  AltiumComponentRecord,
  AltiumPcbDocument,
  AltiumRecord,
} from "altiumts"
import { getPcbComponentId } from "./getPcbComponentId"
import type { PcbComponentId } from "./types"

export class PcbComponentIdMap {
  private readonly componentIds = new Map<
    AltiumComponentRecord,
    PcbComponentId
  >()

  constructor(
    private readonly document: AltiumPcbDocument,
    { includeComponents = true }: { includeComponents?: boolean } = {},
  ) {
    if (!includeComponents) return
    for (const [index, component] of document.components.entries()) {
      if (component.position) {
        this.componentIds.set(component, getPcbComponentId(index))
      }
    }
  }

  get(record: AltiumRecord): PcbComponentId | undefined {
    const component = this.document.getComponentForRecord(record)
    return component ? this.componentIds.get(component) : undefined
  }
}
