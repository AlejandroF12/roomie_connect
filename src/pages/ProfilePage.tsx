import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAccount } from '@/hooks/useProfile'
import { useMyRooms } from '@/hooks/useRooms'
import { useFavorites } from '@/hooks/useFavorites'
import { useLogout } from '@/hooks/useAuth'
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/profile.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/layout/Layout'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const DUPLICATE_USERNAME_MESSAGES = ['no está disponible', 'duplicate', 'ya está en uso', '23505']
function isDuplicateUsernameError(message: string) {
  return DUPLICATE_USERNAME_MESSAGES.some((kw) => message.toLowerCase().includes(kw))
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, isError: isProfileError } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const deleteAccount = useDeleteAccount()
  const logout = useLogout()
  const { data: myRooms } = useMyRooms()
  const { data: favorites } = useFavorites()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteSection, setShowDeleteSection] = useState(false)

  const { register, handleSubmit, setError, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      username: profile?.username ?? undefined,
      bio: profile?.bio ?? undefined,
      phone: profile?.phone ?? undefined,
      instagram: profile?.instagram ?? '',
      facebook: profile?.facebook ?? '',
      twitter: profile?.twitter ?? '',
    },
  })

  useEffect(() => {
    if (updateProfile.isError && updateProfile.error?.message) {
      if (isDuplicateUsernameError(updateProfile.error.message)) {
        setError('username', { type: 'server', message: 'Este nombre de usuario no está disponible.' })
      }
    }
  }, [updateProfile.isError, updateProfile.error, setError])

  const onSubmit = (data: UpdateProfileInput) => updateProfile.mutate(data)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('La imagen no puede superar 2 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    uploadAvatar.mutate(file)
  }

  const expectedDeleteText = `Delete-${profile?.username ?? ''}`
  const canDelete = deleteConfirm === expectedDeleteText

  const handleDeleteAccount = () => {
    if (!canDelete) return
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        logout.mutate()
        navigate('/login')
      },
    })
  }

  if (isLoading) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>
    </Layout>
  )

  if (isProfileError) return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          No se pudo cargar el perfil. Por favor, recarga la página.
        </div>
      </div>
    </Layout>
  )

  const showGenericUpdateError =
    updateProfile.isError &&
    updateProfile.error?.message &&
    !isDuplicateUsernameError(updateProfile.error.message)

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-800">Mi perfil</h1>

        {/* ── Datos del perfil ─────────────────────────────────────── */}
        <Card className="p-6">
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username ?? 'Avatar'}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold">
                  {profile?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              {uploadAvatar.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}>Cambiar foto</Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
              {uploadAvatar.isError && !avatarError && (
                <p className="text-xs text-red-600">{uploadAvatar.error?.message ?? 'Error al subir.'}</p>
              )}
              {uploadAvatar.isSuccess && <p className="text-xs text-green-600">Foto actualizada.</p>}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {showGenericUpdateError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
                {updateProfile.error?.message ?? 'Error al actualizar el perfil.'}
              </div>
            )}
            {updateProfile.isSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Perfil actualizado correctamente.
              </div>
            )}

            <Input label="Nombre de usuario" type="text" autoComplete="username"
              helperText="Solo letras, números, guiones bajos y puntos (3-30 caracteres)"
              error={errors.username?.message} {...register('username')} />

            <div className="flex flex-col gap-1">
              <label htmlFor="bio" className="text-sm font-medium text-slate-700">Biografía</label>
              <textarea id="bio" rows={3}
                className={['rounded-md border px-3 py-2 text-sm shadow-sm resize-none bg-white text-slate-800',
                  'focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400',
                  errors.bio ? 'border-red-400' : 'border-slate-300'].join(' ')}
                {...register('bio')} />
              {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            <Input label="Teléfono" type="tel" autoComplete="tel"
              helperText="Incluye el código de país (ej: +57 300 123 4567)"
              error={errors.phone?.message} {...register('phone')} />

            {/* Redes sociales */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Redes sociales</p>
              <div className="flex flex-col gap-3">
                {[
                  { name: 'instagram' as const, placeholder: 'Usuario de Instagram', color: 'text-pink-500', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                  { name: 'facebook' as const, placeholder: 'Usuario de Facebook', color: 'text-blue-600', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { name: 'twitter' as const, placeholder: 'Usuario de X (Twitter)', color: 'text-gray-900', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                ].map(({ name, placeholder, color, icon }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className={`w-8 shrink-0 ${color}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d={icon} />
                      </svg>
                    </span>
                    <Input label="" placeholder={placeholder} type="text"
                      error={errors[name]?.message} {...register(name)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={updateProfile.isPending}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Configuraciones ──────────────────────────────────────── */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Configuraciones</h2>

          {/* Estadísticas */}
          <div className="py-4 border-b border-slate-100">
            <p className="mb-3 text-sm font-medium text-slate-700">Estadísticas</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Favoritos', value: favorites?.length ?? 0, icon: '❤️' },
                { label: 'Rooms creados', value: myRooms?.length ?? 0, icon: '🏠' },
                { label: 'Miembro desde', value: memberSince, icon: '📅', small: true },
              ].map(({ label, value, icon, small }) => (
                <div key={label} className="flex flex-col items-center rounded-xl bg-slate-50 p-3 text-center">
                  <span className="text-xl mb-1">{icon}</span>
                  <span className={['font-bold text-slate-800', small ? 'text-xs' : 'text-2xl'].join(' ')}>
                    {value}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eliminar cuenta */}
          <div className="pt-4">
            <button
              onClick={() => setShowDeleteSection((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar cuenta
              <svg className={`h-3 w-3 transition-transform ${showDeleteSection ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDeleteSection && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700 mb-1">
                  Esta acción es <strong>irreversible</strong>. Se eliminarán tu perfil, rooms y favoritos.
                </p>
                <p className="text-sm text-red-700 mb-3">
                  Para confirmar, escribe: <code className="font-mono font-bold">{expectedDeleteText}</code>
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={expectedDeleteText}
                  className="w-full rounded-md border border-red-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!canDelete}
                  isLoading={deleteAccount.isPending}
                  onClick={handleDeleteAccount}
                  className="w-full"
                >
                  Eliminar mi cuenta permanentemente
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
