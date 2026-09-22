import {
  type AltiumRecord,
  AltiumSchDesignatorRecord,
  AltiumSchParameterRecord,
  type AltiumSchPinRecord,
} from "altiumts"

export function findOwnedDesignator(
  records: AltiumRecord[],
): string | undefined {
  return records.find(
    (record): record is AltiumSchDesignatorRecord =>
      record instanceof AltiumSchDesignatorRecord &&
      record.getDecoded("NAME")?.toLowerCase() === "designator",
  )?.text
}

export function findOwnedParameterText(
  records: AltiumRecord[],
  name: string,
): string | undefined {
  return records.find(
    (record): record is AltiumSchParameterRecord =>
      record instanceof AltiumSchParameterRecord &&
      record.name?.toLowerCase() === name.toLowerCase(),
  )?.text
}

export function isOwnedRecordVisible(
  record: AltiumRecord,
  currentPartId: number,
): boolean {
  const ownerPartId = record.getNumber("OWNERPARTID")
  const ownerPartDisplayMode = record.getNumber("OWNERPARTDISPLAYMODE")
  return (
    (ownerPartId === undefined ||
      ownerPartId <= 0 ||
      ownerPartId === currentPartId) &&
    (ownerPartDisplayMode === undefined || ownerPartDisplayMode === 0)
  )
}

export function isPinHidden(pin: AltiumSchPinRecord): boolean {
  const pinConglomerate = pin.pinConglomerate
  return (
    pin.hidden === true ||
    (pinConglomerate !== undefined && (pinConglomerate & 0x04) !== 0)
  )
}

export function parsePinNumber(pinDesignator: string): number | undefined {
  const parsed = Number(pinDesignator)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}
