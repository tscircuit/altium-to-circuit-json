import type { AltiumRecord } from "altiumts"
import {
  getPortConnectionGeometry,
  getRecordDirection,
  getSchematicConnectionSegments,
} from "../connectivity"
import type { SchematicContext } from "../document"

export function getHierarchicalPortArrowEnds({
  context,
  record,
}: {
  context: SchematicContext
  record: AltiumRecord
}): { pointAtEnd: boolean; pointAtStart: boolean } {
  const ioType = record.getNumber("IOTYPE") ?? 0
  const style = record.getNumber("STYLE") ?? 0
  const vertical = style >= 4 && style <= 7

  if (ioType !== 1 && ioType !== 2 && ioType !== 3) {
    return {
      pointAtStart: vertical
        ? style === 6 || style === 7
        : style === 1 || style === 3,
      pointAtEnd: vertical
        ? style === 5 || style === 7
        : style === 2 || style === 3,
    }
  }
  if (ioType === 3) return { pointAtStart: true, pointAtEnd: true }

  const connectionSegments = getSchematicConnectionSegments(context.records)
  const bodyDirection = getPortConnectionGeometry(
    record,
    connectionSegments,
  )?.bodyDirection
  const connectedAtEnd =
    bodyDirection !== undefined && bodyDirection !== getRecordDirection(record)
  const pointAtStart = ioType === 1 ? connectedAtEnd : !connectedAtEnd
  return { pointAtStart, pointAtEnd: !pointAtStart }
}
