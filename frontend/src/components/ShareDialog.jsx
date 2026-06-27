import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, Copy, Check, X, ExternalLink } from 'lucide-react'
import api from '../api'

export default function ShareDialog({ file, onClose }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    generateLink()
  }, [file.id])

  const generateLink = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/shares', { file_id: file.id })
      const fullUrl = `${window.location.origin}/api/shares/${data.token}`
      setUrl(fullUrl)
    } catch {
      setUrl('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    } catch {
      // fallback
    }
    try {
      inputRef.current?.select()
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      inputRef.current?.select()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Link size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Share Link</h3>
                <p className="text-sm text-slate-400 truncate max-w-[250px]">{file.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-700 px-3 outline-none truncate"
                />
                <motion.button
                  onClick={copyToClipboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                    copied
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ExternalLink size={12} />
                  <span>Use as video/image src or share directly</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
