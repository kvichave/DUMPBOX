import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Modal, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { COLORS, formatSize, formatDate } from '../utils/helpers'
import api from '../api'
import FileIcon from '../components/FileIcon'

export default function HomeScreen({ navigation }) {
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [folderTree, setFolderTree] = useState([])
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showShare, setShowShare] = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const { user, logout } = useAuth()

  useEffect(() => {
    loadContents()
    loadBreadcrumbs()
    loadFolderTree()
  }, [currentFolderId])

  const loadContents = useCallback(async () => {
    try {
      const params = currentFolderId ? { parent_id: currentFolderId } : {}
      const [fRes, fiRes] = await Promise.all([
        api.get('/folders', { params }),
        api.get('/files', { params: currentFolderId ? { folder_id: currentFolderId } : {} }),
      ])
      setFolders(fRes.data)
      setFiles(fiRes.data)
    } catch { /* ignore */ }
  }, [currentFolderId])

  const loadFolderTree = async () => {
    try {
      const { data } = await api.get('/folders/tree')
      setFolderTree(data)
    } catch { /* ignore */ }
  }

  const loadBreadcrumbs = async () => {
    if (!currentFolderId) { setBreadcrumbs([]); return }
    try {
      const trail = []
      let current = currentFolderId
      const { data } = await api.get('/folders/tree')
      while (current) {
        const f = data.find((x) => x.id === current)
        if (f) { trail.unshift({ id: f.id, name: f.name }); current = f.parent_id }
        else break
      }
      setBreadcrumbs(trail)
    } catch { setBreadcrumbs([]) }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadContents()
    setRefreshing(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await api.post('/folders', { name: newFolderName.trim(), parent_id: currentFolderId })
      setShowNewFolder(false)
      setNewFolderName('')
      loadContents()
    } catch { Alert.alert('Error', 'Failed to create folder') }
  }

  const handleUpload = async () => {
    try {
      const { DocumentPicker } = require('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (result.canceled) return
      setUploading(true)
      const file = result.assets[0]
      const formData = new FormData()
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' })
      if (currentFolderId) formData.append('folder_id', String(currentFolderId))
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setShowUpload(false)
      loadContents()
    } catch (err) {
      Alert.alert('Error', 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRename = (item) => {
    Alert.prompt(
      `Rename ${item._type}`,
      '',
      async (newName) => {
        if (!newName || !newName.trim()) return
        try {
          const endpoint = item._type === 'folder' ? `/folders/${item.id}` : `/files/${item.id}`
          await api.put(endpoint, { name: newName.trim() })
          loadContents()
        } catch { Alert.alert('Error', 'Rename failed') }
      },
      'plain-text',
      item.name,
    )
  }

  const confirmDelete = async () => {
    if (!showDelete) return
    try {
      const endpoint = showDelete._type === 'folder' ? `/folders/${showDelete.id}` : `/files/${showDelete.id}`
      await api.delete(endpoint)
      setShowDelete(null)
      loadContents()
    } catch { Alert.alert('Error', 'Delete failed') }
  }

  const handleShare = async (file) => {
    try {
      const { data } = await api.post('/shares', { file_id: file.id })
      const url = `http://localhost:5000/api/shares/${data.token}`
      setShareUrl(url)
      setShowShare(file)
    } catch { Alert.alert('Error', 'Failed to generate link') }
  }

  const copyShare = async () => {
    try {
      const Clipboard = require('expo-clipboard')
      await Clipboard.setStringAsync(shareUrl)
      Alert.alert('Copied', 'Share link copied to clipboard')
    } catch { Alert.alert('Error', 'Failed to copy') }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  const allItems = [
    ...folders.map((f) => ({ ...f, _type: 'folder' })),
    ...files.map((f) => ({ ...f, _type: 'file' })),
  ]

  const filtered = allItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        if (item._type === 'folder') setCurrentFolderId(item.id)
        else navigation.navigate('FilePreview', { file: item })
      }}
      onLongPress={() => {
        Alert.alert(item.name, '', [
          { text: 'Rename', onPress: () => handleRename(item) },
          ...(item._type === 'file'
            ? [{ text: 'Share', onPress: () => handleShare(item) }]
            : []),
          { text: 'Delete', style: 'destructive', onPress: () => setShowDelete(item) },
          { text: 'Cancel', style: 'cancel' },
        ])
      }}
      activeOpacity={0.7}
    >
      <View style={styles.iconBg}>
        {item._type === 'folder' ? (
          <MaterialCommunityIcons name="folder" size={32} color="#f59e0b" />
        ) : (
          <FileIcon mimeType={item.mime_type} size={32} />
        )}
      </View>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemMeta}>
        {item._type === 'file' ? `${formatSize(item.size)} · ${formatDate(item.created_at)}` : formatDate(item.created_at)}
      </Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <MaterialCommunityIcons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.breadcrumbRow}>
            <TouchableOpacity onPress={() => setCurrentFolderId(null)}>
              <Text style={[styles.breadcrumbText, !currentFolderId && styles.breadcrumbActive]}>My Files</Text>
            </TouchableOpacity>
            {breadcrumbs.map((b, i) => (
              <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textMuted} />
                <TouchableOpacity onPress={() => setCurrentFolderId(b.id)}>
                  <Text style={[styles.breadcrumbText, i === breadcrumbs.length - 1 && styles.breadcrumbActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search & Actions */}
      <View style={styles.actionBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput} placeholder="Search..."
            placeholderTextColor={COLORS.textMuted}
            value={search} onChangeText={setSearch}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowUpload(true)}>
            <MaterialCommunityIcons name="upload" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.border }]} onPress={() => setShowNewFolder(true)}>
            <MaterialCommunityIcons name="folder-plus" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => `${item._type}-${item.id}`}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <MaterialCommunityIcons name="folder-open-outline" size={60} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 12 }}>This folder is empty</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>Upload files or create a folder</Text>
          </View>
        }
      />

      {/* Sidebar Modal */}
      <Modal visible={showSidebar} animationType="slide" transparent>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowSidebar(false)}>
          <View style={styles.sidebarOverlay}>
            <TouchableOpacity activeOpacity={1} style={styles.sidebarContent}>
              <View style={styles.sidebarHeader}>
                <MaterialCommunityIcons name="harddisk" size={24} color={COLORS.primary} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginLeft: 10 }}>DumpBox</Text>
                <TouchableOpacity onPress={() => setShowSidebar(false)} style={{ marginLeft: 'auto' }}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.sidebarItem, !currentFolderId && styles.sidebarItemActive]}
                onPress={() => { setCurrentFolderId(null); setShowSidebar(false) }}
              >
                <MaterialCommunityIcons name="home" size={20} color={!currentFolderId ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.sidebarItemText, !currentFolderId && { color: COLORS.primary, fontWeight: '700' }]}>My Files</Text>
              </TouchableOpacity>

              {folderTree.filter((f) => !f.parent_id).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.sidebarItem, currentFolderId === f.id && styles.sidebarItemActive]}
                  onPress={() => { setCurrentFolderId(f.id); setShowSidebar(false) }}
                >
                  <MaterialCommunityIcons name="folder-outline" size={20} color={currentFolderId === f.id ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.sidebarItemText, currentFolderId === f.id && { color: COLORS.primary, fontWeight: '700' }]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Folder Modal */}
      <Modal visible={showNewFolder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="folder-plus" size={22} color={COLORS.warning} />
              <Text style={styles.modalTitle}>New Folder</Text>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor={COLORS.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.border }]} onPress={() => { setShowNewFolder(false); setNewFolderName('') }}>
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={handleCreateFolder}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={!!showDelete} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="alert-circle" size={28} color={COLORS.danger} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Delete {showDelete?._type}</Text>
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 }}>
              Are you sure you want to delete "{showDelete?.name}"?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.border }]} onPress={() => setShowDelete(null)}>
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.danger }]} onPress={confirmDelete}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={!!showShare} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="link" size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Share Link</Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 }} numberOfLines={1}>{showShare?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ flex: 1, fontSize: 12, color: COLORS.text, paddingHorizontal: 10 }} numberOfLines={1}>{shareUrl}</Text>
              <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }} onPress={copyShare}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.border, marginTop: 16 }]} onPress={() => { setShowShare(null); setShareUrl('') }}>
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal visible={showUpload} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="upload" size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Upload File</Text>
            </View>
            {uploading ? (
              <ActivityIndicator color={COLORS.primary} size="large" style={{ paddingVertical: 20 }} />
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: COLORS.bg, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', padding: 30, alignItems: 'center', marginTop: 8 }}
                onPress={handleUpload}
              >
                <MaterialCommunityIcons name="cloud-upload" size={40} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textSecondary, fontWeight: '600', marginTop: 8 }}>Tap to select a file</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.border, marginTop: 16 }]} onPress={() => setShowUpload(false)}>
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  breadcrumbText: { fontSize: 13, color: COLORS.textSecondary, marginHorizontal: 2 },
  breadcrumbActive: { color: COLORS.text, fontWeight: '700' },
  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 10,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: 12,
    paddingHorizontal: 12, height: 38, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: 6 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  gridItem: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  iconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10, alignSelf: 'center' },
  itemName: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  itemMeta: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  sidebarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  sidebarContent: { width: '70%', backgroundColor: COLORS.surface, height: '100%', padding: 16 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  sidebarItemActive: { backgroundColor: COLORS.primaryLight },
  sidebarItemText: { fontSize: 15, color: COLORS.textSecondary, marginLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 32 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  modalInput: { backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, height: 46, fontSize: 15, color: COLORS.text, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center' },
})
