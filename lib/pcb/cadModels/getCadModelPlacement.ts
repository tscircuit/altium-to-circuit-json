import type { AltiumComponentBodyRecord, AltiumPoint } from "altiumts"
import type { PcbBoard, Point3 } from "circuit-json"
import { toMillimeterPoint } from "../geometry"

interface CadModelPlacement {
  modelOriginPosition: Point3
  position: { x: number; y: number }
}

export function getCadModelPlacement({
  body,
  componentPosition,
  pcbBoard,
}: {
  body: AltiumComponentBodyRecord
  componentPosition: AltiumPoint | undefined
  pcbBoard: PcbBoard | undefined
}): CadModelPlacement | undefined {
  const modelPosition = body.modelPosition
  if (!modelPosition) return undefined

  const modelPositionMillimeters = toMillimeterPoint(modelPosition)
  const defaultPlacement: CadModelPlacement = {
    modelOriginPosition: { x: 0, y: 0, z: 0 },
    position: modelPositionMillimeters,
  }
  if (
    !componentPosition ||
    !pcbBoard ||
    pcbBoard.width === undefined ||
    pcbBoard.height === undefined
  ) {
    return defaultPlacement
  }

  const componentPositionMillimeters = toMillimeterPoint(componentPosition)
  const modelOffset = {
    x: modelPositionMillimeters.x - componentPositionMillimeters.x,
    y: modelPositionMillimeters.y - componentPositionMillimeters.y,
  }
  const distanceFromComponent = Math.hypot(modelOffset.x, modelOffset.y)
  const boardDiagonal = Math.hypot(pcbBoard.width, pcbBoard.height)

  if (distanceFromComponent <= boardDiagonal) return defaultPlacement

  // Some embedded STEP files use board-global coordinates and retain that
  // offset in MODEL.2D. Move the CAD element to its owning component while
  // preserving the STEP coordinate origin needed to place its mesh locally.
  return {
    modelOriginPosition: { ...modelOffset, z: 0 },
    position: componentPositionMillimeters,
  }
}
