import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Alert, ScrollView, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import api from '../api'
import appConfig from '../config'
import { COLORS, formatSize } from '../utils/helpers'
import FileIcon from '../components/FileIcon'

export default function FilePreviewScreen({ route, navigation }) {
  const { file } = route.params
  const [loading, setLoading] = useState(true)
  const [localUri, setLocalUri] = useState(null)
  const [error, setError] = useState(false)

  const isImage = file.mime_type?.startsWith('image/')
  const isVideo = file.mime_type?.startsWith('video/')
  const isAudio = file.mime_type?.startsWith('audio/')
  const isPdf = file.mime_type === 'application/pdf'

  useEffect(() => {
    downloadPreview()
  }, [])

  const downloadPreview = async () => {
    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('token')
      const url = `${appConfig.API_BASE}/api/files/${file.id}/preview`
      const dest = `${FileSystem.cacheDirectory}preview_${file.id}_${file.name}`
      const result = await FileSystem.downloadAsync(url, dest, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setLocalUri(result.uri)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('token')
      const url = `${appConfig.API_BASE}/api/files/${file.id}/download`
      const dest = `${FileSystem.documentDirectory}${file.name}`
      const result = await FileSystem.downloadAsync(url, dest, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: file.mime_type })
      } else {
        Alert.alert('Downloaded', `File saved to ${result.uri}`)
      }
    } catch {
      Alert.alert('Error', 'Download failed')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.fileMeta}>{formatSize(file.size)}</Text>
        </View>
        <TouchableOpacity onPress={handleDownload} style={styles.dlBtn}>
          <MaterialCommunityIcons name="download" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Loading preview...</Text>
          </View>
        )}

        {error && (
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textSecondary, fontWeight: '600', marginTop: 12 }}>Preview unavailable</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(false); downloadPreview() }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && localUri && isImage && (
          <Image source={{ uri: localUri }} style={{ width: '100%', height: 400 }} resizeMode="contain" />
        )}

        {!loading && !error && localUri && isVideo && (
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => Linking.openURL(localUri)}>
            <MaterialCommunityIcons name="video" size={64} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 8 }}>Tap to open video</Text>
          </TouchableOpacity>
        )}

        {!loading && !error && localUri && isAudio && (
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => Linking.openURL(localUri)}>
            <MaterialCommunityIcons name="music" size={64} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 8 }}>Tap to play audio</Text>
          </TouchableOpacity>
        )}

        {!loading && !error && localUri && isPdf && (
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => Linking.openURL(localUri)}>
            <MaterialCommunityIcons name="file-pdf-box" size={64} color="#ef4444" />
            <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 8 }}>Tap to open PDF</Text>
          </TouchableOpacity>
        )}

        {!loading && !error && !isImage && !isVideo && !isAudio && !isPdf && (
          <View style={{ alignItems: 'center' }}>
            <FileIcon mimeType={file.mime_type} size={64} />
            <Text style={{ color: COLORS.textSecondary, fontWeight: '600', marginTop: 12 }}>Preview not available</Text>
            <TouchableOpacity style={styles.dlBtnAlt} onPress={handleDownload}>
              <MaterialCommunityIcons name="download" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>Download</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  fileMeta: { fontSize: 12, color: COLORS.textMuted },
  dlBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryBtn: {
    marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  dlBtnAlt: {
    marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center',
  },
})
