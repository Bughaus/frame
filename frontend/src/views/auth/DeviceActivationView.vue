<template>
  <v-container class="fill-height bg-surface" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-8 rounded-xl elevation-4 border-primary">
          <div class="text-center mb-6">
            <v-icon
              icon="mdi-tablet-cellphone"
              size="64"
              color="primary"
              class="mb-3"
            ></v-icon>
            <h1 class="text-h4 font-weight-bold">Gerät aktivieren</h1>
            <p class="text-medium-emphasis mt-2">
              Geben Sie den Aktivierungscode ein, um dieses Gerät als **autorisiertes Clubhaus-Terminal** zu registrieren.
            </p>
          </div>

          <v-form @submit.prevent="handleActivation" ref="form">
            <v-text-field
              v-model="code"
              label="Aktivierungscode"
              placeholder="z.B. ABC123"
              variant="outlined"
              class="mb-4"
              prepend-inner-icon="mdi-numeric"
              :rules="[v => !!v || 'Code erforderlich.']"
              maxlength="6"
              hint="Diesen Code erhalten Sie von einem Vorstandsmitglied."
              persistent-hint
              rounded="lg"
            ></v-text-field>

            <v-text-field
              v-model="deviceName"
              label="Gerätename (Optional)"
              placeholder="z.B. Kasse Tresen"
              variant="outlined"
              class="mb-6"
              prepend-inner-icon="mdi-label-outline"
              rounded="lg"
            ></v-text-field>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-6 rounded-lg"
              closable
              @click:close="error = ''"
            >
              {{ error }}
            </v-alert>

            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              class="mb-6 rounded-lg"
              icon="mdi-check-decagram"
            >
              Gerät erfolgreich autorisiert! Sie werden weitergeleitet...
            </v-alert>

            <v-btn
              color="primary"
              size="x-large"
              rounded="xl"
              block
              :loading="loading"
              type="submit"
              elevation="2"
            >
              Jetzt aktivieren
            </v-btn>
            
            <v-btn
              variant="text"
              color="medium-emphasis"
              class="mt-4"
              block
              to="/dashboard"
            >
              Abbrechen
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '../../stores/device.store'

const router = useRouter()
const deviceStore = useDeviceStore()

const code = ref('')
const deviceName = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleActivation() {
  if (!code.value) return
  
  loading.value = true
  error.value = ''
  
  const result = await deviceStore.activateDevice(code.value.toUpperCase(), deviceName.value)
  
  if (result.success) {
    success.value = true
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } else {
    error.value = result.message || 'Ungültiger Code oder Verbindungsprobleme.'
  }
  
  loading.value = false
}
</script>

<style scoped>
.border-primary {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
</style>
