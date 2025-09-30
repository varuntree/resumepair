'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface DocumentSearchProps {
  onSearch: (query: string) => void
  defaultValue?: string
}

export function DocumentSearch({
  onSearch,
  defaultValue = '',
}: DocumentSearchProps): React.ReactElement {
  const [query, setQuery] = React.useState(defaultValue)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setQuery(value)

    // Debounce search by 300ms
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search documents..."
        value={query}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}