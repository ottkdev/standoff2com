'use client'

import { useMounted } from '@/hooks/use-mounted'
import { formatRelativeTime, formatDate } from '@/lib/utils'

interface RelativeTimeProps {
  date: Date | string
  className?: string
}

/**
 * Client-only component for relative time display
 * Prevents hydration mismatch by ensuring server and client render identically
 * on initial render, then updates after mount
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const mounted = useMounted()
  
  // Calculate relative time using the same logic on both server and client
  // The key is to use the date's timestamp, not "now"
  const d = typeof date === 'string' ? new Date(date) : date
  const dateTime = d.getTime()
  
  // On initial render (server + first client render), use a stable calculation
  // We'll use the date itself to determine the format, not "now"
  // This ensures server and client match
  if (!mounted) {
    // For initial render, use absolute date format (stable, no "now" dependency)
    // This prevents hydration mismatch
    const formatted = formatDate(d)
    return <span className={className}>{formatted}</span>
  }
  
  // After mount, use the actual relative time function
  // This will update based on client's current time
  return <span className={className}>{formatRelativeTime(date)}</span>
}

