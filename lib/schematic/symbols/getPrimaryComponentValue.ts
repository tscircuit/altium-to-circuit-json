export function getPrimaryComponentValue(componentValue: string): string {
  return componentValue.split(/[_/\s]+/u).find(Boolean) ?? componentValue
}
