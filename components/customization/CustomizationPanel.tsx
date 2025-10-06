/**
 * Customization Panel
 *
 * Main container for template and appearance customization.
 * Combines all customization components with tabbed navigation.
 *
 * @module components/customization/CustomizationPanel
 */

'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { CustomizationHeader } from './CustomizationHeader'
import { CustomizationTabs } from './CustomizationTabs'
import { TemplateSelector } from './TemplateSelector'
import { ColorCustomizer } from './ColorCustomizer'
import { TypographyCustomizer } from './TypographyCustomizer'
import { SpacingCustomizer } from './SpacingCustomizer'
import { IconCustomizer } from './IconCustomizer'
import { CustomizationPresets } from './CustomizationPresets'

/**
 * Main customization panel component
 */
export function CustomizationPanel(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState('template')

  return (
    <div className="h-full flex flex-col min-h-0">
      <CustomizationHeader title="Customize Resume" />

      <div className="flex-1 min-h-0 p-6">
        <Card className="border-gray-200">
          <div className="p-6 space-y-6">
            <CustomizationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Template Tab */}
            {activeTab === 'template' && (
              <div className="space-y-6 pt-4">
                <TemplateSelector />
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-6 pt-4">
                <CustomizationPresets />
                <div className="border-t border-gray-200 pt-6">
                  <ColorCustomizer />
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div className="space-y-6 pt-4">
                <TypographyCustomizer />
                <div className="border-t border-gray-200 pt-6">
                  <IconCustomizer />
                </div>
              </div>
            )}

            {/* Spacing Tab */}
            {activeTab === 'spacing' && (
              <div className="pt-4">
                <SpacingCustomizer />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
