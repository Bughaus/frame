<template>
  <v-container fluid class="pa-6 bg-surface">
    <!-- Header Section -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold mb-2">Geräteverwaltung</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Verwalten Sie autorisierte Clubhouse-Hardware und generieren Sie Aktivierungscodes.
        </p>
      </v-col>
      <v-col cols="12" md="4" class="text-md-right">
        <v-btn
          color="primary"
          size="large"
          rounded="xl"
          prepend-icon="mdi-plus"
          @click="generateCode"
          :loading="generating"
          elevation="2"
        >
          Neues Gerät autorisieren
        </v-btn>
      </v-col>
    </v-row>

    <!-- Bootstrap Mode Warning -->
    <v-expand-transition>
      <v-alert
        v-if="!loading && devices.length === 0"
        type="warning"
        variant="tonal"
        class="mb-6 pa-6 rounded-xl border-warning"
        icon="mdi-shield-alert-outline"
      >
        <template v-slot:title>
          <span class="text-h6 font-weight-bold">System-Bootstrap-Modus</span>
        </template>
        <div class="mt-1">
          Bisher wurde **kein Gerät** als autorisiertes Club-Terminal registriert. 
          Das System ist aktuell im Übergangsmodus offen für Vorstände. 
          Bitte autorisieren Sie dieses oder ein anderes Gerät umgehend, um den **vollständigen Sicherheitsstatus** zu aktivieren.
        </div>
      </v-alert>
    </v-expand-transition>

    <!-- Activation Code Alert -->
    <v-expand-transition>
      <v-alert
        v-if="activationCode"
        type="success"
        variant="elevated"
        class="mb-8 pa-6 rounded-xl elevation-4"
        icon="mdi-key-chain"
        border="start"
        closable
        @click:close="activationCode = null"
      >
        <template v-slot:title>
          <span class="text-h5 font-weight-bold">Geräte-Aktivierungscode</span>
        </template>
        <div class="d-flex align-center mt-2">
          <span class="text-h2 font-weight-black mr-6" style="letter-spacing: 4px;">{{ activationCode.code }}</span>
          <div>
            <p class="mb-1">Geben Sie diesen Code auf dem Zielgerät unter <strong>/activate-device</strong> ein.</p>
            <p class="text-caption">Gültig bis: {{ new Date(activationCode.expiresAt).toLocaleTimeString() }} (ca. 15 Min.)</p>
          </div>
        </div>
      </v-alert>
    </v-expand-transition>

    <!-- Device List -->
    <v-card class="rounded-xl elevation-3 border">
      <v-data-table
        :headers="headers"
        :items="devices"
        :loading="loading"
        hover
        class="bg-transparent"
        no-data-text="Keine autorisierten Geräte gefunden."
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
            class="font-weight-bold"
            variant="tonal"
          >
            {{ item.isActive ? 'Aktiv' : 'Widerrufen' }}
          </v-chip>
        </template>

        <template v-slot:item.lastUsedAt="{ item }">
           {{ item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString('de-DE') : 'Noch nie' }}
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-tooltip text="Widerrufen" location="top" v-if="item.isActive">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-shield-off-outline"
                  variant="text"
                  color="warning"
                  @click="revokeDevice(item.id)"
                ></v-btn>
              </template>
            </v-tooltip>
            
            <v-tooltip text="Löschen" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  @click="deleteDevice(item.id)"
                ></v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api/axios'

const devices = ref<any[]>([])
const loading = ref(false)
const generating = ref(false)
const activationCode = ref<any>(null)

const headers: any[] = [
  { title: 'Gerätename', key: 'name', align: 'start' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Letzte Nutzung', key: 'lastUsedAt', align: 'center' },
  { title: 'Erstellt am', key: 'createdAt', align: 'center' },
  { title: 'Aktionen', key: 'actions', sortable: false, align: 'end' },
]

async function fetchDevices() {
  loading.value = true
  try {
    const response = await api.get('/devices')
    devices.value = response.data
  } catch (err) {
    console.error('Failed to fetch devices', err)
  }
  loading.value = false
}

async function generateCode() {
  generating.value = true
  try {
    const response = await api.post('/devices/activation-code')
    activationCode.value = response.data
  } catch (err) {
    console.error('Failed to generate code', err)
  }
  generating.value = false
}

async function revokeDevice(id: string) {
  if (!confirm('Dieses Gerät wird gesperrt und verliert sofortigen Zugriff auf alle sensiblen Funktionen. Fortfahren?')) return
  try {
    await api.post(`/devices/${id}/revoke`)
    await fetchDevices()
  } catch (err) {
    console.error('Failed to revoke device', err)
  }
}

async function deleteDevice(id: string) {
  if (!confirm('Gerät permanent löschen?')) return
  try {
    await api.delete(`/devices/${id}`)
    await fetchDevices()
  } catch (err) {
    console.error('Failed to delete device', err)
  }
}

onMounted(fetchDevices)
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.border {
  border: 1px solid rgba(var(--v-theme-primary), 0.1) !important;
}
</style>
