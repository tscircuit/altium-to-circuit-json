import type { AltiumPadRecord } from "altiumts"
import type {
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  SourcePort,
} from "circuit-json"
import type { PcbComponentContext, PcbNetContext } from "../model"
import { milsToMillimeters } from "../geometry"

type ElectricalPcbPad = PcbSmtPad | PcbPlatedHole

export function connectPcbPad({
  componentContext,
  includeComponentOwnership = true,
  netContext,
  pad,
  record,
  recordIndex,
}: {
  componentContext: PcbComponentContext
  includeComponentOwnership?: boolean
  netContext: PcbNetContext
  pad: ElectricalPcbPad
  record: AltiumPadRecord
  recordIndex: number
}): Array<ElectricalPcbPad | SourcePort | PcbPort> {
  const padName = record.name?.trim() || `pad${recordIndex + 1}`
  const sourcePortId = `source_port_altium_${recordIndex}`
  const pcbPortId = `pcb_port_altium_${recordIndex}`
  const sourceComponentId = includeComponentOwnership
    ? componentContext.getSourceComponentId(record)
    : undefined
  const pcbComponentId = includeComponentOwnership
    ? componentContext.getPcbComponentId(record)
    : undefined
  const numericPinNumber = /^\d+$/u.test(padName)
    ? Number.parseInt(padName, 10)
    : undefined
  const layers = pad.type === "pcb_smtpad" ? [pad.layer] : [...pad.layers]
  const position = record.position
  if (!position) return [pad]

  Object.assign(pad, {
    pcb_port_id: pcbPortId,
    port_hints: [padName],
    ...(pcbComponentId ? { pcb_component_id: pcbComponentId } : {}),
  })

  const sourcePort: SourcePort = {
    type: "source_port",
    source_port_id: sourcePortId,
    name: `pin${padName}`,
    port_hints: [padName, `pin${padName}`],
    ...(numericPinNumber === undefined ? {} : { pin_number: numericPinNumber }),
    ...(sourceComponentId ? { source_component_id: sourceComponentId } : {}),
  }
  const pcbPort: PcbPort = {
    type: "pcb_port",
    pcb_port_id: pcbPortId,
    source_port_id: sourcePortId,
    x: milsToMillimeters(position.x),
    y: milsToMillimeters(position.y),
    layers,
    ...(pcbComponentId ? { pcb_component_id: pcbComponentId } : {}),
  }

  netContext.connectSourcePort(record, sourcePortId)
  return [sourcePort, pcbPort, pad]
}
