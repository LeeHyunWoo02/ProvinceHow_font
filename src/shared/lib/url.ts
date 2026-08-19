export function normalizeUrl(raw?: string | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const sanitized = trimmed.replace(/\s+/g, '')
  if (!sanitized) return ''
  const lower = sanitized.toLowerCase()
  if (/^(javascript|data|vbscript|file|blob):/.test(lower)) return ''
  if (/^https?:\/\//i.test(sanitized)) return sanitized
  if (/^\/\//.test(sanitized)) return `https:${sanitized}`
  if (/^[\w.-]+(\.[\w.-]+)+(:\d+)?(\/.*)?$/i.test(sanitized)) {
    return `https://${sanitized}`
  }
  return ''
}
