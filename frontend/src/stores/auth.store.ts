import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken') || null)
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken') || null)
  const storedUser = localStorage.getItem('user')
  const user = ref<any>(storedUser ? JSON.parse(storedUser) : null)
  const inboxStatus = ref<any>(null)
  
  const expiresAt = ref<number>(Number(localStorage.getItem('expiresAt')) || 0)
  const lastActivity = ref<number>(Date.now())
  
  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(credentials: Record<string, string>) {
    try {
      const { data } = await api.post('/auth/login', credentials)
      return handleLoginSuccess(data)
    } catch (e: any) {
      console.error('Login failed', e.response?.data)
      return false
    }
  }

  async function loginRfid(token: string) {
    try {
      const { data } = await api.post('/auth/login/rfid', { token })
      return handleLoginSuccess(data)
    } catch (e: any) {
      console.error('RFID Login failed', e.response?.data)
      return false
    }
  }

  function handleLoginSuccess(data: any) {
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = data.user
    
    // Calculate expiration: current time + expiresIn (seconds)
    const expiry = Date.now() + (data.expiresIn || 900) * 1000
    expiresAt.value = expiry
    lastActivity.value = Date.now()

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('expiresAt', expiry.toString())
    
    fetchInboxStatus() 
    return true
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) return false
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken: refreshToken.value })
      
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      
      const expiry = Date.now() + (data.expiresIn || 900) * 1000
      expiresAt.value = expiry
      
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('expiresAt', expiry.toString())
      
      console.log('Session refreshed successfully')
      return true
    } catch (e) {
      console.error('Session refresh failed', e)
      logout()
      return false
    }
  }

  async function fetchInboxStatus() {
    if (!isAuthenticated.value) return
    try {
      const { data } = await api.get('/members/me/inbox-status')
      inboxStatus.value = data
    } catch (e) {
      console.error('Failed to fetch inbox status', e)
    }
  }

  function setToken(token: string) {
    accessToken.value = token
    localStorage.setItem('accessToken', token)
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    expiresAt.value = 0
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('expiresAt')
    inboxStatus.value = null
  }

  function hasRole(allowedRoles: string[]) {
    if (!user.value || !user.value.roles) return false
    return user.value.roles.some((r: string) => allowedRoles.includes(r))
  }

  return { 
    accessToken, 
    refreshToken, 
    user, 
    inboxStatus, 
    isAuthenticated, 
    expiresAt, 
    lastActivity,
    login, 
    loginRfid, 
    setToken, 
    logout, 
    hasRole, 
    fetchInboxStatus,
    refreshAccessToken
  }
})
