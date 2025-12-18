'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

interface ProfileLinkProps {
  username: string
  isVerified?: boolean
  className?: string
}

export function ProfileLink({ username, isVerified, className }: ProfileLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Link 
      href={`/profile/${username}`} 
      className={`inline-flex items-center gap-1 ${className || ''}`}
      onClick={handleClick}
    >
      <span>{username}</span>
      {isVerified ? (
        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : null}
    </Link>
  )
}

