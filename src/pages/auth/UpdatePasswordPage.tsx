import { useNavigate } from 'react-router-dom'
import { useUpdatePassword } from '@/hooks/useAuth'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import { Card } from '@/components/ui/Card'
import type { UpdatePasswordInput } from '@/schemas/auth.schema'
import { useEffect } from 'react'

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const updatePassword = useUpdatePassword()

  const handleSubmit = (data: UpdatePasswordInput) => {
    updatePassword.mutate(data.password)
  }

  // Redirigir a /login tras éxito
  useEffect(() => {
    if (updatePassword.isSuccess) {
      const timer = setTimeout(() => navigate('/login'), 2000)
      return () => clearTimeout(timer)
    }
  }, [updatePassword.isSuccess, navigate])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-gray-600">Elige una contraseña segura</p>
        </div>

        <Card className="p-6">
          {updatePassword.isSuccess ? (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800 text-center">
              <p className="font-medium">¡Contraseña actualizada!</p>
              <p className="mt-1">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <UpdatePasswordForm
              onSubmit={handleSubmit}
              isLoading={updatePassword.isPending}
              error={updatePassword.error?.message ?? null}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
