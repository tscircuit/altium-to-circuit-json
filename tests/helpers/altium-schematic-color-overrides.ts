import type { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

type SchematicColorOverrides = NonNullable<
  NonNullable<
    Parameters<typeof convertCircuitJsonToSchematicSvg>[1]
  >["colorOverrides"]
>["schematic"]

export const ALTIUM_SCHEMATIC_COLOR_OVERRIDES = {
  background: "#fffef8",
  component_body: "#ffffb0",
  component_outline: "#800000",
  junction: "#008800",
  label_background: "transparent",
  label_global: "#0000ff",
  net_name: "#334155",
  no_connect: "#ff0000",
  pin: "#800000",
  pin_name: "#800000",
  pin_number: "#800000",
  reference: "#000080",
  sheet: "#334155",
  sheet_label: "#000080",
  value: "#000080",
  wire: "#008800",
} satisfies SchematicColorOverrides
