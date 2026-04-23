import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import type { LoginInput, RegisterInput } from '@/schemas/auth.schema'

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Obtiene la sesión activa del usuario.
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => authService.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Inicia sesión y redirige según el rol del usuario:
 * - 'admin' → /admin
 * - 'user'  → /
 */
export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: LoginInput) => authService.login(params),
    onSuccess: async (data) => {
      const userId = data.user?.id
      if (!userId) return

      // Invalidar sesión para que se recargue
      await queryClient.invalidateQueries({ queryKey: ['session'] })

      // Obtener perfil para determinar el rol
      const profile = await profileService.getProfile(userId)

      if (profile.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    },
  })
}

/**
 * Registra un nuevo usuario.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (params: RegisterInput) => authService.register(params),
  })
}

/**
 * Cierra la sesión activa y limpia el caché de TanStack Query.
 */
export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })
}

/**
 * Solicita el envío de un email de restablecimiento de contraseña.
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  })
}

/**
 * Actualiza la contraseña del usuario autenticado.
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (password: string) => authService.updatePassword(password),
  })
}
