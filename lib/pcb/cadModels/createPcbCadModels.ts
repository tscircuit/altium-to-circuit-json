import {
  AltiumBinaryPcbDoc,
  AltiumComponentBodyRecord,
  normalizeAltiumAngle,
} from "altiumts"
import type { CadComponent, Point3 } from "circuit-json"
import { DEFAULT_BOARD_THICKNESS_MM } from "../board/constants"
import { toMillimeterPoint } from "../geometry"
import type { PcbConversionContext } from "../model"

export function createPcbCadModels(
  context: PcbConversionContext,
): CadComponent[] {
  const document = context.document
  if (!(document instanceof AltiumBinaryPcbDoc)) return []
  const resolveEmbeddedModelUrl = context.options.resolveEmbeddedModelUrl
  if (!resolveEmbeddedModelUrl) return []

  return document.componentBodies.flatMap((body, bodyIndex) => {
    if (!(body instanceof AltiumComponentBodyRecord)) return []
    const modelPosition = body.modelPosition
    const componentIndex = body.componentIndex
    if (!modelPosition || componentIndex === undefined) return []

    const embeddedModel = document.getEmbeddedModelForComponentBody(body)
    if (!embeddedModel) return []
    const modelStepUrl = resolveEmbeddedModelUrl({ embeddedModel })
    if (!modelStepUrl) return []

    const pcbComponentId = context.componentContext.getPcbComponentId(body)
    const component = document.getComponentForRecord(body)
    if (!pcbComponentId || !component) return []

    const layer = getCadModelLayer({ body, componentSide: component.side })
    const modelZOffsetMillimeters =
      body.getAltiumMeasurement("MODEL.3D.DZ")?.toMillimeters() ?? 0
    const boardSurfaceZ = DEFAULT_BOARD_THICKNESS_MM / 2
    const positionZ =
      layer === "bottom"
        ? -boardSurfaceZ - modelZOffsetMillimeters
        : boardSurfaceZ + modelZOffsetMillimeters

    return [
      {
        type: "cad_component",
        cad_component_id: `cad_component_altium_${bodyIndex}`,
        pcb_component_id: pcbComponentId,
        source_component_id: `source_component_altium_${componentIndex}`,
        position: { ...toMillimeterPoint(modelPosition), z: positionZ },
        rotation: getBoardFrameModelCcwRotationDegrees({ body, layer }),
        layer,
        model_step_url: modelStepUrl,
        model_unit_to_mm_scale_factor: 1,
        model_board_normal_direction: "z+",
        model_origin_alignment: "unknown",
        model_object_fit: "contain_within_bounds",
        anchor_alignment: "center",
        ...(body.opacity !== undefined && body.opacity < 1
          ? { show_as_translucent_model: true }
          : {}),
      } satisfies CadComponent,
    ]
  })
}

function getCadModelLayer({
  body,
  componentSide,
}: {
  body: AltiumComponentBodyRecord
  componentSide: "bottom" | "top" | "unknown"
}): "bottom" | "top" {
  const bodyProjection = body.getNumber("BODYPROJECTION")
  if (bodyProjection === 1) return "bottom"
  if (bodyProjection === 0) return "top"
  return componentSide === "bottom" ? "bottom" : "top"
}

function getBoardFrameModelCcwRotationDegrees({
  body,
  layer,
}: {
  body: AltiumComponentBodyRecord
  layer: "bottom" | "top"
}): Point3 {
  const modelCcwRotationDegrees = body.modelRotation3d

  // Boundary: both formats use right-handed, Z-up board coordinates and
  // counterclockwise degree rotations. Altium stores MODEL.3D.ROTX/Y/Z in the
  // model's projected frame. Circuit JSON stores one board-world Euler
  // rotation, so a bottom BODYPROJECTION is expressed as a 180-degree +X fold;
  // that projected-frame fold also reverses the model's +Z rotation.
  if (layer === "bottom") {
    return {
      x: normalizeAltiumAngle(modelCcwRotationDegrees.x + 180),
      y: modelCcwRotationDegrees.y,
      z: normalizeAltiumAngle(-modelCcwRotationDegrees.z),
    }
  }

  return modelCcwRotationDegrees
}
