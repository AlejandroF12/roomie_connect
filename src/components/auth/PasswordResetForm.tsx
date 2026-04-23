import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PasswordResetFormProps {
  onSubmit: (data: ResetPasswordInput) => void
  isLoading?: boolean
  isSuccess?: boolean
  error?: string | null
}

export function PasswordResetForm({
  onSubmit,
  isLoading = false,
  isSuccess = false,
  error,
}: PasswordResetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  if (isSuccess) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
        <p className="font-medium">¡Revisa tu correo!</p>
        <p className="mt-1">
          Te enviamos un enlace para restablecer tu contraseña. Puede tardar unos minutos en llegar.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Enviar enlace
      </Button>
    </form>
  )
}
