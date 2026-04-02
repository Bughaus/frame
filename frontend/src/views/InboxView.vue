<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-inbox-multiple-outline</v-icon>
      <div>
        <h1 class="text-h3 font-weight-bold">{{ t('inbox.title') }}</h1>
        <p class="text-medium-emphasis">{{ t('inbox.subtitle') }}</p>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="changes">
        <v-badge :content="pendingChangesCount" :model-value="!!pendingChangesCount" color="error" overlap>
          <v-icon start>mdi-account-edit</v-icon>
        </v-badge>
        <span class="ml-2">{{ t('inbox.dataChanges') }}</span>
      </v-tab>
      <v-tab value="feedback">
        <v-badge :content="openFeedbackCount" :model-value="!!openFeedbackCount" color="error" overlap>
          <v-icon start>mdi-message-text</v-icon>
        </v-badge>
        <span class="ml-2">{{ t('inbox.memberFeedback') }}</span>
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="changes">
        <v-card elevation="2">
          <v-data-table :headers="changeHeaders" :items="requests" :loading="loading" class="bg-surface" :no-data-text="t('common.noData')">
            <template #item.member="{ item }">
              <span class="font-weight-bold">{{ item.member?.firstName }} {{ item.member?.lastName }}</span>
              <div class="text-caption text-grey">Nr. {{ item.member?.memberNumber }}</div>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" size="small" variant="flat">
                {{ item.status }}
              </v-chip>
            </template>
            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.actions="{ item }">
              <v-btn v-if="item.status === 'PENDING'" icon="mdi-check" size="small" color="success" variant="text" :title="t('common.approve')" @click.stop.prevent="confirmChange(item, 'APPROVED')"></v-btn>
              <v-btn v-if="item.status === 'PENDING'" icon="mdi-close" size="small" color="error" variant="text" :title="t('common.reject')" @click.stop.prevent="confirmChange(item, 'REJECTED')"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="feedback">
        <v-card elevation="2">
          <v-data-table :headers="feedbackHeaders" :items="feedbacks" :loading="loading" class="bg-surface" :no-data-text="t('common.noData')">
            <template #item.member="{ item }">
              <span class="font-weight-bold">{{ item.member?.firstName }} {{ item.member?.lastName }}</span>
            </template>
            <template #item.category="{ item }">
              <v-chip size="x-small" variant="tonal">{{ item.category }}</v-chip>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="getFeedbackStatusColor(item.status)" size="small" variant="flat">
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>
            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-comment-eye-outline" size="small" color="primary" variant="text" @click="viewFeedback(item)"></v-btn>
              <v-btn v-if="item.status !== 'CLOSED'" icon="mdi-check-circle-outline" size="small" color="success" variant="text" @click="closeFeedback(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Feedback Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700px">
      <v-card v-if="selectedFeedback">
        <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
          {{ t('inbox.details') }}
          <v-chip size="small" color="white" variant="outlined">{{ selectedFeedback.category }}</v-chip>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-row>
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey font-weight-bold mb-1">{{ t('inbox.sender') }}</div>
              <div class="text-body-1 font-weight-bold">{{ selectedFeedback.member?.firstName }} {{ selectedFeedback.member?.lastName }}</div>
              <div class="text-caption text-grey">Nr. {{ selectedFeedback.member?.memberNumber }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey font-weight-bold mb-1">{{ t('inbox.date') }}</div>
              <div class="text-body-1">{{ new Date(selectedFeedback.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey font-weight-bold mb-1">{{ t('inbox.subject') }}</div>
              <div class="text-h6">{{ selectedFeedback.subject }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          
          <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6 border">
            <div class="text-body-1">{{ selectedFeedback.message }}</div>
          </div>

          <!-- Replies Timeline -->
          <div v-if="selectedFeedback.replies && selectedFeedback.replies.length > 0" class="mb-6">
            <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon start size="small">mdi-forum-outline</v-icon>
              {{ t('inbox.history') }}
            </div>
            <div v-for="reply in selectedFeedback.replies" :key="reply.id" 
                 class="mb-3 pa-3 rounded-lg border-s-xl"
                 :class="reply.isInternal ? 'bg-amber-lighten-5 border-amber' : 'bg-blue-lighten-5 border-blue'"
            >
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="font-weight-bold" :class="reply.isInternal ? 'text-amber-darken-3' : 'text-blue-darken-3'">
                  {{ reply.authorId }} 
                  <v-chip v-if="reply.isInternal" size="x-small" color="amber-darken-3" class="ml-1" variant="flat">{{ t('inbox.internal') }}</v-chip>
                </span>
                <span class="text-caption text-grey">{{ new Date(reply.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}</span>
              </div>
              <div class="text-body-2">{{ reply.message }}</div>
            </div>
          </div>

          <!-- Quick Reply Form -->
          <div v-if="selectedFeedback.status !== 'CLOSED'">
            <v-divider class="mb-4"></v-divider>
            <div class="text-subtitle-2 mb-2 font-weight-bold">{{ t('inbox.replies') }}</div>
            <v-textarea
              v-model="replyMessage"
              :placeholder="t('inbox.replyPlaceholder')"
              variant="outlined"
              density="compact"
              rows="3"
            ></v-textarea>
            <div class="d-flex align-center justify-space-between">
              <v-checkbox
                v-model="isInternalReply"
                :label="t('inbox.internalHint')"
                density="compact"
                hide-details
                color="amber-darken-3"
              ></v-checkbox>
              <v-btn color="primary" variant="flat" :loading="sendingReply" :disabled="!replyMessage" @click="submitReply">
                {{ t('profile.submit') }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="detailsDialog = false">{{ t('inbox.close') }}</v-btn>
          <v-btn v-if="selectedFeedback.status !== 'CLOSED'" color="success" variant="tonal" @click="closeFeedback(selectedFeedback.id)">{{ t('inbox.doneAndClose') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="450px" persistent>
      <v-card>
        <v-card-title class="bg-surface-variant pt-4 pb-3">{{ t('inbox.confirmRequired') }}</v-card-title>
        <v-card-text class="pt-6 pb-4">
          <div class="d-flex align-center mb-4">
            <v-icon :color="confirmColor" size="32" class="mr-3">{{ confirmIcon }}</v-icon>
            <div class="text-body-1">{{ confirmMessage }}</div>
          </div>
          <div v-if="pendingChange" class="bg-grey-lighten-4 pa-3 rounded text-caption border">
            <div><strong>{{ t('inbox.field') }}</strong> {{ pendingChange.field }}</div>
            <div><strong>{{ t('inbox.new') }}:</strong> {{ pendingChange.newValue }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn :color="confirmColor" variant="flat" :loading="processingAction" @click="executeConfirm">
            {{ t('inbox.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/axios'

const { t, locale } = useI18n()

const tab = ref('changes')
const loading = ref(false)
const requests = ref<any[]>([])
const feedbacks = ref<any[]>([])
const detailsDialog = ref(false)
const selectedFeedback = ref<any>(null)

// Reply Form
const replyMessage = ref('')
const isInternalReply = ref(false)
const sendingReply = ref(false)

const pendingChangesCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length)
const openFeedbackCount = computed(() => feedbacks.value.filter(f => f.status === 'OPEN').length)

// Confirmation Dialog State
const confirmDialog = ref(false)
const confirmMessage = ref('')
const confirmColor = ref('primary')
const confirmIcon = ref('mdi-help-circle')
const pendingChange = ref<any>(null)
const pendingStatus = ref<'APPROVED' | 'REJECTED' | null>(null)
const processingAction = ref(false)

const changeHeaders = computed(() => [
  { title: t('inbox.member'), key: 'member' },
  { title: t('profile.field'), key: 'field' },
  { title: t('inbox.old'), key: 'oldValue' },
  { title: t('inbox.new'), key: 'newValue' },
  { title: t('common.status'), key: 'status' },
  { title: t('hours.date'), key: 'createdAt' },
  { title: t('finance.action'), key: 'actions', sortable: false, align: 'end' as const },
])

const feedbackHeaders = computed(() => [
  { title: t('hours.date'), key: 'createdAt' },
  { title: t('inbox.member'), key: 'member' },
  { title: t('inbox.category'), key: 'category' },
  { title: t('inbox.subject'), key: 'subject' },
  { title: t('common.status'), key: 'status' },
  { title: t('finance.action'), key: 'actions', align: 'end' as const },
])

async function load() {
  loading.value = true
  try {
    const [changes, fb] = await Promise.all([
      api.get('/members/change-requests').then(r => r.data),
      api.get('/members/feedback').then(r => r.data)
    ])
    requests.value = Array.isArray(changes) ? changes : []
    feedbacks.value = Array.isArray(fb) ? fb : []
    
    // Refresh selected feedback if open
    if (selectedFeedback.value) {
      const refreshed = feedbacks.value.find(f => f.id === selectedFeedback.value.id);
      if (refreshed) selectedFeedback.value = refreshed;
    }
  } catch (e) {
    console.error('Failed to load inbox data', e)
    requests.value = []
    feedbacks.value = []
  }
  loading.value = false
}

function confirmChange(item: any, status: 'APPROVED' | 'REJECTED') {
  pendingChange.value = item
  pendingStatus.value = status
  confirmColor.value = status === 'APPROVED' ? 'success' : 'error'
  confirmIcon.value = status === 'APPROVED' ? 'mdi-check-circle' : 'mdi-close-circle'
  confirmMessage.value = status === 'APPROVED' 
    ? t('inbox.approveConfirm', { name: item.member?.firstName })
    : t('inbox.rejectConfirm', { name: item.member?.firstName })
  confirmDialog.value = true
}

async function executeConfirm() {
  if (!pendingChange.value || !pendingStatus.value) return
  processingAction.value = true
  try {
    await api.patch(`/members/change-requests/${pendingChange.value.id}`, { status: pendingStatus.value })
    confirmDialog.value = false
    await load()
    window.dispatchEvent(new CustomEvent('app:refresh-status'))
  } catch (e: any) {
    alert(e.response?.data?.message || t('inbox.processError'))
  }
  processingAction.value = false
}

async function submitReply() {
  if (!selectedFeedback.value || !replyMessage.value) return
  sendingReply.value = true
  try {
    await api.post(`/members/feedback/${selectedFeedback.value.id}/reply`, {
      message: replyMessage.value,
      isInternal: isInternalReply.value
    })
    replyMessage.value = ''
    isInternalReply.value = false
    await load()
    window.dispatchEvent(new CustomEvent('app:refresh-status'))
  } catch (e) {
    alert(t('inbox.replyError'))
  }
  sendingReply.value = false
}

function getFeedbackStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return 'warning'
    case 'CLOSED': return 'success'
    case 'ANSWERED': return 'info'
    default: return 'grey'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'OPEN': return t('common.open')
    case 'CLOSED': return t('common.closed')
    case 'ANSWERED': return t('members.answered')
    default: return status
  }
}

function viewFeedback(fb: any) {
  selectedFeedback.value = fb
  replyMessage.value = ''
  isInternalReply.value = false
  detailsDialog.value = true
}

async function closeFeedback(id: string) {
  try {
    await api.patch(`/members/feedback/${id}/status`, { status: 'CLOSED' })
    detailsDialog.value = false
    await load()
    window.dispatchEvent(new CustomEvent('app:refresh-status'))
  } catch (e: any) {
    alert(t('inbox.updateError'))
  }
}

onMounted(() => load())
</script>
