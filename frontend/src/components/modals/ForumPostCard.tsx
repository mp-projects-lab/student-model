import { Info } from 'lucide-react'
import type { TimelineEntry } from '../../types/student'
import { formatDateTime, formatShortDate } from '../../utils/formatters'
import { getEmotionLabel, getIntentLabel } from '../../utils/labels'
import {
  getIntentShortAction,
  shouldExplainMixedEmotion,
} from '../../utils/pedagogical'
import { getStatusInfo } from '../../utils/status'
import { StatusBadge } from '../students/StatusBadge'

interface ForumPostCardProps {
  post: TimelineEntry
  messageNumber?: number
  isSelected?: boolean
  interactive?: boolean
  variant?: 'card' | 'embedded'
  onClick?: () => void
  cardRef?: (node: HTMLDivElement | null) => void
}

export function ForumPostCard({
  post,
  messageNumber,
  isSelected = false,
  interactive = false,
  variant = 'card',
  onClick,
  cardRef,
}: ForumPostCardProps) {
  const postStatus = getStatusInfo(post.distress_pct)
  const emotionLabel = getEmotionLabel(post.primary_emotion)
  const showMixedNote = shouldExplainMixedEmotion(
    post.primary_emotion,
    post.distress_pct,
  )

  const containerClass =
    variant === 'embedded'
      ? 'pt-2.5 border-t border-line space-y-2'
      : `p-4 rounded-xl border bg-surface space-y-2 transition ${
          interactive ? 'cursor-pointer' : ''
        } ${
          isSelected
            ? 'border-ink ring-1 ring-ink/10'
            : 'border-line hover:border-muted'
        }`

  return (
    <div ref={cardRef} onClick={onClick} className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {messageNumber !== undefined && (
            <span className="font-mono-num font-bold text-ink">
              Mensaje #{messageNumber}
            </span>
          )}
          {isSelected && (
            <span className="px-1.5 py-0.5 rounded bg-ink text-surface text-[10px] font-semibold">
              Seleccionado
            </span>
          )}
          <span
            className={`font-mono-num ${
              messageNumber === undefined ? 'text-ink font-medium' : 'text-muted'
            }`}
            title={formatDateTime(post.created_at)}
          >
            {formatShortDate(post.created_at)}
          </span>
          <span className="text-muted">
            · <span className="font-mono-num">{post.word_count}</span> palabras
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded border border-line text-ink">
            Emoción: <strong>{emotionLabel}</strong>
          </span>
          <span
            className="px-2 py-0.5 rounded border border-line text-ink"
            title={`${getIntentLabel(post.cognitive_intent)} (confianza del modelo: ${post.intent_score_pct}%)`}
          >
            {getIntentShortAction(post.cognitive_intent)}
          </span>
          <StatusBadge distressPct={post.distress_pct} />
          <span className={`font-mono-num font-bold ${postStatus.textClass}`}>
            {post.distress_pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <p
        className={`text-xs text-ink leading-relaxed whitespace-pre-wrap break-words ${
          variant === 'card' ? 'pt-1.5 border-t border-line' : ''
        }`}
      >
        “{post.text_preview}”
      </p>

      {showMixedNote && (
        <p className="text-[11px] text-muted flex items-start gap-1.5 pt-0.5">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            Aunque el tono principal parece {emotionLabel.toLowerCase()}, el
            mensaje incluye señales de duda o preocupación (malestar estimado:{' '}
            <span className="font-mono-num font-medium text-ink">
              {post.distress_pct.toFixed(0)}%
            </span>
            ).
          </span>
        </p>
      )}
    </div>
  )
}
