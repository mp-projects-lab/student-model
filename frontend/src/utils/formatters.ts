export function formatNumber(value: number): string {
  return value.toLocaleString('es-MX')
}

export function formatShortDate(isoStr: string): string {
  const date = new Date(isoStr)
  if (Number.isNaN(date.getTime())) return isoStr
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function formatDateTime(isoStr: string): string {
  return isoStr.replace('T', ' ')
}

export function truncateStudentId(studentId: string, maxLength = 10): string {
  if (studentId.length <= maxLength) return studentId
  return `${studentId.slice(0, maxLength)}…`
}
