import { FlowItemMeasurement, FlowSubItemMeasurement } from './blockTypes'

const DATA_ITEM = '[data-flow-item]'
const DATA_SUBITEM = '[data-flow-subitem]'
const DATA_GROUP_ATTR = 'flowGroup'
const DATA_GROUP_SELECTOR = `[data-flow-group]`

const TRUE_VALUES = new Set(['true', '1', 'yes'])

const parseNumber = (value: string | null): number => {
  if (!value) return 0
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isSplittable = (element: HTMLElement): boolean => {
  const flag = element.dataset.flowSplittable
  return flag ? TRUE_VALUES.has(flag.toLowerCase()) : false
}

const getGroupId = (element: HTMLElement): string | undefined => {
  const groupEl = element.closest<HTMLElement>(DATA_GROUP_SELECTOR)
  if (!groupEl) return undefined
  const attr = groupEl.dataset[DATA_GROUP_ATTR as 'flowGroup']
  return attr ?? undefined
}

export function measureFlowItems(root: HTMLElement): FlowItemMeasurement[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(DATA_ITEM))
  return elements.map((element) => {
    const rect = element.getBoundingClientRect()
    const computed = window.getComputedStyle(element)
    const marginTop = parseNumber(computed.marginTop)
    const marginBottom = parseNumber(computed.marginBottom)
    return {
      element,
      height: rect.height,
      marginTop,
      marginBottom,
      splittable: isSplittable(element),
      groupId: getGroupId(element),
    }
  })
}

export function measureSubItems(item: HTMLElement): FlowSubItemMeasurement[] {
  const subItems = Array.from(item.querySelectorAll<HTMLElement>(DATA_SUBITEM))
  return subItems.map((element, index) => {
    const rect = element.getBoundingClientRect()
    const computed = window.getComputedStyle(element)
    const marginTop = parseNumber(computed.marginTop)
    const marginBottom = parseNumber(computed.marginBottom)
    return {
      element,
      index,
      height: rect.height + marginTop + marginBottom,
    }
  })
}
