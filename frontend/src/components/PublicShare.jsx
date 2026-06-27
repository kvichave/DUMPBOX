import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, HardDrive, AlertCircle, Lock } from 'lucide-react'
import api from '../api'
import FileIcon from './FileIcon'

export default function PublicShare() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchInfo()
  }, [token])

  const fetchInfo = async () => {
    try {
      const { data } = await api.get(`/shares/${token}/info`)
      setInfo(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Share link not found')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await api.get(`/shares/${token}`, { responseType: 'blob' })
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = info?.file_name || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
      if (bytes < 1024) return `${bytes.toFixed(1)} ${unit}`
      bytes /= 1024
    }
    return `${bytes.toFixed(1)} TB`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Link Not Available</h2>
          <p className="text-slate-500">{error}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4"
      >
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <HardDrive size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">DumpBox</h2>
        <p className="text-xs text-slate-400 mb-6">Shared File</p>

        {/* File Info */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
          <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <FileIcon mimeType={info?.file_name?.split('.').pop()} size={28} />
          </div>
          <p className="text-base font-semibold text-slate-800 break-all">{info?.file_name}</p>
          <p className="text-sm text-slate-400 mt-1">{formatSize(info?.file_size)}</p>
        </div>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          disabled={downloading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          {downloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download size={18} />
              Download File
            </>
          )}
        </motion.button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-400">
          <Lock size={11} />
          <span>Secure file sharing by DumpBox</span>
        </div>
      </motion.div>
    </div>
  )
}
