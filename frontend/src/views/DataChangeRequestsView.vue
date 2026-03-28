<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Änderungsanträge</h1>
        <p class="text-medium-emphasis">Hier siehst du alle offenen Datenänderungswünsche der Mitglieder.</p>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card>
          <v-data-table :headers="headers" :items="requests" :loading="loading" class="elevation-1">
            <template #item.member="{ item }">
              {{ item.member?.firstName }} {{ item.member?.lastName }} ({{ item.member?.memberNumber }})
            </template>
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" size="small">{{ item.status }}</v-chip>
            </template>
            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleDateString('de-DE') }}
            </template>
            <template #item.actions="{ item }">
              <v-btn v-if="item.status === 'PENDING'" icon="mdi-check" size="small" color="success" variant="text" title="Genehmigen & Übernehmen" @click="review(item.id, 'APPROVED')"></v-btn>
              <v-btn v-if="item.status === 'PENDING'" icon="mdi-close" size="small" color="error" variant="text" title="Ablehnen" @click="review(item.id, 'REJECTED')"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api/axios'

const requests = ref<any[]>([])
const loading = ref(false)

const headers: any = [
  { title: 'Mitglied', key: 'member' },
  { title: 'Feld', key: 'field' },
  { title: 'Alter Wert', key: 'oldValue' },
  { title: 'Neuer Wert', key: 'newValue' },
  { title: 'Begründung', key: 'reason' },
  { title: 'Status', key: 'status' },
  { title: 'Datum', key: 'createdAt' },
  { title: 'Aktion', key: 'actions', sortable: false, align: 'end' },
]

async function load() {
  loading.value = true
  try {
    requests.value = await api.get('/members/change-requests').then(r => r.data)
  } catch (e) { console.error(e) }
  loading.value = false
}

async function review(id: string, status: 'APPROVED' | 'REJECTED') {
  const action = status === 'APPROVED' ? 'genehmigen und ins System übernehmen' : 'ablehnen'
  if (!confirm(`Antrag wirklich ${action}?`)) return
  try {
    await api.patch(`/members/change-requests/${id}`, { status })
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler.')
  }
}

onMounted(() => load())
</script>
