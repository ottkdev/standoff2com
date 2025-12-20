'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

interface ProfileLinkProps {
  username: string
  isVerified?: boolean
  className?: string
  noLink?: boolean // When true, renders as span (for use inside other Links)
}

export function ProfileLink({ username, isVerified, className, noLink }: ProfileLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!noLink) {
      router.push(`/profile/${username}`)
    }
  }

  const content = (
    <>
      <span>{username}</span>
      {isVerified ? (
        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : null}
    </>
  )

  if (noLink) {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${className || ''}`}
      >
        {content}
      </span>
    )
  }

  return (
    <Link 
      href={`/profile/${username}`} 
      className={`inline-flex items-center gap-1 ${className || ''}`}
      onClick={handleClick}
    >
      {content}
    </Link>
  )
}

export default ProfileLink

