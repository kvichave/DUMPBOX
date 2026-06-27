import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, File, CheckCircle, AlertCircle, Cloud } from 'lucide-react'
import api from '../api'

export default function UploadModal({ folderId, onClose, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => [
      ...prev,
      ...Array.from(newFiles).map((f) => ({
        file: f,
        id: Math.random().toString(36),
        name: f.name,
        size: f.size,
      })),
    ])
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)

    for (const fileEntry of files) {
      const formData = new FormData()
      formData.append('file', fileEntry.file)
      if (folderId) formData.append('folder_id', folderId)

      try {
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded / e.total) * 100)
            setProgress((prev) => ({ ...prev, [fileEntry.id]: pct }))
          },
        })
        setProgress((prev) => ({ ...prev, [fileEntry.id]: 100 }))
      } catch {
        setProgress((prev) => ({ ...prev, [fileEntry.id]: -1 }))
      }
    }

    setUploading(false)
    onUploadComplete()
  }

  const formatSize = (bytes) => {
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
      if (bytes < 1024) return `${bytes.toFixed(1)} ${unit}`
      bytes /= 1024
    }
    return `${bytes.toFixed(1)} TB`
  }

  const isComplete = Object.values(progress).filter((p) => p === 100).length
  const hasErrors = Object.values(progress).filter((p) => p === -1).length

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Upload size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Upload Files</h3>
                <p className="text-sm text-slate-400">
                  {files.length > 0 ? `${files.length} file(s) selected` : 'Select files to upload'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition ${
              dragOver ? 'bg-indigo-100' : 'bg-slate-100'
            }`}>
              <Cloud size={28} className={dragOver ? 'text-indigo-500' : 'text-slate-400'} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {dragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">or click to browse (up to 100MB each)</p>
            <input ref={inputRef} type="file" multiple onChange={(e) => addFiles(e.target.files)} className="hidden" />
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-2 max-h-48 overflow-y-auto"
              >
                {files.map((f) => {
                  const p = progress[f.id]
                  const status = p === undefined ? 'pending' : p === -1 ? 'error' : p === 100 ? 'done' : 'uploading'
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 bg-slate-50 rounded-xl p-3"
                    >
                      <File size={18} className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">{formatSize(f.size)}</p>
                        {status === 'uploading' && (
                          <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${p}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {status === 'pending' && !uploading && (
                          <button onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-red-500 transition">
                            <X size={16} />
                          </button>
                        )}
                        {status === 'done' && <CheckCircle size={18} className="text-emerald-500" />}
                        {status === 'error' && <AlertCircle size={18} className="text-red-500" />}
                        {status === 'uploading' && (
                          <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              whileHover={files.length > 0 && !uploading ? { scale: 1.01 } : {}}
              whileTap={files.length > 0 && !uploading ? { scale: 0.99 } : {}}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/25"
            >
              {uploading
                ? `Uploading... ${isComplete + hasErrors}/${files.length}`
                : `Upload ${files.length > 0 ? `(${files.length})` : ''}`
              }
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
