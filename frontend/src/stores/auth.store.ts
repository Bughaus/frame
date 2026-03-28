import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken') || null)
  const storedUser = localStorage.getItem('user')
  const user = ref<any>(storedUser ? JSON.parse(storedUser) : null)
  
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
    user.value = data.user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return true
  }

  function setToken(token: string) {
    accessToken.value = token
    localStorage.setItem('accessToken', token)
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  function hasRole(allowedRoles: string[]) {
    if (!user.value || !user.value.roles) return false
    return user.value.roles.some((r: string) => allowedRoles.includes(r))
  }

  return { accessToken, user, isAuthenticated, login, loginRfid, setToken, logout, hasRole }
})
