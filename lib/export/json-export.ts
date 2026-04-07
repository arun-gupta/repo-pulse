import type { AnalyzeResponse } from '@/lib/analyzer/analysis-result'

export interface JsonExportResult {
  blob: Blob
  filename: string
}

function buildTimestamp(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const HH = String(now.getHours()).padStart(2, '0')
  const MM = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}-${HH}${MM}${ss}`
}

export function buildJsonExport(response: AnalyzeResponse): JsonExportResult {
  const json = JSON.stringify(response, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const filename = `repopulse-${buildTimestamp()}.json`
  return { blob, filename }
}

export function triggerDownload({ blob, filename }: { blob: Blob; filename: string }): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
