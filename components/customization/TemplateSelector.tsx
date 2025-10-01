/**
 * Template Selector
 *
 * Grid of template cards for quick template switching.
 *
 * @module components/customization/TemplateSelector
 */

'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTemplateStore, useTemplateId } from '@/stores/templateStore'
import { listTemplates } from '@/libs/templates/registry'
import { cn } from '@/libs/utils'

/**
 * Template selector grid component
 */
export function TemplateSelector(): React.ReactElement {
  const templates = listTemplates()
  const currentTemplateId = useTemplateId()
  const selectTemplate = useTemplateStore((state) => state.selectTemplate)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Select Template</h3>
        <p className="text-sm text-gray-500">
          Choose a template layout for your resume
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = template.metadata.id === currentTemplateId

          return (
            <Card
              key={template.metadata.id}
              className={cn(
                'relative cursor-pointer border-2 transition-all hover:border-lime-500',
                isSelected ? 'border-lime-500 bg-lime-50' : 'border-gray-200'
              )}
              onClick={() => selectTemplate(template.metadata.id)}
            >
              <div className="p-4 space-y-3">
                {/* Thumbnail placeholder */}
                <div className="aspect-[4/5] bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400">{template.metadata.name}</span>
                </div>

                {/* Template info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {template.metadata.name}
                    </h4>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {template.metadata.description}
                  </p>
                  {template.metadata.atsScore && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        ATS Score:
                      </span>
                      <span className="text-xs font-bold text-lime-600">
                        {template.metadata.atsScore}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
