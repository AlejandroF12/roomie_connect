import React from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-400 disabled:bg-violet-300',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
  danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 disabled:bg-red-300',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300 disabled:text-slate-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
