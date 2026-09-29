import type { AltiumPoint, SchematicPortDirection } from "altiumts"
import {
  applyToPoint,
  applyToPoints,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

export function getHierarchicalPortGeometry({
  height,
  location,
  pointAtEnd,
  pointAtStart,
  vertical,
  width,
}: {
  height: number
  location: AltiumPoint
  width: number
} & SchematicPortDirection): {
  points: AltiumPoint[]
  textLocation: AltiumPoint
} {
  const halfHeight = height / 2
  const pointDepth = Math.min(width * 0.22, height)
  const localPoints =
    pointAtStart && pointAtEnd
      ? [
          { x: 0, y: 0 },
          { x: pointDepth, y: halfHeight },
          { x: width - pointDepth, y: halfHeight },
          { x: width, y: 0 },
          { x: width - pointDepth, y: -halfHeight },
          { x: pointDepth, y: -halfHeight },
        ]
      : pointAtStart
        ? [
            { x: 0, y: 0 },
            { x: pointDepth, y: halfHeight },
            { x: width, y: halfHeight },
            { x: width, y: -halfHeight },
            { x: pointDepth, y: -halfHeight },
          ]
        : pointAtEnd
          ? [
              { x: 0, y: halfHeight },
              { x: width - pointDepth, y: halfHeight },
              { x: width, y: 0 },
              { x: width - pointDepth, y: -halfHeight },
              { x: 0, y: -halfHeight },
            ]
          : [
              { x: 0, y: halfHeight },
              { x: width, y: halfHeight },
              { x: width, y: -halfHeight },
              { x: 0, y: -halfHeight },
            ]
  const localPortToSchematicTransform = compose(
    translate(location.x, location.y),
    rotateDEG(vertical ? 90 : 0),
  )
  return {
    points: applyToPoints(localPortToSchematicTransform, localPoints),
    textLocation: applyToPoint(localPortToSchematicTransform, {
      x: width / 2,
      y: 0,
    }),
  }
}
