import { Check, X } from 'lucide-react'
import { useEffect } from 'react'
import { StatusBadge } from '../students/StatusBadge'

interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="bg-surface border border-line rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-line flex items-center justify-between gap-4">
          <h2 id="guide-modal-title" className="text-base font-bold text-ink">
            ¿Cómo leer el panel de seguimiento estudiantil?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-xs font-medium text-ink hover:border-ink transition cursor-pointer shrink-0"
          >
            <span>Cerrar</span>
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs leading-relaxed text-ink">
          <p className="text-muted">
            Toda la estructura del panel está en blanco y negro para ofrecer el
            mayor contraste de lectura. Los colores aparecen{' '}
            <strong className="text-ink">únicamente</strong> para señalar el
            estado de acompañamiento que requiere cada estudiante:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-line flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                <StatusBadge status="risk" />
              </div>
              <div>
                <div className="font-semibold text-ink">
                  Requiere apoyo · Malestar promedio de{' '}
                  <span className="font-mono-num">30%</span> o más
                </div>
                <p className="text-muted mt-0.5">
                  Comunica urgencia sin resultar agresivo. Indica que el
                  estudiante presenta frustración o confusión frecuente en sus
                  mensajes.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-line flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                <StatusBadge status="caution" />
              </div>
              <div>
                <div className="font-semibold text-ink">
                  Seguimiento preventivo · Malestar intermedio (
                  <span className="font-mono-num">15% a 29.9%</span>)
                </div>
                <p className="text-muted mt-0.5">
                  Estado intermedio que invita a revisar el expediente del
                  estudiante de forma preventiva sin generar alarma.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-line flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                <StatusBadge status="safe" />
              </div>
              <div>
                <div className="font-semibold text-ink">
                  Sin alerta · Malestar bajo (menor a{' '}
                  <span className="font-mono-num">15%</span>)
                </div>
                <p className="text-muted mt-0.5">
                  Asociado a calma y seguridad; indica que el estudiante
                  participa con normalidad y no requiere intervención inmediata.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-line flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-ink text-surface text-xs font-medium hover:opacity-90 transition cursor-pointer"
          >
            <Check size={14} strokeWidth={2} />
            <span>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  )
}
