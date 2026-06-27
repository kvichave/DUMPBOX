import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FolderPlus, Search, LogOut, HardDrive,
  Bell, Settings,
} from 'lucide-react'
import api from '../api'
import Sidebar from './Sidebar'
import FileList from './FileList'
import Breadcrumb from './Breadcrumb'
import UploadModal from './UploadModal'
import ShareDialog from './ShareDialog'
import FilePreview from './FilePreview'
import DeleteConfirm from './DeleteConfirm'
import NewFolderDialog from './NewFolderDialog'

export default function Dashboard() {
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [shareFile, setShareFile] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    loadContents()
    loadBreadcrumbs()
  }, [currentFolderId])

  const loadContents = useCallback(async () => {
    try {
      const params = currentFolderId ? { parent_id: currentFolderId } : {}
      const [foldersRes, filesRes] = await Promise.all([
        api.get('/folders', { params }),
        api.get('/files', { params: currentFolderId ? { folder_id: currentFolderId } : {} }),
      ])
      setFolders(foldersRes.data)
      setFiles(filesRes.data)
    } catch {
      // ignore
    }
  }, [currentFolderId])

  const loadBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([])
      return
    }
    try {
      const trail = []
      let current = currentFolderId
      while (current) {
        const { data } = await api.get('/folders/tree')
        const folder = data.find((f) => f.id === current)
        if (folder) {
          trail.unshift({ id: folder.id, name: folder.name })
          current = folder.parent_id
        } else break
      }
      setBreadcrumbs(trail)
    } catch {
      setBreadcrumbs([])
    }
  }

  const handleNavigate = (folderId) => setCurrentFolderId(folderId)

  const handleCreateFolder = async (name) => {
    try {
      await api.post('/folders', { name, parent_id: currentFolderId })
      setShowNewFolder(false)
      loadContents()
    } catch {
      // ignore
    }
  }

  const handleRename = async (item, newName) => {
    try {
      const endpoint = item._type === 'folder' ? `/folders/${item.id}` : `/files/${item.id}`
      await api.put(endpoint, { name: newName })
      loadContents()
    } catch {
      // ignore
    }
  }

  const handleDelete = (item) => setDeleteItem(item)

  const confirmDelete = async () => {
    if (!deleteItem) return
    try {
      const endpoint = deleteItem._type === 'folder' ? `/folders/${deleteItem.id}` : `/files/${deleteItem.id}`
      await api.delete(endpoint)
      setDeleteItem(null)
      loadContents()
    } catch {
      // ignore
    }
  }

  const handleShare = (file) => setShareFile(file)
  const handlePreview = (file) => setPreviewFile(file)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    loadContents()
  }

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <HardDrive size={18} className="text-white" />
            </div>
            <span className="text-lg font-extrabold text-slate-800 hidden sm:block tracking-tight">
              DumpBox
            </span>
          </div>
          <div className="hidden md:flex items-center">
            <Breadcrumb path={breadcrumbs} onNavigate={handleNavigate} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-48 lg:w-56 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <button className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
            <Bell size={16} />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-slate-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hidden md:block"
        >
          <Sidebar currentFolderId={currentFolderId} onNavigate={handleNavigate} />
        </motion.div>

        <main className="flex-1 overflow-y-auto">
          {/* Action Bar */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-6 py-4 flex items-center gap-3 bg-white border-b border-slate-100 sticky top-0 z-10"
          >
            <motion.button
              onClick={() => setShowUpload(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25"
            >
              <Upload size={16} />
              <span>Upload</span>
            </motion.button>
            <motion.button
              onClick={() => setShowNewFolder(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <FolderPlus size={16} />
              <span>New Folder</span>
            </motion.button>

            {/* Mobile search */}
            <div className="relative md:hidden ml-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-32 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Mobile breadcrumb */}
            <div className="md:hidden ml-2">
              <Breadcrumb path={breadcrumbs} onNavigate={handleNavigate} />
            </div>
          </motion.div>

          {/* File Grid */}
          <div className="p-6">
            <FileList
              folders={filteredFolders}
              files={filteredFiles}
              currentFolderId={currentFolderId}
              onNavigate={handleNavigate}
              onRename={handleRename}
              onDelete={handleDelete}
              onShare={handleShare}
              onPreview={handlePreview}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            folderId={currentFolderId}
            onClose={() => setShowUpload(false)}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {showNewFolder && (
          <NewFolderDialog
            onConfirm={handleCreateFolder}
            onCancel={() => setShowNewFolder(false)}
          />
        )}

        {shareFile && (
          <ShareDialog
            file={shareFile}
            onClose={() => setShareFile(null)}
          />
        )}

        {deleteItem && (
          <DeleteConfirm
            item={deleteItem}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteItem(null)}
          />
        )}

        {previewFile && (
          <FilePreview
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
