<template>
  <v-container fluid class="pa-4">

    <!-- Summary & Stats -->
    <v-row v-if="stats">
      <v-col cols="12" md="4">
        <v-card class="pa-4 elevation-2 text-center h-100" color="surface">
          <div class="text-overline text-grey">{{ t('hours.progress') }} {{ year }}</div>
          <div class="text-h3 font-weight-bold text-primary">
            {{ stats.confirmedHours }} / {{ quota?.requiredHours || 0 }}h
          </div>
          <v-progress-linear
            :model-value="quota?.requiredHours ? (stats.confirmedHours / quota.requiredHours) * 100 : 0"
            color="primary" height="12" rounded class="mt-4"
          ></v-progress-linear>
          <div class="text-caption text-grey mt-2">
            {{ t('hours.status') }} {{ progressStatus }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="pa-4 elevation-2 h-100" color="surface">
          <div class="text-h6 mb-2">{{ t('hours.details') }}</div>
          <v-row>
            <v-col cols="6" sm="3">
              <div class="text-caption text-grey">{{ t('hours.confirmed') }}</div>
              <div class="text-h5">{{ stats.confirmedHours }}h</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-grey">{{ t('hours.open') }}</div>
              <div class="text-h5">{{ stats.totalHours - stats.confirmedHours }}h</div>
            </v-col>
            <v-col cols="12" sm="6" class="d-flex align-center justify-end">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="showManualDialog = true">
                {{ t('hours.submit') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" class="mt-6" color="primary">
      <v-tab value="entries">{{ t('hours.myEntries') }}</v-tab>
      <v-tab value="events">{{ t('hours.openEvents') }}</v-tab>
      <v-tab value="calendar">{{ t('hours.calendar') }}</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <!-- MY ENTRIES -->
      <v-window-item value="entries">
        <v-card elevation="2">
          <v-data-table :headers="entryHeaders" :items="entries" :loading="loading" :no-data-text="t('hours.noEntries')">
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.hours="{ item }">
              <span class="font-weight-bold">{{ item.hours }}h</span>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
                {{ translateStatus(item.status) }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                v-if="item.status === 'PLANNED' || item.status === 'COMPLETED'"
                icon="mdi-delete" size="small" variant="text" color="error"
                @click="deleteEntry(item.id)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- OPEN EVENTS -->
      <v-window-item value="events">
        <v-row>
          <v-col v-for="event in events" :key="event.id" cols="12" md="6">
            <v-card elevation="2" border>
              <v-card-title class="d-flex justify-space-between align-center">
                {{ event.title }}
                <v-chip color="primary" variant="outlined">{{ event.hoursValue }}h</v-chip>
              </v-card-title>
              <v-card-subtitle>
                <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                {{ new Date(event.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
                <v-icon size="small" class="ml-3 mr-1">mdi-map-marker</v-icon>
                {{ event.location || 'Vereinsheim' }}
              </v-card-subtitle>
              <v-card-text>
                {{ event.description }}
                <div class="mt-3 text-caption text-grey">
                  Plätze: {{ event._count?.entries ?? 0 }} / {{ event.maxSlots || '∞' }}
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary" variant="flat"
                  :disabled="isSignedUp(event.id) || !!(event.maxSlots && (event._count?.entries ?? 0) >= event.maxSlots)"
                  @click="signup(event.id)"
                >
                  {{ isSignedUp(event.id) ? t('hours.signedUp') : t('hours.signup') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="events.length === 0" cols="12" class="text-center py-12">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <div class="text-h6 text-grey mt-2">{{ t('hours.noEntries') }}</div>
          </v-col>
        </v-row>
      </v-window-item>
      <!-- CALENDAR VIEW -->
      <v-window-item value="calendar">
        <v-card elevation="2" class="pa-4">
          <div v-for="(monthEvents, month) in groupedEvents" :key="month" class="mb-6">
            <h3 class="text-h5 mb-3 border-b pb-2 text-primary">{{ month }}</h3>
            <v-list lines="two">
              <v-list-item v-for="event in monthEvents" :key="event.id" class="px-0">
                <template #prepend>
                  <div class="d-flex flex-column align-center mr-4" style="width: 50px">
                    <span class="text-h6 font-weight-bold">{{ new Date(event.date).getDate() }}</span>
                    <span class="text-caption">{{ new Date(event.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' }) }}</span>
                  </div>
                </template>
                <v-list-item-title class="font-weight-bold">{{ event.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ event.location || 'Vereinsheim' }} • {{ event.hoursValue }}h</v-list-item-subtitle>
                <template #append>
                  <v-btn
                    v-if="!isSignedUp(event.id)"
                    variant="outlined" size="small" color="primary"
                    :disabled="!!(event.maxSlots && (event._count?.entries ?? 0) >= event.maxSlots)"
                    @click="signup(event.id)"
                  >{{ t('hours.signup') }}</v-btn>
                  <v-chip v-else color="success" size="small">{{ t('hours.signedUp') }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div v-if="events.length === 0" class="text-center py-12 text-grey">
            {{ t('hours.noDates') }}
          </div>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- MANUAL ENTRY DIALOG -->
    <v-dialog v-model="showManualDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">{{ t('hours.manualTitle') }}</v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="manualForm" v-model="valid">
            <v-text-field v-model="manualEntry.date" :label="t('hours.manualDate')" type="date" required></v-text-field>
            <v-text-field v-model.number="manualEntry.hours" :label="t('hours.hours')" type="number" step="0.5" required></v-text-field>
            <v-textarea v-model="manualEntry.description" :label="t('hours.manualDesc')" required></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showManualDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!valid" :loading="submitting" @click="submitManual">{{ t('profile.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from '../composables/useConfirm'
import { hoursApi, type HoursEntry, type HoursEvent, type HoursQuota } from '../api/hours'

const { t, locale } = useI18n()
const { confirm } = useConfirm()

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('entries')
const year = ref(new Date().getFullYear())

const stats = ref<any>(null)
const entries = ref<HoursEntry[]>([])
const events = ref<HoursEvent[]>([])
const quota = ref<HoursQuota | null>(null)

const showManualDialog = ref(false)
const valid = ref(false)
const manualEntry = ref({
  date: new Date().toISOString().substr(0, 10),
  hours: 1,
  description: '',
  year: year.value
})

const entryHeaders = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('hours.description'), key: 'description' },
  { title: t('hours.hours'), key: 'hours' },
  { title: t('common.status'), key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const }
])

async function load() {
  loading.value = true
  try {
    const [entryData, eventData, quotaData] = await Promise.all([
      hoursApi.getMyEntries(year.value),
      hoursApi.getEvents(),
      hoursApi.getQuota(year.value)
    ])
    entries.value = entryData.entries
    stats.value = entryData.stats
    events.value = eventData
    quota.value = quotaData
  } catch (e) {
    console.error('Failed to load hours data', e)
  }
  loading.value = false
}

const progressStatus = computed(() => {
  if (!quota.value) return t('hours.noQuota')
  if (stats.value.confirmedHours >= quota.value.requiredHours) return t('hours.quotaMet')
  return `${quota.value.requiredHours - stats.value.confirmedHours}${t('hours.remaining')}`
})

const groupedEvents = computed(() => {
  const groups: Record<string, HoursEvent[]> = {}
  const sorted = [...events.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  sorted.forEach(e => {
    const month = new Date(e.date).toLocaleDateString(locale.value === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' })
    if (!groups[month]) groups[month] = []
    groups[month].push(e)
  })
  return groups
})

function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'COMPLETED': return 'info'
    case 'PLANNED': return 'orange'
    case 'REJECTED': return 'error'
    case 'CANCELLED': return 'grey'
    default: return 'grey'
  }
}

function translateStatus(status: string) {
  switch (status) {
    case 'CONFIRMED': return t('hours.confirmed')
    case 'COMPLETED': return t('hours.submitted')
    case 'PLANNED': return t('hours.open')
    case 'REJECTED': return t('hours.rejected')
    case 'CANCELLED': return t('hours.cancelled')
    default: return status
  }
}

function isSignedUp(eventId: string) {
  return entries.value.some(e => e.eventId === eventId)
}

async function signup(eventId: string) {
  try {
    await hoursApi.signupToEvent(eventId)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || t('hours.signupError'))
  }
}

async function submitManual() {
  submitting.value = true
  try {
    await hoursApi.createManualEntry(manualEntry.value)
    showManualDialog.value = false
    manualEntry.value.description = ''
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || t('hours.submitError'))
  }
  submitting.value = false
}

async function deleteEntry(id: string) {
  if (!await confirm(t('common.confirm'), t('hours.deleteConfirm'))) return
  try {
    await hoursApi.deleteEntry(id)
    await load()
  } catch (e) {
    alert(t('hours.deleteError'))
  }
}

onMounted(() => load())
</script>
