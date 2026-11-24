import {
  Activity,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import type { CourseFilter } from '../../types/student'

interface CourseOption {
  value: CourseFilter
  label: string
  Icon: LucideIcon
}

const COURSE_OPTIONS: CourseOption[] = [
  { value: 'ALL', label: 'Todos los cursos', Icon: LayoutGrid },
  { value: 'Education', label: 'Educación', Icon: GraduationCap },
  { value: 'Medicine', label: 'Medicina', Icon: Activity },
  { value: 'Humanities', label: 'Humanidades', Icon: BookOpen },
]

interface CoursePillsProps {
  selectedCourse: CourseFilter
  onSelectCourse: (course: CourseFilter) => void
}

export function CoursePills({
  selectedCourse,
  onSelectCourse,
}: CoursePillsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 pt-0.5"
      role="group"
      aria-label="Selector de curso"
    >
      {COURSE_OPTIONS.map(({ value, label, Icon }) => {
        const isActive = selectedCourse === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectCourse(value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              isActive
                ? 'border-ink bg-ink text-surface'
                : 'border-line bg-surface text-muted hover:text-ink hover:border-ink'
            }`}
          >
            <Icon size={14} strokeWidth={2} className="shrink-0" />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
