import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
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
import { AboutPage } from '@/pages/AboutPage'
import { AdminPage } from '@/pages/AdminPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { UpdatePasswordPage } from '@/pages/auth/UpdatePasswordPage'

// ─── Guards ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner size="lg" />
    </div>
  )
}

function ProtectedRoute() {
  const { data: session, isLoading } = useSession()
  if (isLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useProfile()
  if (sessionLoading || profileLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

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

// ─── AppRoutes ───────────────────────────────────────────────

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/rooms/:id" element={<RoomDetailPage />} />

      {/* Auth (redirigen si ya hay sesión) */}
      <Route element={<RoleRedirect />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Recuperación de contraseña */}
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/my-rooms" element={<MyRoomsPage />} />
        <Route path="/rooms/new" element={<CreateRoomPage />} />
        <Route path="/rooms/:id/edit" element={<EditRoomPage />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
