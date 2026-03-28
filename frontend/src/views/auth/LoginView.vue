<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary">
            <v-toolbar-title>{{ t('auth.login') }}</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-alert v-if="errorMsg" type="error" class="mb-4" density="compact">{{ errorMsg }}</v-alert>
              <v-text-field
                v-model="username"
                :label="t('auth.username', 'Benutzername')"
                prepend-icon="mdi-account"
                type="text"
                required
                :disabled="isLoading"
              ></v-text-field>
              <v-text-field
                v-model="password"
                :label="t('auth.password', 'Passwort')"
                prepend-icon="mdi-lock"
                type="password"
                required
                :disabled="isLoading"
              ></v-text-field>

              <div class="mt-4 text-center text-caption text-grey">
                {{ t('auth.loginWithRfid', 'Oder RFID Token scannen...') }}
              </div>
              <v-btn type="submit" color="primary" block class="mt-4" :loading="isLoading">{{ t('auth.login') }}</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const username = ref('')
const password = ref('')
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
      errorMsg.value = t('auth.invalidLogin', 'Ungültige Anmeldedaten.')
    }
    
    isLoading.value = false
  }
}

// RFID EMULATION
const rfidBuffer = ref('')
let rfidTimeout: ReturnType<typeof setTimeout> | null = null

function handleKeypress(e: KeyboardEvent) {
  if (rfidTimeout) clearTimeout(rfidTimeout)
  
  if (e.key === 'Enter' && rfidBuffer.value.length > 5) {
     const token = rfidBuffer.value
     rfidBuffer.value = ''
     submitRfid(token)
  } else if (e.key.length === 1) {
     rfidBuffer.value += e.key
  }
  
  rfidTimeout = setTimeout(() => {
     rfidBuffer.value = '' 
  }, 50)
}

async function submitRfid(token: string) {
  isLoading.value = true
  errorMsg.value = ''
  const success = await authStore.loginRfid(token)
  if (success) {
    router.push('/dashboard')
  } else {
    errorMsg.value = t('auth.invalidRfid', 'RFID Token ungültig.')
  }
  isLoading.value = false
}

onMounted(() => window.addEventListener('keypress', handleKeypress))
onUnmounted(() => window.removeEventListener('keypress', handleKeypress))
</script>
