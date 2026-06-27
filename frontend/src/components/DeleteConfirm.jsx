import { motion } from 'framer-motion'
import { Trash2, X, AlertTriangle } from 'lucide-react'

export default function DeleteConfirm({ item, onConfirm, onCancel }) {
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
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Delete {item._type}</h3>
          <p className="text-sm text-slate-500 mb-2">
            Are you sure you want to delete "<span className="font-semibold text-slate-700">{item.name}</span>"?
          </p>
          {item._type === 'folder' && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 inline-block">
              All files and subfolders inside will be permanently deleted.
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <motion.button
            onClick={onCancel}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <X size={16} />
            Cancel
          </motion.button>
          <motion.button
            onClick={onConfirm}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
          >
            <Trash2 size={16} />
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
