/**
 * tscircuit currently uses compact, schematic-only drawing units whose scale
 * is independent of PCB millimeters. Keep assumptions about those units here
 * so a future tscircuit unit migration does not require changing conversion
 * algorithms throughout the importer.
 */
export const TSCIRCUIT_SCHEMATIC_UNIT_CONVENTIONS = {
  millimetersPerUnit: 10.16 / 1.1,
  sheet: {
    heightMillimeters: 210,
    insetMillimeters: 5,
    widthMillimeters: 297,
  },
  genericComponent: {
    /** Default `schPinSpacing` used by @tscircuit/core. */
    pinPitch: 0.2,
    /** Default distance from a generic box edge to its port terminal. */
    portDistanceFromEdge: 0.4,
    /** Width estimate used by @tscircuit/core for generic-box pin labels. */
    pinLabelCharacterWidth: 0.1,
    /** Additional body width used when a generic box has pin labels. */
    pinLabelHorizontalPadding: 1.1,
    /** Gap between a generic box (or its horizontal port) and body text. */
    textOffsetFromBody: 0.13,
  },
} as const
