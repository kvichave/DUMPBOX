import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import appConfig from './config'

const api = axios.create({
  baseURL: `${appConfig.API_BASE}/api`,
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user'])
    }
    return Promise.reject(error)
  },
)

export default api
