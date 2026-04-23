import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useSession } from '@/hooks/useAuth'

const FEATURES = [
  { icon: '🏠', title: 'Publica tu habitación', desc: 'Crea un anuncio con fotos, precio, descripción y ubicación en el mapa en pocos minutos.' },
  { icon: '🔍', title: 'Búsqueda inteligente', desc: 'Filtra por ciudad, tipo de habitación y rango de precio. Ordena por fecha o precio.' },
  { icon: '💬', title: 'Contacto directo', desc: 'Habla con el propietario por WhatsApp sin intermediarios ni comisiones.' },
  { icon: '❤️', title: 'Guarda favoritos', desc: 'Marca las habitaciones que te interesan para revisarlas cuando quieras.' },
  { icon: '🗺️', title: 'Mapa integrado', desc: 'Visualiza la ubicación exacta de cada habitación con OpenStreetMap.' },
  { icon: '🛡️', title: 'Reportes y moderación', desc: 'Sistema de reportes para mantener la plataforma segura y confiable.' },
]

const STACK = [
  { name: 'React 18', desc: 'Interfaz de usuario' },
  { name: 'TypeScript', desc: 'Tipado estático' },
  { name: 'Supabase', desc: 'Backend, Auth y Storage' },
  { name: 'Tailwind CSS', desc: 'Estilos' },
  { name: 'TanStack Query', desc: 'Estado del servidor' },
  { name: 'React Router v6', desc: 'Enrutamiento' },
  { name: 'Zod', desc: 'Validación de datos' },
  { name: 'Leaflet', desc: 'Mapas interactivos' },
]

export function AboutPage() {
  const { data: session } = useSession()

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Acerca de Roomie Connect
          </h1>
          <p className="mt-4 text-lg text-violet-100 max-w-xl mx-auto">
            Una plataforma colombiana que conecta a personas que buscan compartir vivienda con propietarios que tienen espacios disponibles.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 flex flex-col gap-14">

        {/* Misión */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">¿Qué es Roomie Connect?</h2>
          <p className="text-slate-600 leading-relaxed">
            Roomie Connect es una aplicación web diseñada para simplificar la búsqueda de habitaciones compartidas en Colombia.
            Creemos que encontrar un buen roomie o una buena habitación no debería ser complicado ni costoso.
          </p>
          <p className="mt-3 text-slate-600 leading-relaxed">
            La plataforma permite a los propietarios publicar sus espacios disponibles con fotos, precio y ubicación,
            mientras que los buscadores pueden explorar, filtrar y contactar directamente sin intermediarios.
          </p>
        </section>

        {/* Funcionalidades */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">¿Qué puedes hacer?</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-2xl">{icon}</span>
                <h3 className="mt-2 font-semibold text-slate-800">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stack */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Stack tecnológico</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STACK.map(({ name, desc }) => (
              <div key={name} className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                <p className="font-semibold text-slate-700 text-sm">{name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA — solo si no hay sesión */}
        {!session && (
          <section className="rounded-2xl bg-violet-50 border border-violet-100 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-800">¿Listo para empezar?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Crea tu cuenta gratis y empieza a explorar habitaciones o publica la tuya.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/register"
                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
                Crear cuenta gratis
              </Link>
              <Link to="/"
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Explorar habitaciones
              </Link>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
