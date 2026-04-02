import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { useDeviceStore } from '../stores/device.store'

const isProduction = import.meta.env.PROD;
const apiBaseURL = import.meta.env.VITE_API_URL || 
  (isProduction ? '/api/v1' : `${window.location.protocol}//${window.location.hostname}:3000/api/v1`);

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export { apiBaseURL };

api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  const deviceStore = useDeviceStore()
  
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  
  // Inject the Secure Device Token if available
  if (deviceStore.deviceToken) {
    config.headers['X-Device-Token'] = deviceStore.deviceToken
  }
  
  return config
})

api.interceptors.response.use(
  response => response, 
  error => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isLoginRequest) {
       const authStore = useAuthStore()
       authStore.logout()
       window.location.href = '/login'
    }

    // Handle 403 Forbidden specifically for missing or revoked device authorization
    if (error.response && error.response.status === 403) {
      const message = error.response.data?.message;
      const isHardwareError = message?.includes('autorisierten Club-Geräten') || 
                              message?.includes('nicht (mehr) für sensible Funktionen autorisiert');
      
      const isAlreadyOnUnauthorizedPage = window.location.pathname === '/unauthorized-device';

      if (isHardwareError && !isAlreadyOnUnauthorizedPage) {
        const deviceStore = useDeviceStore()
        deviceStore.logoutDevice()
        window.location.href = '/unauthorized-device'
      }
    }

    return Promise.reject(error)
  }
)
