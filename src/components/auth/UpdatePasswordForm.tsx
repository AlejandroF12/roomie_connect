import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, type UpdatePasswordInput } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface UpdatePasswordFormProps {
  onSubmit: (data: UpdatePasswordInput) => void
  isLoading?: boolean
  error?: string | null
}

export function UpdatePasswordForm({ onSubmit, isLoading = false, error }: UpdatePasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        helperText="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Actualizar contraseña
      </Button>
    </form>
  )
}
