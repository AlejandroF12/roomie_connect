import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface RegisterFormProps {
  onSubmit: (data: RegisterInput) => void
  isLoading?: boolean
  error?: string | null
}

export function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
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
        autoComplete="new-password"
        helperText="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
