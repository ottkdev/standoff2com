'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if component is mounted (client-side only)
 * Prevents hydration mismatches by ensuring client-only code runs after mount
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

