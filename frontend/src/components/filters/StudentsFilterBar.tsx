import { RotateCcw, Search, X } from 'lucide-react'
import type { StatusFilter } from '../../types/student'
import { DEFAULT_INTENT_OPTIONS, getIntentLabel } from '../../utils/labels'

interface StudentsFilterBarProps {
  search: string
  status: StatusFilter
  intent: string
  availableIntents: string[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onIntentChange: (value: string) => void
  onResetFilters: () => void
}

export function StudentsFilterBar({
  search,
  status,
  intent,
  availableIntents,
  onSearchChange,
  onStatusChange,
  onIntentChange,
  onResetFilters,
}: StudentsFilterBarProps) {
  const intentOptions =
    availableIntents.length > 0 ? availableIntents : DEFAULT_INTENT_OPTIONS
  const hasActiveFilters = Boolean(search.trim() || status || intent)

  return (
    <div className="px-5 py-3.5 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="relative w-full md:w-64">
        <Search
          size={14}
          strokeWidth={2}
          className="text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <input
          id="search-input"
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar estudiante por ID"
          aria-label="Buscar estudiante por ID"
          className="w-full pl-8 pr-7 py-1.5 rounded-md border border-muted bg-surface text-xs text-ink placeholder:text-muted focus:outline-none focus:border-ink font-mono-num"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition cursor-pointer"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs">
        <label className="flex items-center gap-2 text-muted">
          <span>Filtrar por:</span>
          <select
            id="status-select"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as StatusFilter)
            }
            className="px-3 py-1.5 rounded-md border border-line bg-surface text-xs text-ink font-medium focus:outline-none focus:border-ink cursor-pointer min-w-[175px]"
          >
            <option value="">Todos los estados</option>
            <option value="risk">Prioritario (≥ 30%)</option>
            <option value="caution">Atención (15% – 29%)</option>
            <option value="safe">Estable (&lt; 15%)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-muted">
          <span>Filtrar por:</span>
          <select
            id="intent-select"
            value={intent}
            onChange={(event) => onIntentChange(event.target.value)}
            className="px-3 py-1.5 rounded-md border border-line bg-surface text-xs text-ink font-medium focus:outline-none focus:border-ink cursor-pointer min-w-[195px]"
          >
            <option value="">Todos los enfoques</option>
            {intentOptions.map((option) => (
              <option key={option} value={option}>
                {getIntentLabel(option)}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line text-xs text-muted hover:text-ink hover:border-ink transition cursor-pointer"
          >
            <RotateCcw size={12} strokeWidth={2} />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  )
}
