import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import api from '../api'
import appConfig from '../config'
import { COLORS, formatSize } from '../utils/helpers'
import FileIcon from '../components/FileIcon'

export default function PublicShareScreen({ route }) {
  const { token } = route.params
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchInfo()
  }, [])

  const fetchInfo = async () => {
    try {
      const { data } = await api.get(`/shares/${token}/info`)
      setInfo(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Share link not found')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = `${appConfig.API_BASE}/api/shares/${token}`
      const dest = `${FileSystem.cacheDirectory}shared_${info?.file_name || 'file'}`
      const result = await FileSystem.downloadAsync(url, dest)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri)
      } else {
        Alert.alert('Downloaded', 'File saved successfully')
      }
    } catch {
      Alert.alert('Error', 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={styles.card}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 }}>
              <MaterialCommunityIcons name="alert-circle" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.cardTitle}>Link Not Available</Text>
            <Text style={styles.cardSub}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={styles.card}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 }}>
            <MaterialCommunityIcons name="harddisk" size={32} color={COLORS.primary} />
          </View>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.text }}>DumpBox</Text>
          <Text style={{ textAlign: 'center', fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Shared File</Text>

          <View style={{ backgroundColor: COLORS.bg, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 }}>
            <FileIcon mimeType={info?.file_name?.split('.').pop()} size={36} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 8, textAlign: 'center' }} numberOfLines={2}>
              {info?.file_name}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{formatSize(info?.file_size)}</Text>
          </View>

          <TouchableOpacity style={styles.dlBtn} onPress={handleDownload} disabled={downloading} activeOpacity={0.85}>
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="download" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Download File</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 }}>
            <MaterialCommunityIcons name="lock" size={12} color={COLORS.textMuted} />
            <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Secure file sharing by DumpBox</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2ff' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 24,
    padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  cardTitle: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardSub: { textAlign: 'center', fontSize: 14, color: COLORS.textSecondary },
  dlBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    height: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
})
