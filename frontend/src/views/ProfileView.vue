<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-account-circle</v-icon>
      <h1 class="text-h3 font-weight-bold">Mein Profil</h1>
    </div>
    
    <v-row>
      <!-- Left Column: Profile Details & Password -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white">Mein Profil</v-card-title>
          <v-card-text class="pt-4" v-if="member">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Mitgliedsnummer</v-list-item-title>
                <v-list-item-subtitle>{{ member.memberNumber }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Name</v-list-item-title>
                <v-list-item-subtitle>{{ member.firstName }} {{ member.lastName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>E-Mail</v-list-item-title>
                <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Telefon</v-list-item-title>
                <v-list-item-subtitle>{{ member.phone || '-' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Adresse</v-list-item-title>
                <v-list-item-subtitle>{{ member.street || '-' }}, {{ member.postalCode || '' }} {{ member.city || '' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Status</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip :color="member.status === 'ACTIVE' ? 'success' : 'grey'" size="small">{{ member.status }}</v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Benutzername</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold text-primary">{{ member.user?.username }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="bg-surface-variant">Passwort ändern</v-card-title>
          <v-card-text class="pt-4">
            <v-alert v-if="pwMsg" :type="pwSuccess ? 'success' : 'error'" class="mb-4" density="compact">{{ pwMsg }}</v-alert>
            <v-text-field v-model="pwForm.oldPassword" type="password" label="Altes Passwort" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="pwForm.newPassword" type="password" label="Neues Passwort" variant="outlined" density="compact"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="changePassword" :loading="pwLoading">Passwort speichern</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Right Column: Requests & Feedback -->
      <v-col cols="12" md="8">
        <!-- Change Requests -->
        <v-card class="mb-4">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center px-4">
            <span>Meine Änderungsanträge</span>
            <v-btn size="small" color="accent" variant="flat" @click="changeDialog = true" prepend-icon="mdi-pencil">Beantragen</v-btn>
          </v-card-title>
          <v-data-table :headers="requestHeaders" :items="changeRequests" density="compact" class="elevation-0">
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" size="x-small">{{ item.status }}</v-chip>
            </template>
            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleDateString('de-DE') }}
            </template>
          </v-data-table>
        </v-card>

        <!-- Feedback & Queries -->
        <v-card>
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center px-4">
            <span>Feedback & Anfragen</span>
            <v-btn size="small" color="primary" variant="flat" @click="feedbackDialog = true" prepend-icon="mdi-message-plus">Neue Nachricht</v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-expansion-panels v-if="feedbacks.length > 0" variant="accordion" class="border">
              <v-expansion-panel v-for="fb in feedbacks" :key="fb.id" elevation="0">
                <v-expansion-panel-title class="py-2">
                  <div class="d-flex align-center w-100 pr-2">
                    <v-icon size="small" :color="getCategoryColor(fb.category)" class="mr-2">{{ getCategoryIcon(fb.category) }}</v-icon>
                    <div class="text-truncate mr-2" style="max-width: 200px">{{ fb.subject }}</div>
                    <v-spacer></v-spacer>
                    <v-chip :color="getStatusColor(fb.status)" size="x-small" variant="flat" class="ml-2">{{ getStatusText(fb.status) }}</v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="text-caption text-grey mb-2">{{ new Date(fb.createdAt).toLocaleString('de-DE') }}</div>
                  <div class="bg-grey-lighten-4 pa-3 rounded mb-3 text-body-2">{{ fb.message }}</div>
                  
                  <!-- Replies -->
                  <div v-if="fb.replies && fb.replies.length > 0">
                    <div class="text-caption font-weight-bold mb-1">Antworten:</div>
                    <div v-for="reply in fb.replies.filter((r: any) => !r.isInternal)" :key="reply.id" 
                         class="mb-2 pa-2 rounded bg-blue-lighten-5 border-s-lg" style="border-left-width: 4px; border-left-color: #2196F3">
                      <div class="d-flex justify-space-between text-caption mb-1">
                        <span class="font-weight-bold">Verein</span>
                        <span>{{ new Date(reply.createdAt).toLocaleDateString('de-DE') }}</span>
                      </div>
                      <div class="text-caption">{{ reply.message }}</div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <div v-else class="text-center py-8 text-grey">
              Keine Anfragen vorhanden.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Change Request Dialog -->
    <v-dialog v-model="changeDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">Datenänderung beantragen</v-card-title>
        <v-card-text class="pt-6">
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            Deine Änderung wird an den Vorstand gesendet und muss genehmigt werden.
          </v-alert>
          <v-select v-model="changeForm.field" :items="editableFields" label="Welches Feld?" variant="outlined" density="compact"></v-select>
          <v-text-field v-model="changeForm.oldValue" label="Aktueller Wert" variant="outlined" density="compact" readonly></v-text-field>
          <v-text-field v-model="changeForm.newValue" label="Neuer Wert" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="changeForm.reason" label="Begründung (optional)" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="changeDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="submitChangeRequest" :loading="submitting">Absenden</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Feedback Dialog -->
    <v-dialog v-model="feedbackDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">Neue Anfrage / Feedback</v-card-title>
        <v-card-text class="pt-6">
          <v-select
            v-model="feedbackForm.category"
            :items="[
              { title: 'Frage', value: 'QUESTION' },
              { title: 'Feedback', value: 'FEEDBACK' },
              { title: 'Beschwerde', value: 'COMPLAINT' },
              { title: 'Sonstiges', value: 'OTHER' }
            ]"
            label="Kategorie"
            variant="outlined"
            density="compact"
          ></v-select>
          <v-text-field v-model="feedbackForm.subject" label="Betreff" variant="outlined" density="compact"></v-text-field>
          <v-textarea v-model="feedbackForm.message" label="Deine Nachricht" variant="outlined" rows="4" density="compact"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="feedbackDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="submitFeedback" :loading="sendingFeedback">Absenden</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Developer Settings (only in DEV) -->
    <v-card v-if="isDev" class="mt-8 border-warning" variant="outlined">
      <v-card-title class="bg-warning-lighten-4 text-warning-darken-4">
        <v-icon start>mdi-xml</v-icon> Developer Settings
      </v-card-title>
      <v-card-text class="pt-4">
        <v-switch
          v-model="rfidEmulatorEnabled"
          label="RFID Emulator anzeigen"
          color="warning"
          hide-details
          @change="toggleRfidEmulator"
        ></v-switch>
        <div class="text-caption text-grey mt-1">
          Aktiviert/Deaktiviert das RFID-Emulations-Overlay auf allen Seiten.
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '../api/axios'

const member = ref<any>(null)
const changeRequests = ref<any[]>([])
const feedbacks = ref<any[]>([])

const requestHeaders: any = [
  { title: 'Feld', key: 'field' },
  { title: 'Wert (Neu)', key: 'newValue' },
  { title: 'Status', key: 'status' },
  { title: 'Datum', key: 'createdAt' },
]

const editableFields = [
  { title: 'E-Mail', value: 'email' },
  { title: 'Telefon', value: 'phone' },
  { title: 'Straße', value: 'street' },
  { title: 'PLZ', value: 'postalCode' },
  { title: 'Ort', value: 'city' },
]

const changeDialog = ref(false)
const changeForm = ref({ field: '', oldValue: '', newValue: '', reason: '' })
const submitting = ref(false)

const feedbackDialog = ref(false)
const sendingFeedback = ref(false)
const feedbackForm = ref({ category: 'FEEDBACK', subject: '', message: '' })

// Dev logic
const isDev = import.meta.env.DEV
const rfidEmulatorEnabled = ref(localStorage.getItem('dev-rfid-enabled') !== 'false')

function toggleRfidEmulator() {
  localStorage.setItem('dev-rfid-enabled', rfidEmulatorEnabled.value ? 'true' : 'false')
  window.dispatchEvent(new Event('storage'))
}

watch(() => changeForm.value.field, (field) => {
  if (member.value && field) {
    changeForm.value.oldValue = member.value[field] || ''
  }
})

async function loadProfile() {
  try {
    const acc = await api.get('/cash-register/accounts/me').then(r => r.data)
    member.value = acc?.member || null
  } catch (e) { console.error(e) }
  
  try {
    const [cr, fb] = await Promise.all([
      api.get('/members/me/change-requests').then(r => r.data),
      api.get('/members/feedback/me').then(r => r.data)
    ])
    changeRequests.value = cr
    feedbacks.value = fb
  } catch (e) { console.error(e) }
}

async function submitChangeRequest() {
  submitting.value = true
  try {
    await api.post('/members/me/change-requests', changeForm.value)
    changeDialog.value = false
    changeForm.value = { field: '', oldValue: '', newValue: '', reason: '' }
    await loadProfile()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler beim Absenden.')
  }
  submitting.value = false
}

async function submitFeedback() {
  if (!feedbackForm.value.subject || !feedbackForm.value.message) return
  sendingFeedback.value = true
  try {
    await api.post('/members/feedback', feedbackForm.value)
    feedbackDialog.value = false
    feedbackForm.value = { category: 'FEEDBACK', subject: '', message: '' }
    await loadProfile()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Feedback konnte nicht gesendet werden.')
  }
  sendingFeedback.value = false
}

// Password logic
const pwForm = ref({ oldPassword: '', newPassword: '' })
const pwLoading = ref(false)
const pwMsg = ref('')
const pwSuccess = ref(false)

async function changePassword() {
  pwLoading.value = true
  pwMsg.value = ''
  try {
    await api.patch('/users/me/password', pwForm.value)
    pwMsg.value = 'Passwort erfolgreich geändert!'
    pwSuccess.value = true
    pwForm.value = { oldPassword: '', newPassword: '' }
  } catch (e: any) {
    pwMsg.value = e.response?.data?.message || 'Fehler beim Ändern.'
    pwSuccess.value = false
  }
  pwLoading.value = false
}

// Visual helpers
function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return 'warning'
    case 'ANSWERED': return 'info'
    case 'CLOSED': return 'success'
    default: return 'grey'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'OPEN': return 'Offen'
    case 'ANSWERED': return 'Beantwortet'
    case 'CLOSED': return 'Erledigt'
    default: return status
  }
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'QUESTION': return 'info'
    case 'FEEDBACK': return 'success'
    case 'COMPLAINT': return 'error'
    default: return 'primary'
  }
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'QUESTION': return 'mdi-help-box'
    case 'FEEDBACK': return 'mdi-message-bulleted'
    case 'COMPLAINT': return 'mdi-alert-octagon'
    default: return 'mdi-message-text'
  }
}

onMounted(() => loadProfile())
</script>
