import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, X, FileText, AlertCircle } from 'lucide-react'
import api from '../api'
import FileIcon from './FileIcon'

export default function FilePreview({ file, onClose }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [textContent, setTextContent] = useState(null)

  const isImage = file.mime_type?.startsWith('image/')
  const isVideo = file.mime_type?.startsWith('video/')
  const isAudio = file.mime_type?.startsWith('audio/')
  const isPdf = file.mime_type === 'application/pdf'
  const isText = file.mime_type?.startsWith('text/') ||
    ['application/json', 'application/javascript', 'application/xml'].includes(file.mime_type)

  useEffect(() => {
    loadPreview()
  }, [file.id])

  const loadPreview = async () => {
    setLoading(true)
    try {
      if (isText) {
        const { data } = await api.get(`/files/${file.id}/preview`, { responseType: 'text' })
        setTextContent(data)
        setLoading(false)
      } else {
        const { data } = await api.get(`/files/${file.id}/preview`, { responseType: 'blob' })
        const url = URL.createObjectURL(data)
        setContent(url)
        setLoading(false)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileIcon mimeType={file.mime_type} size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 truncate">{file.name}</h3>
              <p className="text-xs text-slate-400">{file.size_formatted}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
            >
              <Download size={15} />
              <span>Download</span>
            </motion.button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 min-h-[350px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-slate-400">
              <div className="w-16 h-16 mx-auto bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-600">Preview unavailable</p>
              <p className="text-sm mt-1">Use the download button to get the file</p>
            </div>
          )}

          {!loading && !error && isImage && content && (
            <img src={content} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
          )}

          {!loading && !error && isVideo && content && (
            <video controls className="max-w-full max-h-[70vh] rounded-xl" autoPlay>
              <source src={content} type={file.mime_type} />
            </video>
          )}

          {!loading && !error && isAudio && content && (
            <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FileIcon mimeType={file.mime_type} size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{file.size_formatted}</p>
                </div>
              </div>
              <audio controls className="w-full">
                <source src={content} type={file.mime_type} />
              </audio>
            </div>
          )}

          {!loading && !error && isPdf && content && (
            <embed src={content} type="application/pdf" className="w-full h-[70vh] rounded-xl" />
          )}

          {!loading && !error && isText && textContent !== null && (
            <div className="w-full h-[70vh] bg-slate-900 rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <FileText size={14} className="text-slate-400" />
                <span className="text-xs text-slate-400 font-mono">{file.name}</span>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                {textContent}
              </pre>
            </div>
          )}

          {!loading && !error && !isImage && !isVideo && !isAudio && !isPdf && !isText && (
            <div className="text-center text-slate-400">
              <div className="w-16 h-16 mx-auto bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-600">Preview not available</p>
              <p className="text-sm mt-1">This file type cannot be previewed inline</p>
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Download size={16} />
                Download File
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
