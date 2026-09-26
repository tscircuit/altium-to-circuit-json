import type { AltiumRecord } from "altiumts"
import { BOARD_GRAPHICS_COMPONENT_ID } from "../model"
import type { PcbComponentIdMap } from "./PcbComponentIdMap"
import type { PcbComponentId } from "./types"

export function getPcbComponentIdForRecord(
  record: AltiumRecord,
  componentIds: PcbComponentIdMap,
): PcbComponentId | typeof BOARD_GRAPHICS_COMPONENT_ID {
  return componentIds.get(record) ?? BOARD_GRAPHICS_COMPONENT_ID
}
