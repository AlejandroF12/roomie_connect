import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface LoginFormProps {
  onSubmit: (data: LoginInput) => void
  isLoading?: boolean
  error?: string | null
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="text-right">
        <Link
          to="/auth/reset-password"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-indigo-600 hover:underline font-medium">
          Regístrate
        </Link>
      </p>
    </form>
  )
}
