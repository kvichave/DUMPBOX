import { useState } from 'react'
import { motion } from 'framer-motion'
import { FolderPlus, X } from 'lucide-react'

export default function NewFolderDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onConfirm(name.trim())
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <FolderPlus size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">New Folder</h3>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 placeholder:text-slate-400"
            autoFocus
            required
          />

          <div className="flex gap-3 mt-4">
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={!name.trim()}
              whileHover={name.trim() ? { scale: 1.01 } : {}}
              whileTap={name.trim() ? { scale: 0.99 } : {}}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/25"
            >
              Create
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
