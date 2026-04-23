import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegister } from '@/hooks/useAuth'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { RegisterInput } from '@/schemas/auth.schema'

const REDIRECT_SECONDS = 5

function SuccessScreen() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    if (seconds <= 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds, navigate])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900">¡Revisa tu correo!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </p>

          {/* Contador */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-400">
              Redirigiendo al inicio de sesión en{' '}
              <span className="font-semibold text-indigo-600">{seconds}</span>s...
            </p>

            {/* Barra de progreso */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(seconds / REDIRECT_SECONDS) * 100}%` }}
              />
            </div>

            <Button variant="primary" className="mt-1 w-full" onClick={() => navigate('/login')}>
              Ir al inicio de sesión
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const register = useRegister()

  const handleSubmit = (data: RegisterInput) => {
    register.mutate(data)
  }

  if (register.isSuccess) {
    return <SuccessScreen />
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h1>
          <p className="mt-2 text-sm text-gray-600">Únete a Roomie Connect</p>
        </div>

        <Card className="p-6">
          <RegisterForm
            onSubmit={handleSubmit}
            isLoading={register.isPending}
            error={register.error?.message ?? null}
          />
        </Card>
      </div>
    </div>
  )
}
