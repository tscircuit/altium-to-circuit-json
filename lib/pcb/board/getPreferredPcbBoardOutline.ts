import {
  type AltiumPcbDocument,
  type AltiumPoint,
  getAltiumBounds,
} from "altiumts"
import { MIN_STALE_OUTLINE_AREA_RATIO } from "./constants"
import { getBoundsArea } from "./getBoundsArea"
import { getMatchingMechanicalBoardOutline } from "./getMatchingMechanicalBoardOutline"
import { getTightestEnclosingKeepoutOutline } from "./getTightestEnclosingKeepoutOutline"
import { isSimpleBoardOutline } from "./isSimpleBoardOutline"

export function getPreferredPcbBoardOutline(
  document: AltiumPcbDocument,
): AltiumPoint[] {
  const declaredOutline = document.boardGeometry.outline.points
  const declaredBounds = getAltiumBounds(declaredOutline)
  if (declaredBounds && !isSimpleBoardOutline(declaredOutline)) {
    const mechanicalOutline = getMatchingMechanicalBoardOutline({
      document,
      declaredBounds,
    })
    if (mechanicalOutline) return mechanicalOutline
  }
  const keepoutOutline = getTightestEnclosingKeepoutOutline(document)
  if (!keepoutOutline) return declaredOutline

  const keepoutBounds = getAltiumBounds(keepoutOutline)
  if (!keepoutBounds) return declaredOutline
  if (!declaredBounds || declaredOutline.length < 3) return keepoutOutline

  const declaredArea = getBoundsArea(declaredBounds)
  const keepoutArea = getBoundsArea(keepoutBounds)
  const declaredOutlineIsStale =
    declaredArea >= keepoutArea * MIN_STALE_OUTLINE_AREA_RATIO

  return declaredOutlineIsStale ? keepoutOutline : declaredOutline
}
