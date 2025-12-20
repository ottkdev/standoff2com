'use client'

import { Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          view === 'grid' && 'bg-primary text-primary-foreground'
        )}
        onClick={() => onViewChange('grid')}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          view === 'list' && 'bg-primary text-primary-foreground'
        )}
        onClick={() => onViewChange('list')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ViewToggle

