<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-calendar-check</v-icon>
      <h1 class="text-h3 font-weight-bold">Events & Arbeitsdienste</h1>
    </div>

    <v-tabs v-model="tab" color="primary">
      <v-tab value="pending">Offene Bestätigungen</v-tab>
      <v-tab value="summary">Mitglieder-Übersicht</v-tab>
      <v-tab value="events">Events pflegen</v-tab>
      <v-tab value="quota">Jahres-Kontingent</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-6">
      <v-window-item value="pending">
        <v-card elevation="2">
          <v-data-table :headers="pendingHeaders" :items="pendingEntries" :loading="loading">
            <template #item.member="{ item }">
              {{ item.member?.firstName }} {{ item.member?.lastName }} ({{ item.member?.memberNumber }})
            </template>
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleDateString('de-DE') }}
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
            Keine ausstehenden Bestätigungen
          </div>
        </v-card>
      </v-window-item>

      <!-- SUMMARY OVERVIEW -->
      <v-window-item value="summary">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center flex-wrap">
            <span class="mr-4">Stunden-Status aller Mitglieder</span>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="summaryFilter" mandatory density="compact" color="primary">
              <v-btn value="ALL">Alle</v-btn>
              <v-btn value="OPEN">Offen</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-data-table :headers="summaryHeaders" :items="filteredSummary" :loading="loading" class="pb-4">
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
                {{ item.isFulfilled ? 'Erfüllt' : 'Offen' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- EVENTS MANAGEMENT -->
      <v-window-item value="events">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showEventDialog = true">Event erstellen</v-btn>
        </div>
        <v-card elevation="2">
          <v-data-table :headers="eventHeaders" :items="events" :loading="loading">
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleDateString('de-DE') }}
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
          <h3 class="text-h5 mb-4 text-center">Jahres-Vorgabe festlegen</h3>
          <v-form @submit.prevent="saveQuota">
            <v-text-field v-model.number="quotaForm.year" label="Jahr" type="number" required></v-text-field>
            <v-text-field v-model.number="quotaForm.requiredHours" label="Stunden-Soll" type="number" suffix="h" required></v-text-field>
            <v-textarea v-model="quotaForm.description" label="Beschreibung / Details zum Jahr"></v-textarea>
            <v-btn color="primary" block size="large" type="submit" :loading="savingQuota">Speichern</v-btn>
          </v-form>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- EVENT DIALOG -->
    <v-dialog v-model="showEventDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">Neuen Arbeitseinsatz erstellen</v-card-title>
        <v-card-text class="pt-4">
          <v-form v-model="validEvent">
            <v-text-field v-model="eventForm.title" label="Titel" required></v-text-field>
            <v-row>
              <v-col cols="6"><v-text-field v-model="eventForm.date" label="Datum" type="date" required></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model.number="eventForm.hoursValue" label="Stunden-Wert" type="number" required></v-text-field></v-col>
            </v-row>
            <v-text-field v-model="eventForm.location" label="Ort"></v-text-field>
            <v-text-field v-model.number="eventForm.maxSlots" label="Max. Teilnehmer (optional)" type="number"></v-text-field>
            <v-textarea v-model="eventForm.description" label="Beschreibung"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEventDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!validEvent" @click="saveEvent">Erstellen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { hoursApi, type HoursEntry, type HoursEvent, type HoursQuota } from '../../api/hours'

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

const pendingHeaders: any = [
  { title: 'Mitglied', key: 'member' },
  { title: 'Datum', key: 'date' },
  { title: 'Beschreibung', key: 'description' },
  { title: 'Stunden', key: 'hours' },
  { title: 'Aktionen', key: 'actions', align: 'end', sortable: false }
]

const eventHeaders: any = [
  { title: 'Titel', key: 'title' },
  { title: 'Datum', key: 'date' },
  { title: 'Ort', key: 'location' },
  { title: 'Wert', key: 'hoursValue' },
  { title: 'Plätze', key: 'slots' },
  { title: '', key: 'actions', align: 'end', sortable: false }
]

const summaryHeaders: any = [
  { title: 'Mitglied', key: 'member' },
  { title: 'Bestätigt', key: 'confirmedHours' },
  { title: 'Gesamt (inkl. geplant)', key: 'totalHours' },
  { title: 'Fortschritt', key: 'progress', sortable: false },
  { title: 'Status', key: 'status', align: 'end' }
]

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
    alert('Status-Update fehlgeschlagen')
  }
}

async function saveQuota() {
  savingQuota.value = true
  try {
    await hoursApi.setQuota(quotaForm.value)
    alert('Jahres-Kontingent gespeichert')
  } catch (e) {
    alert('Fehler beim Speichern')
  }
  savingQuota.value = false
}

async function saveEvent() {
  try {
    await hoursApi.createEvent(eventForm.value)
    showEventDialog.value = false
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler beim Erstellen')
  }
}

async function deleteEvent(id: string) {
  if (!confirm('Dieses Event löschen?')) return
  try {
    await hoursApi.deleteEvent(id)
    await load()
  } catch (e) {
    alert('Fehler beim Löschen')
  }
}

onMounted(() => load())
</script>
