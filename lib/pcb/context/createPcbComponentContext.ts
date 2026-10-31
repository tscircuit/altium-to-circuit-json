import {
  AltiumPadRecord,
  type AltiumPcbDocument,
  type AltiumRecord,
} from "altiumts"
import type { SourcePort } from "circuit-json"
import { normalizeSourceIdentityName } from "../../project/reconciliation/normalizeSourceIdentityName"
import { createPcbSourceComponent } from "../components/createPcbSourceComponent"
import { getPcbComponentDesignator } from "../components/getPcbComponentDesignator"
import { getPcbComponentId } from "../identifiers"
import type { PcbCopperLayerMap } from "../layers"
import type { PcbComponentContext } from "../model"
import { isElectricalPcbPad } from "../pads/isElectricalPcbPad"
import { assertSinglePcbPinNet } from "./assertSinglePcbPinNet"

interface LogicalPcbPin {
  name: string
  records: AltiumPadRecord[]
}

export function createPcbComponentContext({
  document,
  includePorts,
  layerMap,
}: {
  document: AltiumPcbDocument
  includePorts: boolean
  layerMap: PcbCopperLayerMap
}): PcbComponentContext {
  const componentIndexByRecord = new Map(
    document.components.map((component, index) => [component, index]),
  )
  const recordIndexByRecord = new Map(
    document.records.map((record, index) => [record, index]),
  )
  const sourcePortIdByPad = new Map<AltiumPadRecord, string>()
  const ownedPads = new Set<AltiumPadRecord>()
  const sourceComponents: PcbComponentContext["sourceComponents"] = []
  const sourcePorts: SourcePort[] = []
  const componentsWithDesignators = document.components.map(
    (component, componentIndex) => ({
      component,
      baseComponentName: getPcbComponentDesignator({
        component,
        componentIndex,
        document,
      }),
    }),
  )
  const reservedComponentNameKeys = new Set(
    componentsWithDesignators.map(({ baseComponentName }) =>
      normalizeSourceIdentityName(baseComponentName),
    ),
  )
  const usedComponentNameKeys = new Set<string>()

  for (const [
    componentIndex,
    { component, baseComponentName },
  ] of componentsWithDesignators.entries()) {
    const logicalPins: LogicalPcbPin[] = []
    for (const record of document.getRecordsOwnedByComponent(component)) {
      if (!(record instanceof AltiumPadRecord)) continue
      ownedPads.add(record)
      if (!isElectricalPcbPad({ layerMap, record })) continue
      const pinName = record.name?.trim() ?? ""
      const existingPin = pinName
        ? logicalPins.find((pin) => pin.name === pinName)
        : undefined
      if (existingPin) existingPin.records.push(record)
      else logicalPins.push({ name: pinName, records: [record] })
    }

    const sourceComponentId = `source_component_altium_${componentIndex}`
    let componentName = baseComponentName
    let componentNameKey = normalizeSourceIdentityName(componentName)
    if (usedComponentNameKeys.has(componentNameKey)) {
      let duplicateSuffix = componentIndex
      do {
        componentName = `${baseComponentName}_${duplicateSuffix}`
        duplicateSuffix += 1
        componentNameKey = normalizeSourceIdentityName(componentName)
      } while (
        reservedComponentNameKeys.has(componentNameKey) ||
        usedComponentNameKeys.has(componentNameKey)
      )
    }
    usedComponentNameKeys.add(componentNameKey)
    sourceComponents.push(
      createPcbSourceComponent({
        component,
        componentName,
        componentIndex,
        displayDesignator: baseComponentName,
      }),
    )
    if (!includePorts) continue

    for (const pin of logicalPins) {
      assertSinglePcbPinNet({
        component,
        document,
        pinName: pin.name,
        records: pin.records,
      })
      const firstRecord = pin.records[0]
      const recordIndex = firstRecord
        ? recordIndexByRecord.get(firstRecord)
        : undefined
      if (recordIndex === undefined) continue
      const pinName = pin.name || `pad${recordIndex + 1}`
      const sourcePortId = `source_port_altium_${recordIndex}`
      for (const record of pin.records) {
        sourcePortIdByPad.set(record, sourcePortId)
      }
      const pinNumber = /^\d+$/u.test(pinName) ? Number(pinName) : undefined
      sourcePorts.push({
        type: "source_port",
        source_port_id: sourcePortId,
        source_component_id: sourceComponentId,
        name: pinName,
        port_hints: [pinName, `pin${pinName}`],
        ...(pinNumber === undefined ? {} : { pin_number: pinNumber }),
      })
    }
  }

  if (includePorts) {
    for (const [recordIndex, record] of document.records.entries()) {
      if (!(record instanceof AltiumPadRecord) || ownedPads.has(record))
        continue
      if (!isElectricalPcbPad({ layerMap, record })) continue
      const pinName = record.name?.trim() || `pad${recordIndex + 1}`
      const sourcePortId = `source_port_altium_${recordIndex}`
      const pinNumber = /^\d+$/u.test(pinName) ? Number(pinName) : undefined
      sourcePortIdByPad.set(record, sourcePortId)
      sourcePorts.push({
        type: "source_port",
        source_port_id: sourcePortId,
        name: pinName,
        port_hints: [pinName, `pin${pinName}`],
        ...(pinNumber === undefined ? {} : { pin_number: pinNumber }),
      })
    }
  }

  return {
    sourceComponents,
    sourcePorts,
    getPcbComponentId: (record: AltiumRecord) => {
      const component = document.getComponentForRecord(record)
      const index = component
        ? componentIndexByRecord.get(component)
        : undefined
      return index === undefined ? undefined : getPcbComponentId(index)
    },
    getSourcePortId: (record: AltiumPadRecord) => sourcePortIdByPad.get(record),
  }
}
