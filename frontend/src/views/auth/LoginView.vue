<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4" class="text-center">
        <v-card class="elevation-12 rounded-lg py-4 mb-4">
          <v-card-text class="text-center">
            <v-fade-transition hide-on-leave>
              <!-- RFID SCAN MODE (Default) -->
              <div v-if="loginMode === 'rfid'" key="rfid" class="pa-4">
                <v-icon size="80" color="primary" class="mb-6">mdi-contactless-payment</v-icon>
                <h1 class="text-h5 font-weight-bold mb-2">{{ t('auth.scanTitle') }}</h1>
                <p class="text-body-1 text-grey-darken-1 mb-8">
                  {{ t('auth.scanInstruction') }}
                </p>
                
                <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6" density="compact">
                  {{ errorMsg }}
                </v-alert>

                <v-divider class="mb-6"></v-divider>
                
                <v-btn
                  v-if="deviceStore.isAuthorized"
                  variant="text"
                  color="secondary"
                  @click="loginMode = 'password'"
                  prepend-icon="mdi-keyboard-outline"
                >
                  {{ t('auth.usePassword') }}
                </v-btn>
              </div>

              <!-- PASSWORD MODE -->
              <div v-else key="password" class="pa-4 text-left">
                <div class="d-flex align-center mb-6">
                   <h1 class="text-h5 font-weight-bold">{{ t('auth.login') }}</h1>
                   <v-spacer></v-spacer>
                   <v-btn v-if="deviceStore.isAuthorized" icon="mdi-close" variant="text" size="small" @click="loginMode = 'rfid'"></v-btn>
                </div>

                <v-form @submit.prevent="handleLogin">
                  <v-alert v-if="errorMsg" type="error" class="mb-4" density="compact">{{ errorMsg }}</v-alert>
                  <v-text-field
                    v-model="username"
                    :label="t('auth.username')"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    required
                    :disabled="isLoading"
                  ></v-text-field>
                  <v-text-field
                    v-model="password"
                    :label="t('auth.password')"
                    prepend-inner-icon="mdi-lock"
                    type="password"
                    variant="outlined"
                    required
                    :disabled="isLoading"
                  ></v-text-field>

                  <v-btn type="submit" color="primary" block size="large" class="mt-4" :loading="isLoading">
                    {{ t('auth.login') }}
                  </v-btn>
                </v-form>

                <div v-if="deviceStore.isAuthorized" class="mt-6 text-center">
                  <v-btn variant="text" color="secondary" size="small" @click="loginMode = 'rfid'" prepend-icon="mdi-contactless-payment">
                    {{ t('auth.backToScan') }}
                  </v-btn>
                </div>
              </div>
            </v-fade-transition>
          </v-card-text>
          
          <v-progress-linear
            v-if="isLoading"
            indeterminate
            absolute
            bottom
            color="primary"
          ></v-progress-linear>
        </v-card>
        
        <div class="text-caption text-grey-darken-1 font-weight-medium">
          {{ t('auth.versions', { app: appVersion, api: apiVersion || '...' }) }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/axios'
import { useDeviceStore } from '../../stores/device.store'

const authStore = useAuthStore()
const deviceStore = useDeviceStore()
const router = useRouter()
const { t } = useI18n()

declare const __APP_VERSION__: string
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'
const apiVersion = ref('')

const username = ref('')
const password = ref('')
const loginMode = ref<'rfid' | 'password'>(deviceStore.isAuthorized ? 'rfid' : 'password')
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (username.value && password.value) {
    isLoading.value = true
    errorMsg.value = ''
    
    const success = await authStore.login({ username: username.value, password: password.value })
    if (success) {
      router.push('/dashboard')
    } else {
      errorMsg.value = t('auth.invalidLogin')
    }
    
    isLoading.value = false
  }
}

// RFID SCANNER HANDLING
const rfidBuffer = ref('')
let rfidTimeout: ReturnType<typeof setTimeout> | null = null
let lastKeyTime = 0

function handleKeyDown(e: KeyboardEvent) {
  const currentTime = Date.now()
  const diff = currentTime - lastKeyTime
  lastKeyTime = currentTime

  if (rfidTimeout) clearTimeout(rfidTimeout)

  // Detect fast typing (RFID scanner/barcode reader speed is typically < 20ms)
  const isFast = diff < 50 

  if (e.key === 'Enter') {
    if (rfidBuffer.value.length > 5) {
      // It's a valid scan sequence
      e.preventDefault()
      e.stopPropagation()
      const token = rfidBuffer.value
      rfidBuffer.value = ''
      
      // Clear fields to remove any junk that might have leaked in (like the first character)
      username.value = ''
      password.value = ''
      
      submitRfid(token)
    } else {
      // Normal Enter key or too short to be an RFID
      rfidBuffer.value = ''
    }
  } else if (e.key.length === 1) {
    // If subsequent characters are coming in fast, we treat it as a scanner
    // and prevent the character from entering the focused input field.
    if (isFast && rfidBuffer.value.length > 0) {
      e.preventDefault()
      rfidBuffer.value += e.key
    } else if (!isFast) {
      // If it's slow, we reset the buffer and treat it as the start of a possible new scan
      rfidBuffer.value = e.key
    } else {
      // It's fast but the first character, we let it through to the field but buffer it
      rfidBuffer.value += e.key
    }
  }

  rfidTimeout = setTimeout(() => {
    rfidBuffer.value = ''
  }, 100)
}

async function submitRfid(token: string) {
  isLoading.value = true
  errorMsg.value = ''
  const success = await authStore.loginRfid(token)
  if (success) {
    router.push('/dashboard')
  } else {
    errorMsg.value = t('auth.invalidRfid')
  }
  isLoading.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown, true)
  try {
    const res = await api.get('/version')
    apiVersion.value = res.data
  } catch (e) {
    apiVersion.value = 'unknown'
  }
})
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown, true))
</script>
