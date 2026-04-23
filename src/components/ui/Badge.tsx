import React from 'react'

type BadgeVariant =
  | 'active'
  | 'paused'
  | 'deleted'
  | 'pending'
  | 'review'
  | 'resolved'
  | 'rejected'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  deleted: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-700',
  review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
