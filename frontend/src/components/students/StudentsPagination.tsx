import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

interface StudentsPaginationProps {
  page: number
  totalPages: number
  totalMatching: number
  onPageChange: (nextPage: number) => void
}

export function StudentsPagination({
  page,
  totalPages,
  totalMatching,
  onPageChange,
}: StudentsPaginationProps) {
  return (
    <div className="px-5 py-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted">
      <div className="flex items-center gap-2">
        <Lightbulb size={15} strokeWidth={2} className="text-ink shrink-0" />
        <span>
          <strong className="text-ink">Tip:</strong> Puedes{' '}
          <strong className="text-ink">ver más información</strong> de cualquier
          estudiante dando click en{' '}
          <strong className="text-ink">“Expediente”</strong>.
        </span>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <span className="font-mono-num text-[11px] text-muted hidden md:inline">
          {formatNumber(totalMatching)} estudiantes
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
            className="w-6 h-6 rounded border border-line bg-surface text-ink hover:border-ink disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <span className="text-xs text-muted">
            Mostrando página{' '}
            <strong className="text-ink font-mono-num">{page}</strong> de{' '}
            <strong className="text-ink font-mono-num">
              {formatNumber(totalPages)}
            </strong>
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
            className="w-6 h-6 rounded border border-line bg-surface text-ink hover:border-ink disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center justify-center transition cursor-pointer"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
