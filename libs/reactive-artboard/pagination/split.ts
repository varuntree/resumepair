import { FlowItemMeasurement, FlowSubItemMeasurement } from './blockTypes'
import { measureSubItems } from './measure'

export function getSubItemMeasurements(item: FlowItemMeasurement): FlowSubItemMeasurement[] {
  return measureSubItems(item.element)
}

export function sumSubItemHeights(
  subItems: FlowSubItemMeasurement[],
  from: number,
  to: number
): number {
  const start = Math.max(0, from)
  const end = Math.min(subItems.length, to)
  let total = 0
  for (let index = start; index < end; index += 1) {
    total += subItems[index]?.height ?? 0
  }
  return total
}
