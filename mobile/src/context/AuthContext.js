import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const userData = await AsyncStorage.getItem('user')
      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const login = async (token, userData) => {
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user'])
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
