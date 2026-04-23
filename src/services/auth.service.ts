import { supabase } from '@/lib/supabase'
import type { RegisterInput, LoginInput } from '@/schemas/auth.schema'

// ─── Mapeo de errores de Supabase a mensajes amigables ───────

function mapAuthError(message: string): string {
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'Este email ya está registrado.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Debes verificar tu email antes de iniciar sesión.'
  }
  if (message.includes('Token has expired') || message.includes('invalid token')) {
    return 'El enlace de restablecimiento no es válido o ha expirado.'
  }
  if (message.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  return message
}

// ─── Servicio de autenticación ───────────────────────────────

export const authService = {
  /**
   * Registra un nuevo usuario con email y contraseña.
   * Supabase enviará un email de verificación automáticamente.
   */
  async register({ email, password }: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(mapAuthError(error.message))
    return data
  },

  /**
   * Inicia sesión con email y contraseña.
   */
  async login({ email, password }: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(mapAuthError(error.message))
    return data
  },

  /**
   * Cierra la sesión activa del usuario.
   */
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(mapAuthError(error.message))
  },

  /**
   * Envía un email con enlace de restablecimiento de contraseña.
   * Siempre retorna sin revelar si el email existe o no.
   */
  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    // No lanzamos error para no revelar si el email existe
    if (error) console.error('requestPasswordReset:', error.message)
  },

  /**
   * Actualiza la contraseña del usuario autenticado.
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(mapAuthError(error.message))
    return data
  },

  /**
   * Obtiene la sesión activa del usuario.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(mapAuthError(error.message))
    return data.session
  },
}
