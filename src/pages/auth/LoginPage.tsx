import { useLogin } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card } from '@/components/ui/Card'
import type { LoginInput } from '@/schemas/auth.schema'

export function LoginPage() {
  const login = useLogin()

  const handleSubmit = (data: LoginInput) => {
    login.mutate(data)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h1>
          <p className="mt-2 text-sm text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        <Card className="p-6">
          <LoginForm
            onSubmit={handleSubmit}
            isLoading={login.isPending}
            error={login.error?.message ?? null}
          />
        </Card>
      </div>
    </div>
  )
}
