export type FlowItemMeasurement = {
  element: HTMLElement
  height: number
  marginTop: number
  marginBottom: number
  splittable: boolean
  groupId?: string
}

export type FlowSubItemMeasurement = {
  element: HTMLElement
  index: number
  height: number
}

export type FlowSlice =
  | {
      type: 'whole'
      item: FlowItemMeasurement
      height: number
    }
  | {
      type: 'subslice'
      item: FlowItemMeasurement
      from: number
      to: number
      height: number
    }

export type PaginatedPage = {
  slices: FlowSlice[]
  contentHeight: number
}

export type PaginationResult = {
  pages: PaginatedPage[]
  totalHeight: number
}

export type PaginationOptions = {
  pageInnerHeight: number
  allowWidowOrphans?: boolean
}
