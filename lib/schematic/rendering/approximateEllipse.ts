/** Approximate an Altium ellipse with a closed Circuit JSON path. */
export function approximateEllipse({
  center,
  radiusX,
  radiusY,
}: {
  center: { x: number; y: number }
  radiusX: number
  radiusY: number
}): Array<{ x: number; y: number }> {
  return Array.from({ length: 49 }, (_, index) => {
    const radians = (index / 48) * Math.PI * 2
    return {
      x: center.x + Math.cos(radians) * radiusX,
      y: center.y + Math.sin(radians) * radiusY,
    }
  })
}
