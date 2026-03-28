<template>
  <v-container fluid>
    <v-row>
      <v-col class="d-flex justify-space-between align-center">
        <h1 class="text-h4">Mitgliederverwaltung</h1>
        <div>
          <v-btn color="secondary" variant="tonal" prepend-icon="mdi-download" class="mr-2" @click="exportCsv">Export CSV</v-btn>
          <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openDialog()">Neues Mitglied</v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Suchen..."
            single-line
            hide-details
            class="pa-4"
          ></v-text-field>
          <v-data-table
            :headers="headers"
            :items="members"
            :search="search"
            :loading="loading"
            class="elevation-1"
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
                  :color="role === 'VORSTAND' ? 'primary' : role === 'MITARBEITER' ? 'warning' : role === 'SCHATZMEISTER' ? 'info' : 'grey'"
                  class="mr-1 mb-1"
                >
                  {{ role }}
                </v-chip>
              </div>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteMember(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white pb-3 pt-4">
          <span class="text-h5">{{ isEditing ? 'Mitglied bearbeiten' : 'Neues Mitglied' }}</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-alert v-if="dialogError" type="error" class="mb-4" density="compact">{{ dialogError }}</v-alert>
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            Login-Name wird automatisch formatiert als <b>vorname.nachname</b>. Das Start-Passwort lautet <b>start123</b>.
          </v-alert>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.firstName" label="Vorname" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.lastName" label="Nachname" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.memberNumber" label="Mitglieds-Nr." variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.email" label="E-Mail" type="email" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.phone" label="Telefon" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.street" label="Straße + Nr." variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.postalCode" label="PLZ" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.city" label="Ort" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select v-model="editedItem.status" :items="['ACTIVE', 'INACTIVE', 'PENDING']" label="Status" variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.birthDate" label="Geburtsdatum" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" v-if="isEditing">
                <v-select v-model="editedItem.roles" :items="['MEMBER', 'MITARBEITER', 'SCHATZMEISTER', 'VORSTAND']" label="App Berechtigungen (Rollen)" multiple chips variant="outlined" density="compact" hint="Bestimmt, welche Bereiche die Person in der App sehen kann (z.B. Kasse, Schatzmeister)." persistent-hint></v-select>
              </v-col>
            </v-row>
            <v-row v-if="isEditing">
              <v-col cols="12">
                <v-alert v-if="rfidMsg" :type="rfidSuccess ? 'success' : 'error'" class="mb-4" density="compact">{{ rfidMsg }}</v-alert>
                <v-text-field 
                  v-model="rfidInput" 
                  label="RFID-Code eingeben oder scannen" 
                  variant="outlined" 
                  append-inner-icon="mdi-contactless-payment"
                  hint="Code eingeben und 'Registrieren' klicken, oder RFID-Chip scannen."
                  persistent-hint
                ></v-text-field>
                <v-btn color="primary" variant="tonal" size="small" class="mt-2" @click="registerRfid" :disabled="!rfidInput">RFID Registrieren</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="isEditing" color="warning" variant="tonal" @click="resetPassword">Passwort zurücksetzen</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">Abbrechen</v-btn>
          <v-btn color="primary" variant="flat" @click="saveMember" :loading="saving">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { membersApi, type Member } from '../api/members'
import { api } from '../api/axios'

const headers: any = [
  { title: 'Mitglieds-Nr.', key: 'memberNumber' },
  { title: 'Vorname', key: 'firstName' },
  { title: 'Nachname', key: 'lastName' },
  { title: 'E-Mail', key: 'email' },
  { title: 'Telefon', key: 'phone' },
  { title: 'Status', key: 'status' },
  { title: 'Rollen', key: 'roles', sortable: false },
  { title: 'Aktionen', key: 'actions', sortable: false, align: 'end' },
]

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
      roles: member.user?.roles || ['MEMBER']
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
      : (e.response?.data?.message || 'Ein Fehler ist aufgetreten.')
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
    rfidMsg.value = 'Token erfolgreich registriert!'
    rfidSuccess.value = true
  } catch (e: any) {
    rfidMsg.value = e.response?.data?.message || 'Hardware Token konnte nicht registriert werden.'
    rfidSuccess.value = false
  }
  rfidInput.value = ''
}

async function resetPassword() {
  if (!editedItem.value.id) return
  if (!confirm('Passwort wirklich auf start123 zurücksetzen?')) return
  try {
    const res = await api.post(`/members/${editedItem.value.id}/reset-password`)
    alert(res.data.message || 'Passwort zurückgesetzt.')
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler beim Zurücksetzen.')
  }
}

async function deleteMember(id: string) {
  if (confirm('Mitglied wirklich deaktivieren?')) {
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
    link.setAttribute('download', `Mitglieder-Export-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e) {
    alert('Fehler beim Export.')
  }
}

onMounted(() => {
  loadMembers()
})
</script>
