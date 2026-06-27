export function formatSize(bytes) {
  if (!bytes) return '0 B'
  for (const unit of ['B', 'KB', 'MB', 'GB']) {
    if (bytes < 1024) return `${bytes.toFixed(1)} ${unit}`
    bytes /= 1024
  }
  return `${bytes.toFixed(1)} TB`
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const COLORS = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  primaryLight: '#eef2ff',
  purple: '#7c3aed',
  gradient: ['#4f46e5', '#7c3aed'],
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
}
