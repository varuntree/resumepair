/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import type { ResumeJson } from '@/types/resume'

export interface EditorFormProps {
  documentId: string
  document: ResumeJson
  onSubmit: () => void
  onChange?: (value: ResumeJson) => void
  children: React.ReactNode
  containerClassName?: string
}

export function EditorForm({
  documentId,
  document,
  onSubmit,
  onChange,
  children,
  containerClassName,
}: EditorFormProps): React.ReactElement {
  const methods = useForm<ResumeJson>({
    resolver: zodResolver(ResumeJsonSchema),
    defaultValues: document,
    mode: 'onBlur',
  })

  // Watch for changes
  React.useEffect(() => {
    const subscription = methods.watch((data) => {
      if (onChange && data) {
        onChange(data as ResumeJson)
      }
    })
    return () => subscription.unsubscribe()
  }, [methods, onChange])

  // Reset form only when switching documents (by id)
  const prevDocIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (prevDocIdRef.current !== documentId) {
      methods.reset(document)
      prevDocIdRef.current = documentId
    }
  }, [documentId, document, methods])

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={containerClassName || "max-w-4xl mx-auto p-6 space-y-8"}
      >
        {children}
      </form>
    </FormProvider>
  )
}
