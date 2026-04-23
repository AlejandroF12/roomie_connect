import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Spinner } from '@/components/ui/Spinner'

// ─── Páginas ─────────────────────────────────────────────────
import { HomePage } from '@/pages/HomePage'
import { RoomDetailPage } from '@/pages/RoomDetailPage'
import { CreateRoomPage } from '@/pages/CreateRoomPage'
import { EditRoomPage } from '@/pages/EditRoomPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { MyRoomsPage } from '@/pages/MyRoomsPage'
import { AdminPage } from '@/pages/AdminPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { UpdatePasswordPage } from '@/pages/auth/UpdatePasswordPage'

// ─── Guards ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

/**
 * ProtectedRoute: redirige a /login si no hay sesión activa.
 * Muestra un spinner mientras se verifica la sesión.
 */
function ProtectedRoute() {
  const { data: session, isLoading } = useSession()

  if (isLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

/**
 * AdminRoute: redirige a /login si no hay sesión, o a / si el rol no es 'admin'.
 */
function AdminRoute() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (sessionLoading || profileLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}

/**
 * RoleRedirect: si el usuario ya tiene sesión activa y accede a /login o /register,
 * lo redirige según su rol (admin → /admin, user → /).
 */
function RoleRedirect() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (sessionLoading || profileLoading) return <LoadingScreen />

  if (session && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// ─── Router ──────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Rutas públicas
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/rooms/:id',
    element: <RoomDetailPage />,
  },

  // Rutas de autenticación (redirigen si ya hay sesión)
  {
    element: <RoleRedirect />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // Rutas de recuperación de contraseña (siempre accesibles)
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth/update-password',
    element: <UpdatePasswordPage />,
  },

  // Rutas protegidas (requieren sesión)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/profile', element: <ProfilePage /> },
      { path: '/favorites', element: <FavoritesPage /> },
      { path: '/my-rooms', element: <MyRoomsPage /> },
      { path: '/rooms/new', element: <CreateRoomPage /> },
      { path: '/rooms/:id/edit', element: <EditRoomPage /> },
    ],
  },

  // Rutas de administración (requieren rol 'admin')
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin', element: <AdminPage /> },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
