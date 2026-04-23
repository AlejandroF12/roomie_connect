import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={['rounded-xl bg-white shadow-sm border border-slate-200', className].join(' ')}>
      {children}
    </div>
  )
}
