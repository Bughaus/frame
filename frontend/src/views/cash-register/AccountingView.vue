<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-file-document-outline</v-icon>
      <h1 class="text-h3 font-weight-bold">Buchungen</h1>
    </div>

    <v-row>
      <!-- Quick Entry Form -->
      <v-col cols="12" md="6">
        <v-card class="elevation-2">
          <v-card-title class="bg-primary text-white d-flex align-center">
            <v-icon class="mr-2">mdi-plus-circle</v-icon>
            Neuer Eigenbeleg / Buchung
          </v-card-title>
          <v-card-text class="pt-6">
            <v-form @submit.prevent="submitEigenbeleg">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select 
                    v-model="ebForm.type" 
                    :items="[{title:'Einnahme',value:'INCOME'},{title:'Ausgabe',value:'EXPENSE'}]" 
                    label="Art der Buchung" 
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model.number="ebForm.amount" 
                    type="number" 
                    step="0.01" 
                    label="Betrag (€)" 
                    variant="outlined" 
                    prefix="€"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field 
                v-model="ebForm.category" 
                label="Kategorie (z.B. Reinigung, Spende, Material)" 
                variant="outlined"
              ></v-text-field>
              
              <v-textarea 
                v-model="ebForm.description" 
                label="Zweck / Beschreibung" 
                variant="outlined" 
                rows="2"
              ></v-textarea>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model="ebForm.date" 
                    type="date" 
                    label="Belegdatum" 
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-file-input 
                    v-model="ebForm.file" 
                    label="Beleg-Upload (PDF/Bild)" 
                    variant="outlined" 
                    prepend-icon="mdi-camera" 
                    accept="image/*,application/pdf"
                  ></v-file-input>
                </v-col>
              </v-row>

              <v-btn 
                type="submit" 
                color="primary" 
                block 
                size="large" 
                class="mt-2" 
                :loading="saving"
              >
                Buchung Speichern
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent History -->
      <v-col cols="12" md="6">
        <v-card class="elevation-2">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            Letzte Einträge
            <v-btn icon="mdi-refresh" variant="text" size="small" @click="load"></v-btn>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-data-table 
              :headers="headers" 
              :items="eigenbelege" 
              :loading="loading" 
              density="compact"
            >
              <template #item.amount="{ item }">
                <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small" label>
                  {{ item.type === 'INCOME' ? '+' : '-' }}{{ Number(item.amount).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString('de-DE') }}
              </template>
              <template #item.category="{ item }">
                <div class="font-weight-medium">{{ item.category }}</div>
                <div class="text-caption text-grey text-truncate" style="max-width: 200px">{{ item.description }}</div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api/axios'

const eigenbelege = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers: any = [
  { title: 'Datum', key: 'date' },
  { title: 'Kategorie / Zweck', key: 'category' },
  { title: 'Betrag', key: 'amount', align: 'end' },
]

const ebForm = ref<any>({ 
  type: 'EXPENSE', 
  amount: 0, 
  category: '', 
  description: '', 
  date: new Date().toISOString().split('T')[0], 
  file: null 
})

async function load() {
  loading.value = true
  try {
    const res = await api.get('/cash-register/eigenbelege')
    eigenbelege.value = res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (e) {
    console.error('Failed to load bookings', e)
  }
  loading.value = false
}

async function submitEigenbeleg() {
  if (ebForm.value.amount <= 0) {
    snackbarText.value = 'Bitte einen gültigen Betrag eingeben.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('type', ebForm.value.type)
    formData.append('category', ebForm.value.category)
    formData.append('amount', String(ebForm.value.amount))
    formData.append('description', ebForm.value.description)
    formData.append('date', ebForm.value.date)
    if (ebForm.value.file) {
      formData.append('file', ebForm.value.file)
    }
    
    await api.post('/cash-register/eigenbelege', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    snackbarText.value = 'Buchung erfolgreich gespeichert.'
    snackbarColor.value = 'success'
    snackbar.value = true
    
    // Reset form
    ebForm.value = { 
      type: 'EXPENSE', 
      amount: 0, 
      category: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0], 
      file: null 
    }
    
    load()
  } catch (e: any) {
    snackbarText.value = e.response?.data?.message || 'Speichern fehlgeschlagen'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  saving.value = false
}

onMounted(() => load())
</script>
