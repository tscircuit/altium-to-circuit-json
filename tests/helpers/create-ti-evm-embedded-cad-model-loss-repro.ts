import {
  AltiumComponentBodyRecord,
  type AltiumPcbSide,
  parseAltiumBinaryPcbDoc,
} from "altiumts"
import type { CadComponent, CircuitJson, Point, Point3 } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "./read-reference"

interface TiEvmEmbeddedCadModelSummary {
  convertedCadComponentCount: number
  embeddedModelPlacementCount: number
  firstConvertedCadComponent: ConvertedCadComponentSummary | undefined
  firstBottomConvertedCadComponent: ConvertedCadComponentSummary | undefined
  firstEmbeddedModelPlacement: EmbeddedModelPlacementSummary
  firstBottomEmbeddedModelPlacement: EmbeddedModelPlacementSummary | undefined
}

interface ConvertedCadComponentSummary {
  layer: CadComponent["layer"]
  modelStepUrl: CadComponent["model_step_url"]
  position: Point3
  rotation: Point3 | undefined
}

interface EmbeddedModelPlacementSummary {
  layer: "bottom" | "top"
  modelIndex: number
  modelZOffsetMils: number
  positionMils: Point
  rotation: Point3
  standoffHeightMils: number
}

interface EmbeddedModelBody {
  body: AltiumComponentBodyRecord
  bodyIndex: number
  componentSide: AltiumPcbSide
  modelIndex: number
}

function summarizeCadComponent(
  cadComponent: CadComponent | undefined,
): ConvertedCadComponentSummary | undefined {
  if (!cadComponent) return undefined
  return {
    layer: cadComponent.layer,
    modelStepUrl: cadComponent.model_step_url,
    position: cadComponent.position,
    rotation: cadComponent.rotation,
  }
}

function getEmbeddedModelLayer({
  body,
  componentSide,
}: Pick<EmbeddedModelBody, "body" | "componentSide">): "bottom" | "top" {
  const bodyProjection = body.getNumber("BODYPROJECTION")
  if (bodyProjection === 1) return "bottom"
  if (bodyProjection === 0) return "top"
  return componentSide === "bottom" ? "bottom" : "top"
}

function summarizeEmbeddedModelPlacement({
  body,
  componentSide,
  modelIndex,
}: EmbeddedModelBody): EmbeddedModelPlacementSummary {
  if (!body.modelPosition) {
    throw new Error(`Embedded model ${modelIndex} has no placement`)
  }
  return {
    layer: getEmbeddedModelLayer({ body, componentSide }),
    modelIndex,
    modelZOffsetMils: body.getAltiumMeasurement("MODEL.3D.DZ")?.toMils() ?? 0,
    positionMils: body.modelPosition,
    rotation: body.modelRotation3d,
    standoffHeightMils: body.standoffHeightMils ?? 0,
  }
}

function getCadComponentForBody({
  bodyIndex,
  circuitJson,
}: {
  bodyIndex: number
  circuitJson: CircuitJson
}): CadComponent | undefined {
  return circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.cad_component_id === `cad_component_altium_${bodyIndex}`,
  )
}

interface TiEvmEmbeddedCadModelRepro {
  circuitJson: CircuitJson
  modelSummary: TiEvmEmbeddedCadModelSummary
}

export async function createTiEvmEmbeddedCadModelLossRepro({
  pcbFilename,
}: {
  pcbFilename: string
}): Promise<TiEvmEmbeddedCadModelRepro> {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(pcbFilename),
  )
  const embeddedModelBodies = document.componentBodies.flatMap(
    (componentBody, bodyIndex): EmbeddedModelBody[] => {
      if (
        !(componentBody instanceof AltiumComponentBodyRecord) ||
        componentBody.modelPosition === undefined ||
        componentBody.componentIndex === undefined
      ) {
        return []
      }
      const embeddedModel =
        document.getEmbeddedModelForComponentBody(componentBody)
      const component = document.getComponentForRecord(componentBody)
      if (!embeddedModel || !component) return []
      return [
        {
          body: componentBody,
          bodyIndex,
          componentSide: component.side,
          modelIndex: embeddedModel.index,
        },
      ]
    },
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${pcbFilename}/${embeddedModel.index}.step`,
  })
  const firstEmbeddedModelBody = embeddedModelBodies[0]
  if (!firstEmbeddedModelBody) {
    throw new Error(`${pcbFilename} has no embedded model placement`)
  }
  const firstBottomEmbeddedModelBody = embeddedModelBodies.find(
    (embeddedModelBody) =>
      getEmbeddedModelLayer(embeddedModelBody) === "bottom",
  )

  return {
    circuitJson,
    modelSummary: {
      convertedCadComponentCount: circuitJson.filter(
        (element) => element.type === "cad_component",
      ).length,
      embeddedModelPlacementCount: embeddedModelBodies.length,
      firstConvertedCadComponent: summarizeCadComponent(
        getCadComponentForBody({
          bodyIndex: firstEmbeddedModelBody.bodyIndex,
          circuitJson,
        }),
      ),
      firstBottomConvertedCadComponent: summarizeCadComponent(
        firstBottomEmbeddedModelBody
          ? getCadComponentForBody({
              bodyIndex: firstBottomEmbeddedModelBody.bodyIndex,
              circuitJson,
            })
          : undefined,
      ),
      firstEmbeddedModelPlacement: summarizeEmbeddedModelPlacement(
        firstEmbeddedModelBody,
      ),
      firstBottomEmbeddedModelPlacement: firstBottomEmbeddedModelBody
        ? summarizeEmbeddedModelPlacement(firstBottomEmbeddedModelBody)
        : undefined,
    },
  }
}
