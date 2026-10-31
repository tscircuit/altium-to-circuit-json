import type { AltiumPcbDocument } from "altiumts"
import type { PcbClearanceRule, PcbClearanceScope } from "circuit-json"
import type { PcbCopperLayerMap } from "../layers"
import { milsToMillimeters } from "../geometry"

/** Compile selectors, retaining expressions we cannot evaluate explicitly. */
export function getPcbClearanceRules({
  document,
  layerMap,
}: {
  document: AltiumPcbDocument
  layerMap: PcbCopperLayerMap
}): PcbClearanceRule[] {
  const netIdsByName = new Map(
    document.nets.map((net, index) => [
      net.name?.toUpperCase(),
      `source_net_altium_pcb_${index}`,
    ]),
  )
  const classRecords = document.records.filter(
    (record) => record.recordKind === "Class",
  )
  const classMembers = (name: string, kind: string): string[] | undefined => {
    const record = classRecords.find(
      (record) =>
        record.get("NAME")?.toUpperCase() === name.toUpperCase() &&
        record.get("KIND") === kind,
    )
    return record?.fields
      .filter((field) => /^(?:M|MEMBER)\d+$/iu.test(field.key))
      .map((field) => field.value)
  }
  const compile = (expression: string): PcbClearanceScope => {
    // Strings are single-quoted with doubled-quote escaping in Altium queries.
    const tokens =
      expression.match(/'(?:''|[^'])*'|[A-Za-z_][A-Za-z_0-9]*|[(),]|\S/gu) ?? []
    let position = 0
    const peek = () => tokens[position]?.toUpperCase()
    const unsupported = (): PcbClearanceScope => ({
      type: "unsupported",
      expression,
    })
    const atom = (): PcbClearanceScope => {
      if (peek() === "NOT") {
        position++
        return { type: "not", scope: atom() }
      }
      if (peek() === "(") {
        position++
        const scope = disjunction()
        if (peek() !== ")") throw new Error("Unbalanced scope")
        position++
        return scope
      }
      const name = peek()
      position++
      let argument: string | undefined
      if (peek() === "(") {
        position++
        const token = tokens[position++]
        if (!token?.startsWith("'") || !token.endsWith("'"))
          throw new Error("Expected quoted argument")
        argument = token.slice(1, -1).replace(/''/gu, "'")
        if (peek() !== ")") throw new Error("Expected closing parenthesis")
        position++
      }
      if (
        argument !== undefined &&
        !["ONLAYER", "INNET", "INNETCLASS", "INCOMPONENTCLASS"].includes(
          name ?? "",
        )
      )
        return unsupported()
      switch (name) {
        case "ALL":
          return { type: "all" }
        case "INANYNET":
          return { type: "property", property: "has_net" }
        case "ISKEEPOUT":
        case "KEEPOUT":
          return { type: "property", property: "is_keepout" }
        case "INPOLYGON":
        case "INPOLY":
          return { type: "property", property: "in_polygon" }
        case "ISFREE":
          return { type: "property", property: "is_free" }
        case "ISPAD":
          return { type: "kind", kinds: ["pad"] }
        case "ISVIA":
          return { type: "kind", kinds: ["via"] }
        case "ONTOPLAYER":
          return { type: "layer", layers: ["top"] }
        case "ONBOTTOMLAYER":
          return { type: "layer", layers: ["bottom"] }
        case "ONLAYER": {
          const layer = layerMap.getLayer(argument)
          return layer ? { type: "layer", layers: [layer] } : unsupported()
        }
        case "INNET": {
          const netId = netIdsByName.get(argument?.toUpperCase())
          return netId ? { type: "net", net_ids: [netId] } : unsupported()
        }
        case "INNETCLASS": {
          const members =
            argument === undefined ? undefined : classMembers(argument, "0")
          if (!members) return unsupported()
          const ids = members.map((member) =>
            netIdsByName.get(member.toUpperCase()),
          )
          // Class tables can retain deleted nets. Only members present in the
          // document net table can own copper (PMP22650 retains NetU42_13).
          return { type: "net", net_ids: ids.filter((id) => id !== undefined) }
        }
        case "INCOMPONENTCLASS": {
          const members =
            argument === undefined ? undefined : classMembers(argument, "1")
          return members
            ? { type: "component", component_names: members }
            : unsupported()
        }
        default:
          return unsupported()
      }
    }
    const conjunction = (): PcbClearanceScope => {
      const scopes = [atom()]
      while (peek() === "AND") {
        position++
        scopes.push(atom())
      }
      return scopes.length === 1 ? scopes[0]! : { type: "and", scopes }
    }
    const disjunction = (): PcbClearanceScope => {
      const scopes = [conjunction()]
      while (peek() === "OR") {
        position++
        scopes.push(conjunction())
      }
      return scopes.length === 1 ? scopes[0]! : { type: "or", scopes }
    }
    try {
      const scope = disjunction()
      return position === tokens.length ? scope : unsupported()
    } catch {
      // Preserve the exact expression; consumers must report an unverified rule.
      return unsupported()
    }
  }
  return document.rules
    .filter((rule) => rule.ruleKind?.toUpperCase() === "CLEARANCE")
    .map((rule, index) => {
      const clearanceMils = rule.clearanceMils
      if (
        clearanceMils === undefined ||
        !Number.isFinite(clearanceMils) ||
        clearanceMils < 0
      ) {
        throw new Error(
          `Clearance rule ${rule.name || "unnamed rule"} has no valid copper gap`,
        )
      }
      const source_scope1 = rule.scope1Expression ?? "All"
      const source_scope2 = rule.scope2Expression ?? "All"
      return {
        name: rule.name || `Clearance rule ${index + 1}`,
        priority: rule.priority ?? index + 1,
        enabled: rule.enabled !== false,
        clearance: milsToMillimeters(clearanceMils),
        scope1: compile(source_scope1),
        scope2: compile(source_scope2),
        source_scope1,
        source_scope2,
      }
    })
}
