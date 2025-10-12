import {
  FlowItemMeasurement,
  FlowSlice,
  PaginatedPage,
  PaginationOptions,
  PaginationResult,
} from './blockTypes'
import { getSubItemMeasurements, sumSubItemHeights } from './split'

const EPSILON = 0.001

const addSliceToPage = (page: PaginatedPage, slice: FlowSlice, height: number) => {
  page.slices.push(slice)
  page.contentHeight += height
}

const createEmptyPage = (): PaginatedPage => ({
  slices: [],
  contentHeight: 0,
})

const fits = (page: PaginatedPage, addition: number, pageInnerHeight: number): boolean => {
  return page.contentHeight + addition <= pageInnerHeight + EPSILON
}

const ensurePage = (pages: PaginatedPage[], page: PaginatedPage) => {
  if (page.slices.length > 0) {
    pages.push(page)
  }
}

export function paginate(
  items: FlowItemMeasurement[],
  options: PaginationOptions
): PaginationResult {
  const { pageInnerHeight, allowWidowOrphans = false } = options
  const pages: PaginatedPage[] = []
  let page = createEmptyPage()
  let totalHeight = 0

  const pushPage = () => {
    ensurePage(pages, page)
    page = createEmptyPage()
  }

  items.forEach((item) => {
    const baseHeight = item.height + item.marginTop + item.marginBottom
    const remaining = pageInnerHeight - page.contentHeight

    if (item.groupId && page.slices.length > 0 && baseHeight > remaining + EPSILON) {
      pushPage()
    }

    if (fits(page, baseHeight, pageInnerHeight)) {
      addSliceToPage(page, { type: 'whole', item, height: baseHeight }, baseHeight)
      return
    }

    if (!item.splittable) {
      if (page.slices.length > 0) {
        pushPage()
      }
      addSliceToPage(page, { type: 'whole', item, height: baseHeight }, baseHeight)
      pushPage()
      return
    }

    const subItems = getSubItemMeasurements(item)
    if (subItems.length === 0) {
      if (page.slices.length > 0) pushPage()
      addSliceToPage(page, { type: 'whole', item, height: baseHeight }, baseHeight)
      pushPage()
      return
    }

    let start = 0
    while (start < subItems.length) {
      if (page.contentHeight >= pageInnerHeight - EPSILON) {
        pushPage()
      }
      const available = pageInnerHeight - page.contentHeight
      if (available <= 0) {
        pushPage()
        continue
      }

      let end = start
      let sliceHeight = 0
      while (end < subItems.length) {
        const candidate = sumSubItemHeights(subItems, start, end + 1)
        const marginTop = start === 0 ? item.marginTop : 0
        const marginBottom = end + 1 === subItems.length ? item.marginBottom : 0
        const total = candidate + marginTop + marginBottom
        if (total > available + EPSILON) break
        sliceHeight = total
        end += 1
      }

      if (end === start) {
        // Force at least one subitem even if it overflows to prevent infinite loop.
        end = start + 1
        sliceHeight =
          sumSubItemHeights(subItems, start, end) +
          (start === 0 ? item.marginTop : 0) +
          (end === subItems.length ? item.marginBottom : 0)
      }

      // Widow/orphan control: avoid single-element slices when possible.
      if (!allowWidowOrphans && end - start === 1 && end < subItems.length && page.slices.length > 0) {
        const prevSlice = page.slices[page.slices.length - 1]
        if (prevSlice.type === 'subslice' && prevSlice.to - prevSlice.from > 1) {
          // Pull one subitem back from previous slice to balance.
          prevSlice.to -= 1
          const prevSubItems = sumSubItemHeights(subItems, prevSlice.from, prevSlice.to)
          const prevMarginBottom = prevSlice.to === subItems.length ? item.marginBottom : 0
          page.contentHeight -= prevSlice.height
          const prevHeight =
            prevSubItems +
            (prevSlice.from === 0 ? item.marginTop : 0) +
            prevMarginBottom
          prevSlice.height = prevHeight
          page.contentHeight += prevHeight
          start = prevSlice.to
          continue
        }
      }

      const slice: FlowSlice = {
        type: 'subslice',
        item,
        from: start,
        to: end,
        height: sliceHeight,
      }
      addSliceToPage(page, slice, sliceHeight)

      if (end >= subItems.length) {
        break
      }

      start = end
      pushPage()
    }
  })

  ensurePage(pages, page)

  totalHeight = pages.reduce((sum, current) => sum + current.contentHeight, 0)

  return {
    pages,
    totalHeight,
  }
}
