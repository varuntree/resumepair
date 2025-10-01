/**
 * Template Card
 *
 * Individual template card for gallery display.
 *
 * @module components/templates/TemplateCard
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TemplateMetadata } from '@/types/template'

interface TemplateCardProps {
  template: TemplateMetadata
}

/**
 * Template card component for gallery
 */
export function TemplateCard({ template }: TemplateCardProps): React.ReactElement {
  const router = useRouter()

  const handleUseTemplate = () => {
    router.push(`/editor/new?template=${template.id}`)
  }

  return (
    <Card className="group overflow-hidden border-gray-200 transition-all hover:shadow-lg hover:border-lime-500">
      {/* Thumbnail */}
      <div className="aspect-[4/5] bg-gray-100 border-b border-gray-200 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-sm">{template.name} Template</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            {template.atsScore && (
              <Badge variant="outline" className="bg-lime-50 text-lime-700 border-lime-300">
                {template.atsScore}/100
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>

        {/* Features */}
        {template.features && template.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {template.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        )}

        {/* Action */}
        <Button
          onClick={handleUseTemplate}
          className="w-full bg-lime-500 hover:bg-lime-600 text-black"
        >
          Use Template
        </Button>
      </div>
    </Card>
  )
}
