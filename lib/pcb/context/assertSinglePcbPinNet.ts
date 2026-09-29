import type {
  AltiumComponentRecord,
  AltiumPadRecord,
  AltiumPcbDocument,
} from "altiumts"

export function assertSinglePcbPinNet({
  component,
  document,
  pinName,
  records,
}: {
  component: AltiumComponentRecord
  document: AltiumPcbDocument
  pinName: string
  records: AltiumPadRecord[]
}): void {
  const assignedNets = document.nets.filter((net) =>
    records.some((record) => document.getNetForRecord(record) === net),
  )
  if (assignedNets.length <= 1) return

  const designator = component.designator?.trim() || "unnamed component"
  const netNames = assignedNets.map(
    (net, index) => net.name?.trim() || `unnamed net ${index + 1}`,
  )
  throw new Error(
    `Altium PCB component ${designator} pin ${pinName} is assigned to multiple nets: ${netNames.join(", ")}`,
  )
}
