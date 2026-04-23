interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 52, text: 'text-3xl' },
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizes[size]

  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      {/* Ícono SVG */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Fondo redondeado */}
        <rect width="48" height="48" rx="12" fill="#7c3aed" />

        {/* Casa — techo */}
        <path
          d="M24 10L8 24H13V38H22V30H26V38H35V24H40L24 10Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Corazón pequeño superpuesto en el centro de la casa */}
        <path
          d="M24 22.5C24 22.5 20 19.5 20 17.5C20 16.1 21.1 15 22.5 15C23.3 15 24 15.5 24 15.5C24 15.5 24.7 15 25.5 15C26.9 15 28 16.1 28 17.5C28 19.5 24 22.5 24 22.5Z"
          fill="#c4b5fd"
        />
      </svg>

      {/* Texto */}
      {showText && (
        <span className={['font-bold tracking-tight', text].join(' ')}>
          <span className="text-violet-600">Roomie</span>
          <span className="text-slate-700"> Connect</span>
        </span>
      )}
    </div>
  )
}
