import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSession, useLogout } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export function Header() {
  const { data: session } = useSession()
  const { data: profile } = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={[
        'text-sm font-medium transition-colors',
        location.pathname === to
          ? 'text-violet-600'
          : 'text-slate-600 hover:text-violet-600',
      ].join(' ')}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Roomie Connect — inicio">
          <Logo size="sm" />
        </Link>

        {/* Desktop */}
        <nav className="hidden sm:flex items-center gap-4">
          {navLink('/about', 'Acerca de')}

          {session ? (
            <>
              {isAdmin && navLink('/admin', 'Administración')}
              {navLink('/favorites', 'Favoritos')}
              {navLink('/my-rooms', 'Mis rooms')}

              <Button variant="primary" size="sm" onClick={() => navigate('/rooms/new')}>
                Publicar room
              </Button>

              <Link to="/profile" className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity" aria-label="Mi perfil">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username ?? 'Avatar'}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-sm font-semibold">
                    {profile?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </Link>

              <Button variant="ghost" size="sm" isLoading={logout.isPending} onClick={() => logout.mutate()}>
                Salir
              </Button>
            </>
          ) : (
            <>
              {navLink('/login', 'Iniciar sesión')}
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-3">
          {navLink('/about', 'Acerca de')}
          {session ? (
            <>
              {isAdmin && navLink('/admin', 'Administración')}
              {navLink('/favorites', 'Favoritos')}
              {navLink('/my-rooms', 'Mis rooms')}
              {navLink('/profile', 'Mi perfil')}
              <button
                onClick={() => { logout.mutate(); setMobileOpen(false) }}
                className="text-left text-sm font-medium text-red-500 hover:text-red-600"
              >
                Cerrar sesión
              </button>
              <Button variant="primary" size="sm" onClick={() => { navigate('/rooms/new'); setMobileOpen(false) }}>
                Publicar room
              </Button>
            </>
          ) : (
            <>
              {navLink('/login', 'Iniciar sesión')}
              <Button variant="primary" size="sm" onClick={() => { navigate('/register'); setMobileOpen(false) }}>
                Registrarse
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
