import { AltiumBinaryPcbDoc, AltiumComponentBodyRecord } from "altiumts"
import type { CadComponent } from "circuit-json"
import { DEFAULT_BOARD_THICKNESS_MM } from "../board/constants"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
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

    const layer = component.side === "bottom" ? "bottom" : "top"
    const standoffHeight = milsToMillimeters(body.standoffHeightMils ?? 0)
    const boardSurfaceZ = DEFAULT_BOARD_THICKNESS_MM / 2
    const positionZ =
      layer === "bottom"
        ? -boardSurfaceZ - standoffHeight
        : boardSurfaceZ + standoffHeight

    return [
      {
        type: "cad_component",
        cad_component_id: `cad_component_altium_${bodyIndex}`,
        pcb_component_id: pcbComponentId,
        source_component_id: `source_component_altium_${componentIndex}`,
        position: { ...toMillimeterPoint(modelPosition), z: positionZ },
        rotation: body.modelRotation3d,
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
