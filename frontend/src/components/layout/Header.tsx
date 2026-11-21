import { Info } from 'lucide-react'

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line py-4 bg-surface">
      <div className="max-w-300 mx-auto flex items-center justify-between px-4">
        <div>
          <h1 className="text-2xl py-1">Panel de seguimiento estudiantil</h1>
          <p className="text-sm text-muted">
            Identificación temprana de malestar emocional, participación y
            aprendizaje por curso.
          </p>
        </div>
        <div>
          <button
            id="more-info"
            className="flex items-center gap-1 text-ink text-xs p-2 border border-line shadow-xs cursor-pointer rounded-md hover:border-ink transition-colors duration-300 ease-linear"
          >
            <Info size={14} strokeWidth={1.8} />
            ¿Cómo leer el panel?
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
