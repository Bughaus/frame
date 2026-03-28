<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white">Mein Profil</v-card-title>
          <v-card-text class="pt-4" v-if="member">
            <v-list density="compact">
              <v-list-item><v-list-item-title>Mitgliedsnummer</v-list-item-title><v-list-item-subtitle>{{ member.memberNumber }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Name</v-list-item-title><v-list-item-subtitle>{{ member.firstName }} {{ member.lastName }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>E-Mail</v-list-item-title><v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Telefon</v-list-item-title><v-list-item-subtitle>{{ member.phone || '-' }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Adresse</v-list-item-title><v-list-item-subtitle>{{ member.street || '-' }}, {{ member.postalCode || '' }} {{ member.city || '' }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Geburtsdatum</v-list-item-title><v-list-item-subtitle>{{ member.birthDate ? new Date(member.birthDate).toLocaleDateString('de-DE') : '-' }}</v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Status</v-list-item-title><v-list-item-subtitle><v-chip :color="member.status === 'ACTIVE' ? 'success' : 'grey'" size="small">{{ member.status }}</v-chip></v-list-item-subtitle></v-list-item>
              <v-list-item><v-list-item-title>Berechtigungen</v-list-item-title><v-list-item-subtitle><v-chip v-for="r in authStore.user?.roles" :key="r" size="small" class="mr-1" color="secondary">{{ r }}</v-chip></v-list-item-subtitle></v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn color="accent" variant="tonal" @click="changeDialog = true" prepend-icon="mdi-pencil">Änderung beantragen</v-btn>
          </v-card-actions>
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

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="bg-surface-variant">Meine Änderungsanträge</v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="requestHeaders" :items="changeRequests" density="compact" class="elevation-1">
              <template #item.status="{ item }">
                <v-chip :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" size="small">{{ item.status }}</v-chip>
              </template>
              <template #item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString('de-DE') }}
              </template>
            </v-data-table>
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../api/axios'

const authStore = useAuthStore()

const member = ref<any>(null)
const changeRequests = ref<any[]>([])

const requestHeaders: any = [
  { title: 'Feld', key: 'field' },
  { title: 'Neuer Wert', key: 'newValue' },
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
    changeRequests.value = await api.get('/members/me/change-requests').then(r => r.data)
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

// Password
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

onMounted(() => loadProfile())
</script>
