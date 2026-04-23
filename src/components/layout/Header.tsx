import { Link, useNavigate } from 'react-router-dom'
import { useSession, useLogout } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { data: session } = useSession()
  const { data: profile } = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Roomie Connect
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-3">
          {session ? (
            <>
              {/* Link admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Administración
                </Link>
              )}

              {/* Favoritos */}
              <Link
                to="/favorites"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Favoritos
              </Link>

              {/* Mis rooms */}
              <Link
                to="/my-rooms"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Mis rooms
              </Link>

              {/* Publicar room */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/rooms/new')}
              >
                Publicar room
              </Button>

              {/* Avatar + perfil */}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
                aria-label="Mi perfil"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username ?? 'Avatar'}
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold">
                    {profile?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </Link>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                isLoading={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Registrarse
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
