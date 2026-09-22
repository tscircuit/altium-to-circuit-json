import type { AltiumPoint, AltiumRecord } from "altiumts"

import type { SchematicPointKey } from "../geometry"
import type { SchematicSegmentKey } from "../identifiers"

export interface PrunableSegment {
  endKey: SchematicPointKey
  key: SchematicSegmentKey
  startKey: SchematicPointKey
}

export interface MutableSemanticNet {
  id: SchematicPointKey
  names: Set<string>
  points: Map<SchematicPointKey, AltiumPoint>
  records: Set<AltiumRecord>
}
