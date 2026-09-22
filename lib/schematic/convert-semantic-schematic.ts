import type { AltiumRecord, AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"

import { convertComponents } from "./convert-components"
import { convertConnectivity } from "./convert-connectivity"
import { convertNetLabels } from "./convert-net-labels"
import { buildSemanticNetGraph } from "./semantic-net-graph"
import type {
  ConvertedPort,
  SemanticSchematicConversion,
  SemanticSchematicOptions,
} from "./semantic-types"

export type {
  SemanticSchematicConversion,
  SemanticSchematicOptions,
} from "./semantic-types"

export function convertSemanticSchematic(
  document: AltiumSchDoc,
  options: SemanticSchematicOptions,
): SemanticSchematicConversion {
  const handledRecords = new Set<AltiumRecord>()
  const elements: AnyCircuitElement[] = []
  const convertedPorts: ConvertedPort[] = []

  convertComponents({
    convertedPorts,
    document,
    elements,
    handledRecords,
    options,
  })

  const semanticNetGraph = buildSemanticNetGraph(document, convertedPorts)
  const connectivity = convertConnectivity({
    convertedPorts,
    document,
    elements,
    handledRecords,
    semanticNetGraph,
    options,
  })
  convertNetLabels({
    connectivity,
    document,
    elements,
    handledRecords,
    semanticNetGraph,
    options,
  })

  return { elements, handledRecords }
}
