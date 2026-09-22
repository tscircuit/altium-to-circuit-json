import type { AltiumRecord } from "altiumts"

import { BOARD_GRAPHICS_COMPONENT_ID } from "./constants"

export type PcbComponentId = string & {
  readonly __pcbComponentId: unique symbol
}

export function getPcbComponentId(index: number): PcbComponentId {
  return `pcb_component_altium_${index}` as PcbComponentId
}

export function getPcbComponentIdForRecord(
  record: AltiumRecord,
): PcbComponentId | typeof BOARD_GRAPHICS_COMPONENT_ID {
  const componentIndex = record.getNumber("COMPONENT")
  return componentIndex === undefined || componentIndex < 0
    ? BOARD_GRAPHICS_COMPONENT_ID
    : getPcbComponentId(componentIndex)
}
