import { CircleHelp } from 'lucide-react'

interface HeaderProps {
  onOpenGuide: () => void
}

function Header({ onOpenGuide }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="max-w-[1180px] mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink leading-tight">
            Panel de seguimiento estudiantil
          </h1>
          <p className="text-sm text-muted mt-1">
            Identificación temprana de malestar emocional, participación y
            aprendizaje por curso.
          </p>
        </div>

        <button
          id="open-guide-btn"
          type="button"
          onClick={onOpenGuide}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-xs font-medium text-muted hover:text-ink hover:border-ink transition cursor-pointer"
        >
          <CircleHelp size={15} strokeWidth={2} className="shrink-0" />
          <span>¿Cómo leer el panel?</span>
        </button>
      </div>
    </header>
  )
}

export default Header
