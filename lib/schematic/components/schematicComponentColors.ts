// Match the default tscircuit schematic palette. Circuit JSON graphics carry
// CSS colors, unlike catalog symbols which use semantic color aliases.
export const SCHEMATIC_COMPONENT_COLORS = {
  outline: "#840000",
  body: "#ffffc2",
  label: "#0f0f0f",
  pinName: "#006464",
  pinNumber: "#a90000",
} as const
