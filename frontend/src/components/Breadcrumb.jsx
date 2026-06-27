import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ path, onNavigate }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
      >
        <Home size={15} />
        <span className="font-medium">My Files</span>
      </button>
      {path.map((folder, i) => (
        <motion.span
          key={folder.id}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1"
        >
          <ChevronRight size={14} className="text-slate-300" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded-lg transition ${
              i === path.length - 1
                ? 'text-slate-800 font-semibold cursor-default'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            {folder.name}
          </button>
        </motion.span>
      ))}
    </nav>
  )
}
