import type {
  AnyCircuitElement,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import { ConverterStage } from "../../converter/ConverterStage"
import type {
  AltiumProjectConverterContext,
  ConvertAltiumProjectInput,
} from "../types"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>
type SourceElement = SourceComponent | SourceNet | SourcePort | SourceTrace

const isReconciledSourceElement = (
  element: AnyCircuitElement,
): element is SourceElement =>
  element.type === "source_component" ||
  element.type === "source_net" ||
  element.type === "source_port" ||
  element.type === "source_trace"

const normalizeName = (name: string): string => name.trim().toUpperCase()

const getCanonicalId = ({
  id,
  idReplacements,
}: {
  id: string
  idReplacements: Map<string, string>
}): string => idReplacements.get(id) ?? id

const getPortIdentity = ({
  idReplacements,
  sourcePort,
}: {
  idReplacements: Map<string, string>
  sourcePort: SourcePort
}): string | null => {
  if (!sourcePort.source_component_id) return null
  const sourceComponentId = getCanonicalId({
    id: sourcePort.source_component_id,
    idReplacements,
  })
  const pinIdentity =
    sourcePort.pin_number !== undefined
      ? `pin:${sourcePort.pin_number}`
      : sourcePort.port_hints?.[0]
        ? `hint:${sourcePort.port_hints[0]}`
        : sourcePort.name
          ? `name:${normalizeName(sourcePort.name)}`
          : null

  return pinIdentity ? `${sourceComponentId}:${pinIdentity}` : null
}

const getTraceIdentities = ({
  idReplacements,
  sourceTrace,
}: {
  idReplacements: Map<string, string>
  sourceTrace: SourceTrace
}): string[] => {
  const sourceNetIds = sourceTrace.connected_source_net_ids
    .map((id) => getCanonicalId({ id, idReplacements }))
    .sort()
  const sourcePortIds = sourceTrace.connected_source_port_ids
    .map((id) => getCanonicalId({ id, idReplacements }))
    .sort()

  return [
    ...(sourcePortIds.length > 0 ? [`ports:${sourcePortIds.join("|")}`] : []),
    ...(sourceNetIds.length > 0 ? [`nets:${sourceNetIds.join("|")}`] : []),
  ]
}

const replaceCircuitJsonIds = ({
  idReplacements,
  value,
}: {
  idReplacements: Map<string, string>
  value: unknown
}): void => {
  if (!value || typeof value !== "object") return

  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (fieldName.endsWith("_id") && typeof fieldValue === "string") {
      Reflect.set(
        value,
        fieldName,
        getCanonicalId({ id: fieldValue, idReplacements }),
      )
      continue
    }
    if (fieldName.endsWith("_ids") && Array.isArray(fieldValue)) {
      Reflect.set(
        value,
        fieldName,
        fieldValue.map((id) =>
          typeof id === "string" ? getCanonicalId({ id, idReplacements }) : id,
        ),
      )
      continue
    }
    replaceCircuitJsonIds({ idReplacements, value: fieldValue })
  }
}

const mergeSourceElements = ({
  candidate,
  canonical,
}: {
  candidate: SourceElement
  canonical: SourceElement
}): void => {
  const canonicalRecord = canonical as unknown as Record<string, unknown>
  for (const [fieldName, fieldValue] of Object.entries(candidate)) {
    const canonicalValue = canonicalRecord[fieldName]
    if (fieldName.endsWith("_ids") && Array.isArray(fieldValue)) {
      canonicalRecord[fieldName] = [
        ...new Set([
          ...(Array.isArray(canonicalValue) ? canonicalValue : []),
          ...fieldValue,
        ]),
      ]
      continue
    }
    if (canonicalValue === undefined || canonicalValue === null) {
      canonicalRecord[fieldName] = fieldValue
    }
  }
}

const deduplicateSourceElements = (
  elements: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const sourceElementsByIdentity = new Map<string, SourceElement>()
  const deduplicatedElements: AnyCircuitElement[] = []

  for (const element of elements) {
    if (!isReconciledSourceElement(element)) {
      deduplicatedElements.push(element)
      continue
    }
    const elementId = Reflect.get(element, `${element.type}_id`)
    if (typeof elementId !== "string") {
      deduplicatedElements.push(element)
      continue
    }
    const identity = `${element.type}:${elementId}`
    const canonical = sourceElementsByIdentity.get(identity)
    if (canonical) {
      mergeSourceElements({ candidate: element, canonical })
      continue
    }
    sourceElementsByIdentity.set(identity, element)
    deduplicatedElements.push(element)
  }

  return deduplicatedElements
}

export class ReconcileAltiumProjectSourceIdsStage extends ConverterStage<
  ConvertAltiumProjectInput,
  AnyCircuitElement[],
  AltiumProjectConverterContext
> {
  _step(): void {
    const idReplacements = new Map<string, string>()
    const sourceComponentsByName = new Map<string, SourceComponent>()

    for (const element of this.context.elements) {
      if (element.type !== "source_component" || !element.name) continue
      const componentName = normalizeName(element.name)
      const canonical = sourceComponentsByName.get(componentName)
      if (canonical) {
        idReplacements.set(
          element.source_component_id,
          canonical.source_component_id,
        )
      } else {
        sourceComponentsByName.set(componentName, element)
      }
    }

    const sourcePortsByIdentity = new Map<string, SourcePort>()
    for (const element of this.context.elements) {
      if (element.type !== "source_port") continue
      const portIdentity = getPortIdentity({
        idReplacements,
        sourcePort: element,
      })
      if (!portIdentity) continue
      const canonical = sourcePortsByIdentity.get(portIdentity)
      if (canonical) {
        idReplacements.set(element.source_port_id, canonical.source_port_id)
      } else {
        sourcePortsByIdentity.set(portIdentity, element)
      }
    }

    const sourceNetsByName = new Map<string, SourceNet>()
    for (const element of this.context.elements) {
      if (element.type !== "source_net" || !element.name?.trim()) continue
      const netName = normalizeName(element.name)
      const canonical = sourceNetsByName.get(netName)
      if (canonical) {
        idReplacements.set(element.source_net_id, canonical.source_net_id)
      } else {
        sourceNetsByName.set(netName, element)
      }
    }

    const pcbSourceTraceIds = new Set(
      this.context.pcbElements.flatMap((element) =>
        element.type === "source_trace" ? [element.source_trace_id] : [],
      ),
    )
    const sourceTraceGroups: Array<{
      identities: Set<string>
      traces: SourceTrace[]
    }> = []
    for (const element of this.context.elements) {
      if (element.type !== "source_trace") continue
      const traceIdentities = getTraceIdentities({
        idReplacements,
        sourceTrace: element,
      })
      if (traceIdentities.length === 0) continue
      const matchingGroups = sourceTraceGroups.filter((group) =>
        traceIdentities.some((identity) => group.identities.has(identity)),
      )
      const group = matchingGroups[0]
      if (!group) {
        sourceTraceGroups.push({
          identities: new Set(traceIdentities),
          traces: [element],
        })
        continue
      }
      group.traces.push(element)
      for (const identity of traceIdentities) group.identities.add(identity)
      for (const mergedGroup of matchingGroups.slice(1)) {
        group.traces.push(...mergedGroup.traces)
        for (const identity of mergedGroup.identities) {
          group.identities.add(identity)
        }
        sourceTraceGroups.splice(sourceTraceGroups.indexOf(mergedGroup), 1)
      }
    }
    for (const { traces } of sourceTraceGroups) {
      const canonical =
        traces.find((trace) => pcbSourceTraceIds.has(trace.source_trace_id)) ??
        traces[0]
      if (!canonical) continue
      for (const trace of traces) {
        if (trace === canonical) continue
        idReplacements.set(trace.source_trace_id, canonical.source_trace_id)
      }
    }

    for (const element of this.context.elements) {
      replaceCircuitJsonIds({ idReplacements, value: element })
    }
    this.context.elements = deduplicateSourceElements(this.context.elements)
    this.finished = true
  }

  getOutput(): AnyCircuitElement[] {
    return this.context.elements
  }
}
