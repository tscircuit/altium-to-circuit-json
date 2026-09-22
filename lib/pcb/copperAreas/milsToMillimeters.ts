import { MILS_TO_MILLIMETERS } from "./constants"

export function milsToMillimeters(mils: number): number {
  return mils * MILS_TO_MILLIMETERS
}
