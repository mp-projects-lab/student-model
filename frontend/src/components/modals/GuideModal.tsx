import {
  BarChart3,
  Check,
  ClipboardList,
  Compass,
  Heart,
  MousePointerClick,
  Radar,
  Table2,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { StatusBadge } from '../students/StatusBadge'

type GuideTab = 'tabla' | 'curso' | 'estudiante'

interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('tabla')

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="bg-surface border border-line rounded-2xl w-full max-w-3xl sm:h-[630px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-line flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 id="guide-modal-title" className="text-base font-bold text-ink">
              ¿Cómo leer el panel?
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Guía rápida para identificar a quién apoyar y entender cada vista.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-xs font-medium text-ink hover:border-ink transition cursor-pointer shrink-0"
          >
            <span>Cerrar</span>
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div
          className="px-6 border-b border-line flex items-center gap-2 overflow-x-auto bg-surface shrink-0"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tabla'}
            onClick={() => setActiveTab('tabla')}
            className={`inline-flex items-center gap-1.5 py-3 px-2.5 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'tabla'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <Table2 size={14} strokeWidth={2} />
            <span>Colores y tabla</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'curso'}
            onClick={() => setActiveTab('curso')}
            className={`inline-flex items-center gap-1.5 py-3 px-2.5 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'curso'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <BarChart3 size={14} strokeWidth={2} />
            <span>Gráficas del curso</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'estudiante'}
            onClick={() => setActiveTab('estudiante')}
            className={`inline-flex items-center gap-1.5 py-3 px-2.5 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'estudiante'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <UserCheck size={14} strokeWidth={2} />
            <span>Expediente del alumno</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed text-ink">
          {/* =============================================================== */}
          {/* PESTAÑA 1: COLORES Y TABLA                                      */}
          {/* =============================================================== */}
          {activeTab === 'tabla' && (
            <div className="space-y-6">
              {/* Colores */}
              <section className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  A quién atender primero
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-risk-border bg-risk-soft space-y-2">
                    <StatusBadge status="risk" />
                    <p className="text-xs text-ink">
                      <strong className="block mb-0.5">Requiere apoyo</strong>
                      <span className="text-muted">
                        Frustración o confusión frecuente; conviene revisarlo
                        primero.
                      </span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-caution-border bg-caution-soft space-y-2">
                    <StatusBadge status="caution" />
                    <p className="text-xs text-ink">
                      <strong className="block mb-0.5">
                        Seguimiento preventivo
                      </strong>
                      <span className="text-muted">
                        Dudas puntuales o señales leves; vale la pena estar
                        pendiente.
                      </span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-safe-border bg-safe-soft space-y-2">
                    <StatusBadge status="safe" />
                    <p className="text-xs text-ink">
                      <strong className="block mb-0.5">Sin alerta</strong>
                      <span className="text-muted">
                        Participa con normalidad y mantiene un tono tranquilo.
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Números de la tabla con ejemplo visual */}
              <section className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Cómo leer los números en la tabla
                </h3>
                <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
                  {/* Malestar */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <div className="sm:w-44 shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted">
                        Malestar
                      </div>
                      <div className="font-mono-num text-xs mt-0.5">
                        <span className="font-bold text-risk">100.0%</span>
                        <span className="text-muted"> / 18%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Compara el{' '}
                      <strong className="text-ink">malestar del alumno</strong>{' '}
                      contra el{' '}
                      <strong className="text-ink">promedio de su grupo</strong>
                      . Un valor menor indica mayor tranquilidad.
                    </p>
                  </div>

                  {/* Participación */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <div className="sm:w-44 shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted">
                        Participación
                      </div>
                      <div className="font-mono-num text-xs mt-0.5">
                        <span className="font-semibold text-ink">39.4%</span>
                        <span className="text-muted"> / 52%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Compara la{' '}
                      <strong className="text-ink">actividad del alumno</strong>{' '}
                      contra el{' '}
                      <strong className="text-ink">promedio de su grupo</strong>{' '}
                      (cantidad de mensajes, extensión y constancia).
                    </p>
                  </div>

                  {/* Enfoque */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <div className="sm:w-44 shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted">
                        Enfoque
                      </div>
                      <div className="font-mono-num text-xs mt-0.5">
                        <span className="font-semibold text-ink">45.0%</span>
                        <span className="text-muted"> / 61%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Compara la{' '}
                      <strong className="text-ink">
                        profundidad de sus aportes
                      </strong>{' '}
                      contra el{' '}
                      <strong className="text-ink">promedio de su grupo</strong>{' '}
                      (de avisos y preguntas hasta debate y explicación).
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =============================================================== */}
          {/* PESTAÑA 2: GRÁFICAS DEL CURSO                                   */}
          {/* =============================================================== */}
          {activeTab === 'curso' && (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Las cuatro tarjetas superiores resumen al curso seleccionado.
                Dos de ellas te permiten filtrar la tabla con un clic:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-line space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                        <BarChart3 size={14} strokeWidth={2} />
                      </span>
                      <span className="font-bold text-ink">
                        Estado de los estudiantes
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line text-[10px] font-medium text-muted shrink-0">
                      <MousePointerClick size={11} />
                      Filtro
                    </span>
                  </div>
                  <p className="text-muted">
                    La barra muestra cómo se reparte el grupo en los tres
                    colores. <strong className="text-ink">Haz clic</strong> en
                    cualquier estado para ver solo a esos alumnos en la tabla.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                      <Radar size={14} strokeWidth={2} />
                    </span>
                    <span className="font-bold text-ink">
                      Perfil multidimensional
                    </span>
                  </div>
                  <p className="text-muted">
                    Gráfica de radar que resume el promedio del curso en 4
                    puntas: cuanto más abierta hacia el borde, más alto es el
                    valor. Busca valores altos en{' '}
                    <strong className="text-ink">Participación</strong>,{' '}
                    <strong className="text-ink">Cognitiva</strong> (calidad) y{' '}
                    <strong className="text-ink">Estabilidad</strong>, y bajos
                    en <strong className="text-ink">Malestar</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                      <Heart size={14} strokeWidth={2} />
                    </span>
                    <span className="font-bold text-ink">
                      Emociones predominantes
                    </span>
                  </div>
                  <p className="text-muted">
                    Ordena las emociones que más aparecen en los mensajes del
                    curso. Una barra más larga significa que más estudiantes
                    comparten esa emoción.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                        <Compass size={14} strokeWidth={2} />
                      </span>
                      <span className="font-bold text-ink">
                        Enfoque de participación
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line text-[10px] font-medium text-muted shrink-0">
                      <MousePointerClick size={11} />
                      Filtro
                    </span>
                  </div>
                  <p className="text-muted">
                    Muestra para qué usan el foro: <em>Preguntas y dudas</em>,{' '}
                    <em>Debate y reflexión</em>, <em>Explicación y síntesis</em>{' '}
                    o <em>Logística y avisos</em>.{' '}
                    <strong className="text-ink">Haz clic</strong> para filtrar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PESTAÑA 3: EXPEDIENTE DEL ALUMNO                                */}
          {/* =============================================================== */}
          {activeTab === 'estudiante' && (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Al hacer clic en un estudiante de la tabla se abre su
                expediente, organizado en dos pestañas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tarjeta 1: Resumen del estudiante */}
                <div className="p-4 rounded-xl border border-line flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                        <ClipboardList size={14} strokeWidth={2} />
                      </span>
                      <span className="font-bold text-ink">
                        Resumen del estudiante
                      </span>
                    </div>

                    <ul className="space-y-2 text-muted">
                      <li>
                        <strong className="text-ink">
                          3 tarjetas principales:
                        </strong>{' '}
                        muestran su estado emocional, participación y calidad de
                        aportes; la{' '}
                        <strong className="text-ink">marca vertical</strong> en
                        cada barra indica el promedio del grupo.
                      </li>
                      <li>
                        <strong className="text-ink">Mensaje destacado:</strong>{' '}
                        presenta su publicación más relevante para leerla de
                        inmediato.
                      </li>
                      <li>
                        <strong className="text-ink">
                          Gráfica de radar comparativa:
                        </strong>{' '}
                        al desplegarla, superpone las 4 puntas del alumno (
                        <strong className="text-ink">línea sólida</strong>)
                        sobre las de su grupo (
                        <strong className="text-ink">línea punteada</strong>).
                        Donde sobresale, va por encima; donde queda dentro,
                        puede necesitar apoyo.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-line flex flex-wrap items-center gap-3.5 text-[11px] text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-0.5 bg-ink inline-block" />
                      Estudiante
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="w-3.5 border-b border-dashed border-muted inline-block" />
                      Grupo
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="w-0.5 h-3 bg-ink/60 inline-block rounded-full" />
                      Prom. en barra
                    </span>
                  </div>
                </div>

                {/* Tarjeta 2: Mensajes y evolución */}
                <div className="p-4 rounded-xl border border-line flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg border border-line bg-row-hover flex items-center justify-center shrink-0">
                        <TrendingUp size={14} strokeWidth={2} />
                      </span>
                      <span className="font-bold text-ink">
                        Mensajes y evolución
                      </span>
                    </div>

                    <ul className="space-y-2 text-muted">
                      <li>
                        <strong className="text-ink">Línea de tiempo:</strong>{' '}
                        se lee de izquierda a derecha (del mensaje{' '}
                        <span className="font-mono-num text-ink">#1</span> al
                        más reciente) para ver si su malestar mejora o aumenta.
                      </li>
                      <li>
                        <strong className="text-ink">
                          ¿Qué es el umbral (30%)?
                        </strong>{' '}
                        Es la marca a partir de la cual un mensaje se considera{' '}
                        <strong className="text-ink">prioritario</strong>. Los
                        puntos en la zona roja sobre esa línea merecen revisión;
                        la etiqueta oscura muestra el porcentaje del punto
                        elegido.
                      </li>
                      <li>
                        <strong className="text-ink">
                          Haz clic en un punto:
                        </strong>{' '}
                        resalta y lleva directo al texto completo de ese mensaje
                        en la lista inferior.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-line flex flex-wrap items-center gap-3.5 text-[11px] text-ink">
                    <span className="inline-flex items-center gap-1.5 text-risk font-medium">
                      <span className="w-3.5 border-b border-dashed border-risk inline-block" />
                      Umbral 30%
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-risk inline-block" />
                      Mensaje
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="px-1.5 py-0.5 rounded bg-ink text-surface font-mono-num text-[9px] font-semibold leading-none">
                        39%
                      </span>
                      Seleccionado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-line flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-muted">
            Usa las pestañas superiores para consultar cada sección.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-ink text-surface text-xs font-medium hover:opacity-90 transition cursor-pointer shrink-0"
          >
            <Check size={14} strokeWidth={2} />
            <span>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  )
}
