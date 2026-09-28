import { convertPcbCourtyards } from "../courtyards"
import type { PcbConversionContext } from "../model"
import { createComponents } from "./createComponents"

export function convertPcbComponents(context: PcbConversionContext): void {
  if (context.options.includeComponents === false) return
  context.elements.push(...context.componentContext.elements)
  context.elements.push(
    ...createComponents(context.document, context.componentContext),
  )
  if (context.options.includeCourtyards !== false) {
    context.elements.push(...convertPcbCourtyards(context.document))
  }
}
