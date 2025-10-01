/* eslint-disable no-unused-vars */
'use client'
/**
 * Customization Tabs
 *
 * Tab navigation for customization panel sections.
 *
 * @module components/customization/CustomizationTabs
 */

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CustomizationTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

/**
 * Tab navigation for customization panel
 */
export function CustomizationTabs({ activeTab, onTabChange }: CustomizationTabsProps): React.ReactElement {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="template">Template</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="typography">Typography</TabsTrigger>
        <TabsTrigger value="spacing">Spacing</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
