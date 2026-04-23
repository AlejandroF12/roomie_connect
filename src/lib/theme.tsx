import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} })

// Aplica el tema al DOM inmediatamente (sin esperar React)
function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Inicializar tema antes de que React monte (evita flash)
const storedTheme = (localStorage.getItem('theme') as Theme) ?? 'light'
applyTheme(storedTheme)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(storedTheme)

  const toggle = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      applyTheme(next)
      localStorage.setItem('theme', next)
      return next
    })
  }

  // Sincronizar si cambia desde otra pestaña
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const next = e.newValue as Theme
        applyTheme(next)
        setTheme(next)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
