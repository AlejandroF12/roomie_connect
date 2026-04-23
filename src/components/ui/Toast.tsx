import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  addToast: (message: string, type: ToastType) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Escuchar eventos globales del helper `toast.success / toast.error`
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail
      addToast(message, type)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              toast={t}
              onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-indigo-600 text-white',
}

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    // Auto-remove handled by provider, but allow manual close
  }, [])

  return (
    <div
      role="alert"
      className={[
        'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg min-w-[280px] max-w-sm',
        typeClasses[toast.type],
      ].join(' ')}
    >
      {typeIcons[toast.type]}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="ml-2 rounded p-0.5 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}

// ─── Convenience object (toast.success / toast.error) ────────────────────────
// Para usarlo fuera de componentes, se puede usar el hook directamente.
// Este objeto es un helper para uso dentro de componentes React.

export const toast = {
  success: (message: string) => {
    // Dispatch a custom event that the ToastProvider listens to
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'success' } }))
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }))
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'info' } }))
  },
}
