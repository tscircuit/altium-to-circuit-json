import type { AltiumPoint } from "altiumts"
import { pointsEqual, scalePoint } from "../geometry"
import type { ConvertedPort } from "../model"

export function getPortIdAtElectricalPoint(
  port: ConvertedPort | undefined,
  electricalPoint: AltiumPoint,
  scale: number,
): string | undefined {
  if (!port?.isSchematicVisible) return undefined
  return pointsEqual(
    port.schematicPort.center,
    scalePoint(electricalPoint, scale),
  )
    ? port.schematicPort.schematic_port_id
    : undefined
}
