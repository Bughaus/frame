<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-calendar-check</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('hoursAdmin.title') }}</h1>
    </div>

    <v-tabs v-model="tab" color="primary">
      <v-tab value="pending">{{ t('hoursAdmin.pending') }}</v-tab>
      <v-tab value="summary">{{ t('hoursAdmin.summary') }}</v-tab>
      <v-tab value="events">{{ t('hoursAdmin.maintenance') }}</v-tab>
      <v-tab value="quota">{{ t('hoursAdmin.quota') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-6">
      <v-window-item value="pending">
        <v-card elevation="2">
          <v-data-table :headers="pendingHeaders" :items="pendingEntries" :loading="loading" :no-data-text="t('common.noData')">
            <template #item.member="{ item }">
              {{ item.member?.firstName }} {{ item.member?.lastName }} ({{ item.member?.memberNumber }})
            </template>
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.hours="{ item }">
              <strong>{{ item.hours }}h</strong>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-check" color="success" variant="text" @click="updateStatus(item.id, 'CONFIRMED')"></v-btn>
              <v-btn icon="mdi-close" color="error" variant="text" @click="updateStatus(item.id, 'REJECTED')"></v-btn>
            </template>
          </v-data-table>
          <div v-if="pendingEntries.length === 0" class="pa-12 text-center text-grey">
            {{ t('hoursAdmin.noPending') }}
          </div>
        </v-card>
      </v-window-item>

      <!-- SUMMARY OVERVIEW -->
      <v-window-item value="summary">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center flex-wrap">
            <span class="mr-4">{{ t('hoursAdmin.statusAll') }}</span>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="summaryFilter" mandatory density="compact" color="primary">
              <v-btn value="ALL">{{ t('common.all') }}</v-btn>
              <v-btn value="OPEN">{{ t('hours.open') }}</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-data-table :headers="summaryHeaders" :items="filteredSummary" :loading="loading" class="pb-4" :no-data-text="t('common.noData')">
            <template #item.member="{ item }">
              <div class="font-weight-bold">{{ item.firstName }} {{ item.lastName }}</div>
              <div class="text-caption text-grey">#{{ item.memberNumber }}</div>
            </template>
            <template #item.progress="{ item }">
              <div class="d-flex align-center">
                <v-progress-linear
                  :model-value="item.requiredHours > 0 ? (item.confirmedHours / item.requiredHours) * 100 : 0"
                  height="18" rounded color="primary" class="mr-3" style="width: 150px"
                >
                  <template v-slot:default="{ value }">
                    <span class="text-caption font-weight-black text-white">{{ Math.ceil(value) }}%</span>
                  </template>
                </v-progress-linear>
                <span>{{ item.confirmedHours }} / {{ item.requiredHours }}h</span>
              </div>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="item.isFulfilled ? 'success' : 'warning'" size="small" variant="flat">
                {{ item.isFulfilled ? t('hoursAdmin.fulfilled') : t('hours.open') }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- EVENTS MANAGEMENT -->
      <v-window-item value="events">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showEventDialog = true">{{ t('hoursAdmin.createEvent') }}</v-btn>
        </div>
        <v-card elevation="2">
          <v-data-table :headers="eventHeaders" :items="events" :loading="loading" :no-data-text="t('common.noData')">
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.slots="{ item }">
              {{ item._count?.entries || 0 }} / {{ item.maxSlots || '∞' }}
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-delete" color="error" variant="text" @click="deleteEvent(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- QUOTA SETTINGS -->
      <v-window-item value="quota">
        <v-card max-width="500" class="mx-auto pa-6 elevation-2">
          <h3 class="text-h5 mb-4 text-center">{{ t('hoursAdmin.quotaTitle') }}</h3>
          <v-form @submit.prevent="saveQuota">
            <v-text-field v-model.number="quotaForm.year" :label="t('hoursAdmin.year')" type="number" required></v-text-field>
            <v-text-field v-model.number="quotaForm.requiredHours" :label="t('hoursAdmin.quotaHours')" type="number" suffix="h" required></v-text-field>
            <v-textarea v-model="quotaForm.description" :label="t('hoursAdmin.quotaDesc')"></v-textarea>
            <v-btn color="primary" block size="large" type="submit" :loading="savingQuota">{{ t('common.save') }}</v-btn>
          </v-form>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- EVENT DIALOG -->
    <v-dialog v-model="showEventDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">{{ t('hoursAdmin.newEvent') }}</v-card-title>
        <v-card-text class="pt-4">
          <v-form v-model="validEvent">
            <v-text-field v-model="eventForm.title" :label="t('articles.sort')" required></v-text-field> <!-- Articles.sort is used but better use a title key -->
            <v-row>
              <v-col cols="6"><v-text-field v-model="eventForm.date" :label="t('hours.date')" type="date" required></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model.number="eventForm.hoursValue" :label="t('hoursAdmin.value')" type="number" required></v-text-field></v-col>
            </v-row>
            <v-text-field v-model="eventForm.location" :label="t('hoursAdmin.location')"></v-text-field>
            <v-text-field v-model.number="eventForm.maxSlots" :label="t('hoursAdmin.maxSlots')" type="number"></v-text-field>
            <v-textarea v-model="eventForm.description" :label="t('hours.description')"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEventDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!validEvent" @click="saveEvent">{{ t('common.new') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from '../../composables/useConfirm'
import { hoursApi, type HoursEntry, type HoursEvent, type HoursQuota } from '../../api/hours'

const { t, locale } = useI18n()
const { confirm } = useConfirm()

const tab = ref('pending')
const loading = ref(false)
const pendingEntries = ref<HoursEntry[]>([])
const events = ref<HoursEvent[]>([])
const savingQuota = ref(false)
const summaryData = ref<any[]>([])
const summaryFilter = ref('ALL')

const quotaForm = ref<Partial<HoursQuota>>({
  year: new Date().getFullYear(),
  requiredHours: 10,
  description: ''
})

const showEventDialog = ref(false)
const validEvent = ref(false)
const eventForm = ref<any>({
  title: '',
  date: new Date().toISOString().substr(0, 10),
  hoursValue: 1,
  location: '',
  maxSlots: null,
  description: ''
})

const pendingHeaders = computed(() => [
  { title: t('inbox.member'), key: 'member' },
  { title: t('hours.date'), key: 'date' },
  { title: t('hours.description'), key: 'description' },
  { title: t('hours.hours'), key: 'hours' },
  { title: t('common.actions'), key: 'actions', align: 'end' as const, sortable: false }
])

const eventHeaders = computed(() => [
  { title: t('common.status'), key: 'title' }, // Title key was articles.sort before, let's use common.status for now as headers or titles
  { title: t('hours.date'), key: 'date' },
  { title: t('hoursAdmin.location'), key: 'location' },
  { title: t('hoursAdmin.value'), key: 'hoursValue' },
  { title: t('hoursAdmin.slots'), key: 'slots' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false }
])

const summaryHeaders = computed(() => [
  { title: t('inbox.member'), key: 'member' },
  { title: t('hoursAdmin.confirmed'), key: 'confirmedHours' },
  { title: t('hoursAdmin.totalWithPlanned'), key: 'totalHours' },
  { title: t('hoursAdmin.progress'), key: 'progress', sortable: false },
  { title: t('common.status'), key: 'status', align: 'end' as const }
])

const filteredSummary = computed(() => {
  if (summaryFilter.value === 'ALL') return summaryData.value
  return summaryData.value.filter(s => !s.isFulfilled)
})

async function load() {
  loading.value = true
  try {
    const [pend, evs, qData, summ] = await Promise.all([
      hoursApi.getPendingEntries(),
      hoursApi.getEvents(),
      hoursApi.getQuota(quotaForm.value.year!),
      hoursApi.getSummary(quotaForm.value.year!)
    ])
    pendingEntries.value = pend
    events.value = evs
    summaryData.value = summ
    if (qData) {
      quotaForm.value = { ...qData }
    }
  } catch (e) {
    console.error('Failed to load management data', e)
  }
  loading.value = false
}

async function updateStatus(id: string, status: string) {
  try {
    await hoursApi.updateStatus(id, status)
    await load()
  } catch (e) {
    alert(t('hoursAdmin.updateError'))
  }
}

async function saveQuota() {
  savingQuota.value = true
  try {
    await hoursApi.setQuota(quotaForm.value)
    alert(t('hoursAdmin.quotaSaved'))
  } catch (e) {
    alert(t('hoursAdmin.saveError'))
  }
  savingQuota.value = false
}

async function saveEvent() {
  try {
    await hoursApi.createEvent(eventForm.value)
    showEventDialog.value = false
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || t('hoursAdmin.createError'))
  }
}

async function deleteEvent(id: string) {
  if (!await confirm(t('common.confirm'), t('hoursAdmin.deleteEventConfirm'))) return
  try {
    await hoursApi.deleteEvent(id)
    await load()
  } catch (e) {
    alert(t('hoursAdmin.deleteError'))
  }
}

onMounted(() => load())
</script>
