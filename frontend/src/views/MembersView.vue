<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-account-group</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('members.title') }}</h1>
      <v-spacer></v-spacer>
      <div>
        <v-btn v-if="configStore.isRfidEnabled && deviceStore.isAuthorized" color="secondary" variant="tonal" prepend-icon="mdi-contactless-payment" class="mr-2" @click="openIdentifyDialog">{{ t('members.identify') }}</v-btn>
        <v-btn color="secondary" variant="tonal" prepend-icon="mdi-download" class="mr-2" @click="exportCsv">{{ t('members.exportCsv') }}</v-btn>
        <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openDialog()">{{ t('members.newMember') }}</v-btn>
      </div>
    </div>

    <v-row>
      <v-col>
        <v-card>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :label="t('common.search')"
            single-line
            hide-details
            class="pa-4"
          ></v-text-field>
          <v-data-table
            :headers="headers"
            :items="members"
            :search="search"
            :loading="loading"
            item-value="id"
            hover
            class="bg-transparent"
            :no-data-text="t('common.noData')"
          >
            <template #item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
            <template #item.roles="{ item }">
              <div class="d-flex flex-wrap gap-1">
                <v-chip 
                  v-for="role in (item.user?.roles || [])" 
                  :key="role" 
                  size="x-small" 
                  :color="role === 'VORSTAND' ? 'primary' : role === 'MITARBEITER' ? 'warning' : 'grey'"
                  class="mr-1 mb-1"
                >
                  {{ role }}
                </v-chip>
              </div>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deactivateMember(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="900px">
      <v-card>
        <v-card-title class="bg-primary text-white pb-3 pt-4">
          <span class="text-h5">{{ isEditing ? t('members.editMember') : t('members.newMember') }}</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-alert v-if="dialogError" type="error" class="mb-4" density="compact">{{ dialogError }}</v-alert>
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            {{ t('members.loginHint') }}
          </v-alert>
          <v-container>
            <v-row>
              <!-- Group 1: Stammdaten -->
              <v-col cols="12" md="4">
                <div class="text-subtitle-2 mb-2 text-primary font-weight-bold">{{ t('members.stammdaten') }}</div>
                <v-text-field v-model="editedItem.firstName" :label="t('members.firstName')" variant="outlined" density="compact" required class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.lastName" :label="t('members.lastName')" variant="outlined" density="compact" required class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.memberNumber" :label="t('members.memberNumber')" variant="outlined" density="compact" required class="mb-2"></v-text-field>
                <v-select v-model="editedItem.status" :items="['ACTIVE', 'INACTIVE', 'PENDING']" :label="t('members.status')" variant="outlined" density="compact"></v-select>
              </v-col>

              <!-- Group 2: Kontakt & System -->
              <v-col cols="12" md="4">
                <div class="text-subtitle-2 mb-2 text-primary font-weight-bold">{{ t('members.kontakt') }}</div>
                <v-text-field v-model="editedItem.email" :label="t('members.email')" type="email" variant="outlined" density="compact" required class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.phone" :label="t('members.phone')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.birthDate" :label="t('members.birthDate')" type="date" variant="outlined" density="compact" class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.username" :label="t('members.username')" variant="outlined" density="compact"></v-text-field>
              </v-col>

              <!-- Group 3: Anschrift -->
              <v-col cols="12" md="4">
                <div class="text-subtitle-2 mb-2 text-primary font-weight-bold">{{ t('members.anschrift') }}</div>
                <v-text-field v-model="editedItem.street" :label="t('members.street')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.postalCode" :label="t('members.postalCode')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                <v-text-field v-model="editedItem.city" :label="t('members.city')" variant="outlined" density="compact"></v-text-field>
              </v-col>

              <!-- Group 4: App-Berechtigungen -->
              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
                <div class="text-subtitle-2 mb-2 text-primary font-weight-bold">{{ t('members.rolesLong') }}</div>
                <v-select v-model="editedItem.roles" :items="['MEMBER', 'MITARBEITER', 'VORSTAND', 'TREASURER']" :label="t('members.roles')" multiple chips variant="outlined" density="compact" :hint="t('members.rolesHint')" persistent-hint></v-select>
              </v-col>
            </v-row>
            <v-row v-if="configStore.isRfidEnabled && isEditing && deviceStore.isAuthorized">
              <v-col cols="12">
                <v-alert v-if="rfidMsg" :type="rfidSuccess ? 'success' : 'error'" class="mb-4" density="compact">{{ rfidMsg }}</v-alert>
                <v-text-field 
                  v-model="rfidInput" 
                  :label="t('members.rfidLabel')" 
                  variant="outlined" 
                  type="password"
                  append-inner-icon="mdi-contactless-payment"
                  :hint="t('members.rfidHint')"
                  persistent-hint
                ></v-text-field>
                <v-btn color="primary" variant="tonal" size="small" class="mt-2" @click="registerRfid" :disabled="!rfidInput">{{ t('members.rfidRegister') }}</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-4 pa-4">
          <v-btn v-if="isEditing" color="warning" variant="tonal" @click="resetPassword">{{ t('members.resetPassword') }}</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveMember">{{ t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Identify RFID Dialog -->
    <v-dialog v-model="identifyDialog" max-width="450px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white pt-4 pb-3">{{ t('members.identify') }}</v-card-title>
        <v-card-text class="pt-6 pb-6 text-center">
          <div v-if="!identifiedMember && !identifyError">
            <v-icon size="64" color="primary" class="mb-4">mdi-contactless-payment</v-icon>
            <div class="text-h6 mb-2">{{ t('members.scanNow') }}</div>
            <div class="text-body-2 text-grey">{{ t('members.scanHint') }}</div>
          </div>
          
          <v-alert v-if="identifyError" type="error" variant="tonal" class="mb-4">{{ identifyError }}</v-alert>
          
          <div v-if="identifiedMember" class="text-center">
            <v-icon size="64" color="success" class="mb-4">mdi-account-check</v-icon>
            <div class="text-h6">{{ identifiedMember.firstName }} {{ identifiedMember.lastName }}</div>
            <div class="text-body-1 text-grey mb-4">{{ t('members.memberNumberAbbr') }}: {{ identifiedMember.memberNumber }}</div>
            <v-btn color="primary" block @click="editIdentifiedMember">{{ t('members.editIdentified') }}</v-btn>
          </div>
          
          <v-progress-linear v-if="identifying" indeterminate color="primary" class="mt-4"></v-progress-linear>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeIdentifyDialog">{{ t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { membersApi, type Member } from '../api/members'
import { useConfirm } from '../composables/useConfirm'
import { api } from '../api/axios'
import { useDeviceStore } from '../stores/device.store'
import { useSystemConfigStore } from '../stores/system-config.store'

const { t } = useI18n()
const { confirm } = useConfirm()
const deviceStore = useDeviceStore()
const configStore = useSystemConfigStore()

const headers = computed(() => [
  { title: t('members.memberNumber'), key: 'memberNumber' },
  { title: t('members.firstName'), key: 'firstName' },
  { title: t('members.lastName'), key: 'lastName' },
  { title: t('members.email'), key: 'email' },
  { title: t('members.phone'), key: 'phone' },
  { title: t('members.status'), key: 'status' },
  { title: t('members.roles'), key: 'roles', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'end' as const },
])

const search = ref('')
const members = ref<Member[]>([])
const loading = ref(false)

async function loadMembers() {
  loading.value = true
  try {
    members.value = await membersApi.getAll()
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function getStatusColor(status: string) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'INACTIVE') return 'grey'
  if (status === 'PENDING') return 'warning'
  return 'error'
}

const dialog = ref(false)
const dialogError = ref('')
const isEditing = ref(false)
const saving = ref(false)

const defaultItem: Partial<Member> = {
  memberNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  status: 'ACTIVE',
  birthDate: ''
}
const editedItem = ref<Partial<Member>>({ ...defaultItem })

function openDialog(member?: any) {
  dialogError.value = ''
  if (member) {
    isEditing.value = true
    editedItem.value = { 
      ...member, 
      birthDate: member.birthDate ? String(member.birthDate).split('T')[0] : '',
      roles: member.user?.roles || ['MEMBER'],
      username: member.user?.username || ''
    }
  } else {
    isEditing.value = false
    editedItem.value = { ...defaultItem }
  }
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  editedItem.value = { ...defaultItem }
}

async function saveMember() {
  saving.value = true
  dialogError.value = ''
  try {
    if (isEditing.value && editedItem.value.id) {
      await membersApi.update(editedItem.value.id, editedItem.value)
    } else {
      await membersApi.create(editedItem.value)
    }
    closeDialog()
    await loadMembers()
  } catch (e: any) {
    dialogError.value = Array.isArray(e.response?.data?.message) 
      ? e.response.data.message.join(', ') 
      : (e.response?.data?.message || t('common.error'))
  }
  saving.value = false
}

const rfidInput = ref('')
const rfidMsg = ref('')
const rfidSuccess = ref(false)

async function registerRfid() {
  if (!rfidInput.value.trim() || !editedItem.value.id) return
  
  try {
    // Es gibt kein membersApi.registerRfid, wir machen einen direkten Axios-Call
    await api.post(`/members/${editedItem.value.id}/rfid`, { token: rfidInput.value.trim() })
    rfidMsg.value = t('members.rfidSuccess')
    rfidSuccess.value = true
  } catch (e: any) {
    rfidMsg.value = e.response?.data?.message || t('members.rfidError')
    rfidSuccess.value = false
  }
  rfidInput.value = ''
}

async function resetPassword() {
  if (!await confirm(t('common.confirm'), t('members.resetPasswordConfirm'))) return
  try {
    const res = await api.post(`/members/${editedItem.value.id}/reset-password`)
    alert(res.data.message || t('members.resetSuccess'))
  } catch (e: any) {
    alert(e.response?.data?.message || t('members.resetError'))
  }
}

async function deactivateMember(id: string) {
  if (await confirm(t('common.confirm'), t('members.deactivateMemberConfirm'))) {
    await membersApi.deactivate(id)
    await loadMembers()
  }
}

async function exportCsv() {
  try {
    const res = await api.get('/members/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${t('members.exportFilename')}-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e) {
    alert(t('members.exportError'))
  }
}


// RFID Identification logic
const identifyDialog = ref(false)
const identifying = ref(false)
const identifiedMember = ref<any>(null)
const identifyError = ref('')
const rfidBuffer = ref('')
let lastKeyTime = 0
let rfidTimeout: any = null

function openIdentifyDialog() {
  identifyDialog.value = true
  identifiedMember.value = null
  identifyError.value = ''
  window.addEventListener('keydown', handleGlobalKeydown, true)
}

function closeIdentifyDialog() {
  identifyDialog.value = false
  window.removeEventListener('keydown', handleGlobalKeydown, true)
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (!identifyDialog.value) return
  
  const currentTime = Date.now()
  const diff = currentTime - lastKeyTime
  lastKeyTime = currentTime

  if (rfidTimeout) clearTimeout(rfidTimeout)

  const isFast = diff < 50 

  if (e.key === 'Enter') {
    if (rfidBuffer.value.length > 5) {
      e.preventDefault()
      e.stopPropagation()
      const token = rfidBuffer.value
      rfidBuffer.value = ''
      performIdentify(token)
    } else {
      rfidBuffer.value = ''
    }
  } else if (e.key.length === 1) {
    if (isFast || rfidBuffer.value.length > 0) {
      e.preventDefault()
      rfidBuffer.value += e.key
    } else {
      rfidBuffer.value = e.key
    }
  }

  rfidTimeout = setTimeout(() => {
    rfidBuffer.value = ''
  }, 100)
}

async function performIdentify(token: string) {
  identifying.value = true
  identifyError.value = ''
  identifiedMember.value = null
  try {
    const res = await api.post('/members/identify-rfid', { token })
    identifiedMember.value = res.data
  } catch (e: any) {
    identifyError.value = e.response?.data?.message || t('members.identifyError')
  }
  identifying.value = false
}

function editIdentifiedMember() {
  const member = members.value.find(m => m.id === identifiedMember.value?.id)
  if (member) {
    closeIdentifyDialog()
    openDialog(member)
  }
}

onMounted(() => {
  loadMembers()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown, true)
})
</script>
