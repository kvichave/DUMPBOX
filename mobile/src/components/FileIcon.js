import React from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const iconMap = {
  image: { name: 'file-image', color: '#ec4899' },
  video: { name: 'file-video', color: '#a855f7' },
  audio: { name: 'file-music', color: '#f59e0b' },
  pdf: { name: 'file-pdf-box', color: '#ef4444' },
  word: { name: 'file-word', color: '#3b82f6' },
  excel: { name: 'file-excel', color: '#10b981' },
  powerpoint: { name: 'file-powerpoint', color: '#f97316' },
  zip: { name: 'zip-box', color: '#eab308' },
  text: { name: 'file-document', color: '#64748b' },
  code: { name: 'file-code', color: '#06b6d4' },
  default: { name: 'file-document-outline', color: '#94a3b8' },
}

export default function FileIcon({ mimeType, size = 28 }) {
  let match = iconMap.default
  if (!mimeType) match = iconMap.default
  else if (mimeType.startsWith('image/')) match = iconMap.image
  else if (mimeType.startsWith('video/')) match = iconMap.video
  else if (mimeType.startsWith('audio/')) match = iconMap.audio
  else if (mimeType === 'application/pdf') match = iconMap.pdf
  else if (mimeType.includes('word') || mimeType.includes('document')) match = iconMap.word
  else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) match = iconMap.excel
  else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) match = iconMap.powerpoint
  else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compress')) match = iconMap.zip
  else if (mimeType.startsWith('text/')) match = iconMap.text
  else if (mimeType.includes('javascript') || mimeType.includes('json')) match = iconMap.code
  else if (mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('script')) match = iconMap.code

  return <MaterialCommunityIcons name={match.name} size={size} color={match.color} />
}
