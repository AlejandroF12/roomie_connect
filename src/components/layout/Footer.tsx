export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <p className="text-sm text-gray-500">
          © {year} Roomie Connect. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
