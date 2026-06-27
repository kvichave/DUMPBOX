import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, ChevronRight, ChevronDown, Home } from 'lucide-react'
import api from '../api'

export default function Sidebar({ currentFolderId, onNavigate }) {
  const [folders, setFolders] = useState([])
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const { data } = await api.get('/folders/tree')
      setFolders(data)
    } catch {
      // ignore
    }
  }

  const getChildren = (parentId) =>
    folders.filter((f) => f.parent_id === parentId)

  const renderFolder = (folder, depth = 0) => {
    const hasChildren = getChildren(folder.id).length > 0
    const isExpanded = !collapsed[folder.id]
    const isActive = currentFolderId === folder.id

    return (
      <div key={folder.id}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left ${
            isActive
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }))
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {!hasChildren && <span className="w-3.5" />}
          <span>{isActive ? <FolderOpen size={16} className="text-indigo-500" /> : <Folder size={16} />}</span>
          <span className="truncate">{folder.name}</span>
        </motion.button>
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {getChildren(folder.id).map((child) => renderFolder(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={() => onNavigate(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm ${
            currentFolderId === null
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Home size={17} className={currentFolderId === null ? 'text-indigo-500' : ''} />
          <span>My Files</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {folders.filter((f) => !f.parent_id).length}
          </span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {folders.filter((f) => !f.parent_id).map((folder) => renderFolder(folder))}
        {folders.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">
            No folders yet
          </p>
        )}
      </div>
    </aside>
  )
}
