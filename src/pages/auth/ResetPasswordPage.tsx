import { useRequestPasswordReset } from '@/hooks/useAuth'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { Card } from '@/components/ui/Card'
import type { ResetPasswordInput } from '@/schemas/auth.schema'

export function ResetPasswordPage() {
  const resetPassword = useRequestPasswordReset()

  const handleSubmit = (data: ResetPasswordInput) => {
    resetPassword.mutate(data.email)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
        </div>

        <Card className="p-6">
          <PasswordResetForm
            onSubmit={handleSubmit}
            isLoading={resetPassword.isPending}
            isSuccess={resetPassword.isSuccess}
            error={resetPassword.error?.message ?? null}
          />
        </Card>
      </div>
    </div>
  )
}
