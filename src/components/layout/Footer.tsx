import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

const LINKS = {
  plataforma: [
    { to: '/', label: 'Explorar habitaciones' },
    { to: '/rooms/new', label: 'Publicar habitación' },
    { to: '/favorites', label: 'Mis favoritos' },
    { to: '/my-rooms', label: 'Mis rooms' },
  ],
  cuenta: [
    { to: '/login', label: 'Iniciar sesión' },
    { to: '/register', label: 'Crear cuenta' },
    { to: '/profile', label: 'Mi perfil' },
  ],
  info: [
    { to: '/about', label: 'Acerca de' },
  ],
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          <div className="lg:col-span-1">
            <Link to="/" aria-label="Roomie Connect — inicio">
              <Logo size="sm" />
            </Link>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Conectamos a personas que buscan compartir vivienda en Colombia. Simple, directo y sin comisiones.
            </p>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
              <span>🇨🇴</span> Hecho en Colombia
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Plataforma</h3>
            <ul className="flex flex-col gap-2">
              {LINKS.plataforma.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Cuenta</h3>
            <ul className="flex flex-col gap-2">
              {LINKS.cuenta.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Información</h3>
            <ul className="flex flex-col gap-2">
              {LINKS.info.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-violet-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-1.5">Stack tecnológico</p>
              <div className="flex flex-wrap gap-1.5">
                {['React', 'Supabase', 'Tailwind'].map((tech) => (
                  <span key={tech} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© {year} Roomie Connect. Todos los derechos reservados.</p>
          <p className="text-xs text-slate-400">Conectando roomies 🏠</p>
        </div>
      </div>
    </footer>
  )
}
