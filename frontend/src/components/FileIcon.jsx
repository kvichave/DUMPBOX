import {
  FileImage, FileVideo, FileAudio, FileText, File,
  FileCode, FileSpreadsheet, FileType, Archive,
  FileJson,
} from 'lucide-react'

const iconMap = {
  image: { icon: FileImage, color: 'text-pink-500' },
  video: { icon: FileVideo, color: 'text-purple-500' },
  audio: { icon: FileAudio, color: 'text-amber-500' },
  pdf: { icon: FileType, color: 'text-red-500' },
  word: { icon: FileText, color: 'text-blue-500' },
  excel: { icon: FileSpreadsheet, color: 'text-emerald-500' },
  powerpoint: { icon: FileText, color: 'text-orange-500' },
  zip: { icon: Archive, color: 'text-yellow-500' },
  text: { icon: FileText, color: 'text-slate-500' },
  code: { icon: FileCode, color: 'text-cyan-500' },
  json: { icon: FileJson, color: 'text-lime-500' },
}

export default function FileIcon({ mimeType, size = 28 }) {
  let match

  if (!mimeType) match = iconMap.text
  else if (mimeType.startsWith('image/')) match = iconMap.image
  else if (mimeType.startsWith('video/')) match = iconMap.video
  else if (mimeType.startsWith('audio/')) match = iconMap.audio
  else if (mimeType === 'application/pdf') match = iconMap.pdf
  else if (mimeType.includes('word') || mimeType.includes('document')) match = iconMap.word
  else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) match = iconMap.excel
  else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) match = iconMap.powerpoint
  else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compress')) match = iconMap.zip
  else if (mimeType.startsWith('text/')) match = iconMap.text
  else if (mimeType.includes('javascript') || mimeType.includes('json')) match = iconMap.json
  else if (mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('script')) match = iconMap.code
  else match = iconMap.text

  const Icon = match.icon
  return <Icon size={size} className={match.color} />
}
