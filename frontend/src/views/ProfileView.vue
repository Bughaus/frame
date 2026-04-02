<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-account-circle</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('profile.title') }}</h1>
    </div>
    
    <v-row>
      <!-- Left Column: Profile Details & Password -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white">{{ t('profile.title') }}</v-card-title>
          <v-card-text class="pt-4" v-if="member">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>{{ t('profile.memberNumber') }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.memberNumber }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.name') }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.firstName }} {{ member.lastName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.email') }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.phone') }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.phone || '-' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.address') }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.street || '-' }}, {{ member.postalCode || '' }} {{ member.city || '' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.status') }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip :color="member.status === 'ACTIVE' ? 'success' : 'grey'" size="small">{{ member.status === 'ACTIVE' ? t('members.active') : t('members.inactive') }}</v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('profile.username') }}</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold text-primary">{{ member.user?.username }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="bg-surface-variant">{{ t('profile.changePassword') }}</v-card-title>
          <v-card-text class="pt-4">
            <v-alert v-if="pwMsg" :type="pwSuccess ? 'success' : 'error'" class="mb-4" density="compact">{{ pwMsg }}</v-alert>
            <v-text-field v-model="pwForm.oldPassword" type="password" :label="t('profile.oldPassword')" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="pwForm.newPassword" type="password" :label="t('profile.newPassword')" variant="outlined" density="compact"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="changePassword" :loading="pwLoading">{{ t('profile.savePassword') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Right Column: Requests & Feedback -->
      <v-col cols="12" md="8">
      <!-- Change Requests -->
      <v-card class="mb-4">
        <v-card-title class="bg-surface-variant d-flex justify-space-between align-center px-4">
          <span>{{ t('profile.myRequests') }}</span>
          <v-btn size="small" color="accent" variant="flat" @click="changeDialog = true" prepend-icon="mdi-pencil">{{ t('profile.request') }}</v-btn>
        </v-card-title>
          <v-data-table :headers="requestHeaders" :items="changeRequests" density="compact" class="bg-surface" :no-data-text="t('common.noData')">
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" size="x-small">{{ item.status }}</v-chip>
            </template>
            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
          </v-data-table>
        </v-card>

        <!-- Feedback & Queries -->
        <v-card>
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center px-4">
            <span>{{ t('profile.feedback') }}</span>
            <v-btn size="small" color="primary" variant="flat" @click="feedbackDialog = true" prepend-icon="mdi-message-plus">{{ t('profile.newMessage') }}</v-btn>
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
                  <div class="text-caption text-grey mb-2">{{ new Date(fb.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}</div>
                  <div class="bg-grey-lighten-4 pa-3 rounded mb-3 text-body-2">{{ fb.message }}</div>
                  
                  <!-- Replies -->
                  <div v-if="fb.replies && fb.replies.length > 0">
                    <div class="text-caption font-weight-bold mb-1">{{ t('profile.replies') }}</div>
                    <div v-for="reply in fb.replies.filter((r: any) => !r.isInternal)" :key="reply.id" 
                         class="mb-2 pa-2 rounded bg-blue-lighten-5 border-s-lg" style="border-left-width: 4px; border-left-color: #2196F3">
                      <div class="d-flex justify-space-between text-caption mb-1">
                        <span class="font-weight-bold">{{ t('profile.club') }}</span>
                        <span>{{ new Date(reply.createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}</span>
                      </div>
                      <div class="text-caption">{{ reply.message }}</div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <div v-else class="text-center py-8 text-grey">
              {{ t('profile.noRequests') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Change Request Dialog -->
    <v-dialog v-model="changeDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">{{ t('profile.requestChange') }}</v-card-title>
        <v-card-text class="pt-6">
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            {{ t('profile.requestHint') }}
          </v-alert>
          <v-select v-model="changeForm.field" :items="editableFields" :label="t('profile.whichField')" variant="outlined" density="compact"></v-select>
          <v-text-field v-model="changeForm.oldValue" :label="t('profile.currentValue')" variant="outlined" density="compact" readonly></v-text-field>
          <v-text-field v-model="changeForm.newValue" :label="t('profile.newValue')" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="changeForm.reason" :label="t('profile.reason')" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="changeDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" @click="submitChangeRequest" :loading="submitting">{{ t('profile.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Feedback Dialog -->
    <v-dialog v-model="feedbackDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">{{ t('profile.newFeedbackTitle') }}</v-card-title>
        <v-card-text class="pt-6">
          <v-select
            v-model="feedbackForm.category"
            :items="[
              { title: t('profile.question'), value: 'QUESTION' },
              { title: t('profile.feedback'), value: 'FEEDBACK' },
              { title: t('profile.complaint'), value: 'COMPLAINT' },
              { title: t('profile.other'), value: 'OTHER' }
            ]"
            :label="t('profile.category')"
            variant="outlined"
            density="compact"
          ></v-select>
          <v-text-field v-model="feedbackForm.subject" :label="t('profile.subject')" variant="outlined" density="compact"></v-text-field>
          <v-textarea v-model="feedbackForm.message" :label="t('profile.message')" variant="outlined" rows="4" density="compact"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="feedbackDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" @click="submitFeedback" :loading="sendingFeedback">{{ t('profile.submit') }}</v-btn>
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
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/axios'

const { t, locale } = useI18n()

const member = ref<any>(null)
const changeRequests = ref<any[]>([])
const feedbacks = ref<any[]>([])

const requestHeaders = computed(() => [
  { title: t('profile.field'), key: 'field' },
  { title: t('profile.newValue'), key: 'newValue' },
  { title: t('common.status'), key: 'status' },
  { title: t('profile.date'), key: 'createdAt' },
])

const editableFields = computed(() => [
  { title: t('profile.email'), value: 'email' },
  { title: t('profile.phone'), value: 'phone' },
  { title: t('members.street'), value: 'street' },
  { title: t('members.postalCode'), value: 'postalCode' },
  { title: t('members.city'), value: 'city' },
])

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
    alert(e.response?.data?.message || t('profile.feedbackError'))
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
    alert(e.response?.data?.message || t('profile.feedbackError'))
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
    pwMsg.value = t('profile.pwSuccess')
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
    case 'OPEN': return t('common.open')
    case 'ANSWERED': return t('members.answered')
    case 'CLOSED': return t('common.closed')
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
