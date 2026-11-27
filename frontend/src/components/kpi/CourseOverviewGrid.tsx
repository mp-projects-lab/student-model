import { AlertCircle, RefreshCw } from 'lucide-react'
import type {
  CourseAnalyticsResponse,
  DistressStatus,
  StatusFilter,
} from '../../types/student'
import { EmotionsCard } from './EmotionsCard'
import { IntentsCard } from './IntentsCard'
import { MultidimensionalProfileCard } from './MultidimensionalProfileCard'
import { StatusOverviewCard } from './StatusOverviewCard'

interface CourseOverviewGridProps {
  analytics: CourseAnalyticsResponse | null
  isLoading: boolean
  error: string | null
  activeStatus: StatusFilter
  activeIntent: string
  onToggleStatus: (status: DistressStatus) => void
  onToggleIntent: (intent: string) => void
  onRetry: () => void
}

export function CourseOverviewGrid({
  analytics,
  isLoading,
  error,
  activeStatus,
  activeIntent,
  onToggleStatus,
  onToggleIntent,
  onRetry,
}: CourseOverviewGridProps) {
  if (!analytics && isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border border-line rounded-xl bg-surface p-4 min-h-[255px] flex flex-col justify-between animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4 w-3/5 rounded bg-line" />
              <div className="h-3 w-4/5 rounded bg-line/70" />
            </div>
            <div className="space-y-2.5 py-4">
              <div className="h-2.5 w-full rounded-full bg-line" />
              <div className="h-2.5 w-5/6 rounded-full bg-line/80" />
              <div className="h-2.5 w-2/3 rounded-full bg-line/70" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics && error) {
    return (
      <div className="border border-risk-border bg-risk-soft rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-risk">
          <AlertCircle size={16} className="shrink-0" />
          <span>No se pudieron cargar las métricas del curso: {error}</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-risk-border bg-surface text-risk font-medium hover:border-risk transition cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Reintentar</span>
        </button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-1 transition-opacity duration-200 ${
        isLoading ? 'opacity-65' : 'opacity-100'
      }`}
    >
      <StatusOverviewCard
        totalStudents={analytics.total_students}
        breakdown={analytics.status_breakdown}
        activeStatus={activeStatus}
        onToggleStatus={onToggleStatus}
      />
      <MultidimensionalProfileCard
        totalPosts={analytics.total_posts}
        radarAvg={analytics.radar_avg}
      />
      <EmotionsCard emotions={analytics.top_emotions} />
      <IntentsCard
        intents={analytics.intents}
        activeIntent={activeIntent}
        onToggleIntent={onToggleIntent}
      />
    </div>
  )
}
