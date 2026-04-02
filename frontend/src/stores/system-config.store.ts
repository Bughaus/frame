import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, apiBaseURL } from '../api/axios'

export const useSystemConfigStore = defineStore('systemConfig', () => {
  const configs = ref<Record<string, string>>({})
  const loading = ref(false)

  const clubName = computed(() => configs.value['CLUB_NAME'] || 'FRAME')
  const clubEmail = computed(() => configs.value['CLUB_EMAIL'] || '')
  const clubVorstandNames = computed(() => configs.value['CLUB_VORSTAND_NAMES'] || '')
  const clubLogoUrl = computed(() => {
    const relativeUrl = configs.value['CLUB_LOGO_URL'];
    if (!relativeUrl) return '/logo.png';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    
    // Calculate the backend origin (e.g. http://localhost:3000)
    const backendOrigin = apiBaseURL.split('/api/v1')[0];
    return `${backendOrigin}${relativeUrl}`;
  })
  const websiteDisclaimer = computed(() => configs.value['CLUB_WEBSITE_DISCLAIMER'] || '')
  const isRfidEnabled = computed(() => configs.value['AUTH_RFID_ENABLED'] !== 'false')

  async function fetchPublicConfig() {
    try {
      const { data } = await api.get('/system-config')
      data.forEach((c: any) => {
        configs.value[c.key] = c.value
      })
    } catch (error) {
      console.error('Failed to fetch public config', error)
    }
  }

  async function fetchAdminConfig() {
    loading.value = true
    try {
      const { data } = await api.get('/system-config/admin')
      data.forEach((c: any) => {
        configs.value[c.key] = c.value
      })
    } catch (error) {
      console.error('Failed to fetch admin config', error)
    } finally {
      loading.value = false
    }
  }

  async function updateConfigs(updates: Record<string, string>) {
    try {
      await api.patch('/system-config', updates)
      // Merge updates into local state
      Object.entries(updates).forEach(([key, value]) => {
        configs.value[key] = value
      })
    } catch (error) {
      console.error('Failed to update configs', error)
      throw error
    }
  }

  async function uploadLogo(file: File) {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const { data } = await api.post('/system-config/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      configs.value['CLUB_LOGO_URL'] = data.imageUrl
      return data.imageUrl
    } catch (error) {
      console.error('Failed to upload logo', error)
      throw error
    }
  }

  async function sendTestEmail() {
    try {
      const { data } = await api.post('/system-config/test-email')
      return data
    } catch (error) {
      console.error('Failed to send test email', error)
      throw error
    }
  }

  return {
    configs,
    loading,
    clubName,
    clubEmail,
    clubVorstandNames,
    clubLogoUrl,
    websiteDisclaimer,
    isRfidEnabled,
    fetchPublicConfig,
    fetchAdminConfig,
    updateConfigs,
    uploadLogo,
    sendTestEmail
  }
})
