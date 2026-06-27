import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder as FolderIcon } from 'lucide-react'
import ContextMenu from './ContextMenu'
import FileIcon from './FileIcon'

export default function FileList({
  folders,
  files,
  onNavigate,
  onRename,
  onDelete,
  onShare,
  onPreview,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [contextItem, setContextItem] = useState(null)

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleContextMenu = (e, item, type) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
    setContextItem({ ...item, type })
  }

  const handleRename = () => {
    if (!contextItem) return
    const newName = prompt(`Rename ${contextItem.type}:`, contextItem.name)
    if (newName && newName.trim()) onRename(contextItem, newName.trim())
    setContextMenu(null)
  }

  const handleDelete = () => {
    if (!contextItem) return
    onDelete(contextItem)
    setContextMenu(null)
  }

  const handleShare = () => {
    if (!contextItem || contextItem.type !== 'file') return
    onShare(contextItem)
    setContextMenu(null)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const allItems = [
    ...folders.map((f) => ({ ...f, _type: 'folder' })),
    ...files.map((f) => ({ ...f, _type: 'file' })),
  ]

  return (
    <div className="relative">
      {allItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-slate-400"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
            <FolderIcon size={40} className="text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-500">This folder is empty</p>
          <p className="text-sm mt-1 text-slate-400">Upload files or create a new folder to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <AnimatePresence>
            {allItems.map((item, index) => (
              <motion.div
                key={`${item._type}-${item.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
                onContextMenu={(e) => handleContextMenu(e, item, item._type)}
                onDoubleClick={() => {
                  if (item._type === 'folder') onNavigate(item.id)
                  else onPreview?.(item)
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
                    {item._type === 'folder' ? (
                      <FolderIcon size={30} className="text-amber-400" />
                    ) : (
                      <FileIcon mimeType={item.mime_type} size={30} />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate w-full" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item._type === 'file'
                      ? `${item.size_formatted} · ${formatDate(item.created_at)}`
                      : formatDate(item.created_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextItem}
            onRename={handleRename}
            onDelete={handleDelete}
            onShare={handleShare}
            onPreview={() => { setContextMenu(null); onPreview?.(contextItem) }}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
