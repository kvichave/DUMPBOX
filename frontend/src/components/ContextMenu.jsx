import { motion } from 'framer-motion'
import { Eye, Edit3, Link, Trash2 } from 'lucide-react'

export default function ContextMenu({ x, y, item, onRename, onDelete, onShare, onPreview, onClose }) {
  const actions = [
    ...(item._type === 'file'
      ? [{ label: 'Preview', action: onPreview, icon: Eye, color: 'text-slate-600' }]
      : []),
    { label: 'Rename', action: onRename, icon: Edit3, color: 'text-slate-600' },
    ...(item._type === 'file'
      ? [{ label: 'Get Share Link', action: onShare, icon: Link, color: 'text-indigo-600' }]
      : []),
    { label: 'Delete', action: onDelete, icon: Trash2, color: 'text-red-600', danger: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-52 overflow-hidden"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          onClick={action.action}
          whileHover={{ x: 3 }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
            action.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <action.icon size={16} className={action.color} />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}
