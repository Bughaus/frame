import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/axios'
import { v4 as uuidv4 } from 'uuid'

export const useDeviceStore = defineStore('device', () => {
  const deviceToken = ref<string | null>(localStorage.getItem('device-token'))
  const deviceId = ref<string>(localStorage.getItem('device-id') || '')
  const deviceName = ref<string | null>(localStorage.getItem('device-name'))
  const isBootstrapMode = ref<boolean>(false)

  // Initialize deviceId if not present (persistent hardware identifier for this browser)
  if (!deviceId.value) {
    deviceId.value = uuidv4()
    localStorage.setItem('device-id', deviceId.value)
  }

  const isAuthorized = computed(() => !!deviceToken.value)

  async function fetchStatus() {
    try {
      const response = await api.get('/devices/status')
      isBootstrapMode.value = response.data.bootstrapMode
    } catch (error) {
      console.warn('Could not fetch device status', error)
    }
  }

  async function activateDevice(code: string, name?: string) {
    try {
      const response = await api.post('/devices/activate', {
        code,
        deviceId: deviceId.value,
        name: name || undefined
      })

      const { token, deviceName: activeName } = response.data
      
      deviceToken.value = token
      deviceName.value = activeName
      
      localStorage.setItem('device-token', token)
      localStorage.setItem('device-name', activeName)
      
      // Refresh status after activation
      await fetchStatus()
      
      return { success: true }
    } catch (error: any) {
      console.error('Device activation failed', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Aktivierung fehlgeschlagen.' 
      }
    }
  }

  function logoutDevice() {
    deviceToken.value = null
    deviceName.value = null
    localStorage.removeItem('device-token')
    localStorage.removeItem('device-name')
    fetchStatus()
  }

  return {
    deviceToken,
    deviceId,
    deviceName,
    isAuthorized,
    isBootstrapMode,
    fetchStatus,
    activateDevice,
    logoutDevice
  }
})
