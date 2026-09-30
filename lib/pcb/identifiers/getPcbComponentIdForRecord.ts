import type { AltiumRecord } from "altiumts"
import type { PcbComponentContext } from "../model"
import { BOARD_GRAPHICS_COMPONENT_ID } from "../model"
import type { PcbComponentId } from "./types"

export function getPcbComponentIdForRecord(
  record: AltiumRecord,
  componentContext: PcbComponentContext,
): PcbComponentId | typeof BOARD_GRAPHICS_COMPONENT_ID {
  return (
    componentContext.getPcbComponentId(record) ?? BOARD_GRAPHICS_COMPONENT_ID
  )
}
