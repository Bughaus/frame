<template>
  <v-container fluid class="pa-6 bg-surface">
    <!-- Header Section -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold mb-2">{{ t('devices.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('devices.subtitle') }}
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
          {{ t('devices.authorizeNew') }}
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
          <span class="text-h6 font-weight-bold">{{ t('devices.bootstrapTitle') }}</span>
        </template>
        <div class="mt-1">
          {{ t('devices.bootstrapText') }}
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
          <span class="text-h5 font-weight-bold">{{ t('devices.activationCode') }}</span>
        </template>
        <div class="d-flex align-center mt-2">
          <span class="text-h2 font-weight-black mr-6" style="letter-spacing: 4px;">{{ activationCode.code }}</span>
          <div>
            <p class="mb-1">{{ t('devices.activationHint') }}</p>
            <p class="text-caption">{{ t('devices.validUntil') }}: {{ new Date(activationCode.expiresAt).toLocaleTimeString() }} (ca. 15 Min.)</p>
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
        :no-data-text="t('devices.noDevices')"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
            class="font-weight-bold"
            variant="tonal"
          >
            {{ item.isActive ? t('devices.active') : t('devices.revoked') }}
          </v-chip>
        </template>

        <template v-slot:item.lastUsedAt="{ item }">
           {{ item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') : t('devices.never') }}
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-tooltip :text="t('devices.revoke')" location="top" v-if="item.isActive">
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
            
            <v-tooltip :text="t('common.delete')" location="top">
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
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/axios'
import { useConfirm } from '../../composables/useConfirm'

const { t, locale } = useI18n()
const { confirm } = useConfirm()

const devices = ref<any[]>([])
const loading = ref(false)
const generating = ref(false)
const activationCode = ref<any>(null)

const headers = computed(() => [
  { title: t('devices.deviceName'), key: 'name', align: 'start' as const },
  { title: t('common.status'), key: 'status', align: 'center' as const },
  { title: t('devices.lastUsed'), key: 'lastUsedAt', align: 'center' as const },
  { title: t('devices.createdAt'), key: 'createdAt', align: 'center' as const },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'end' as const },
])

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
  if (!await confirm(t('common.confirm'), t('devices.revokeConfirm'))) return
  try {
    await api.post(`/devices/${id}/revoke`)
    await fetchDevices()
  } catch (err) {
    console.error('Failed to revoke device', err)
  }
}

async function deleteDevice(id: string) {
  if (!await confirm(t('common.confirm'), t('devices.deleteConfirm'))) return
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
