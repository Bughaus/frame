<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-file-document-outline</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('accounting.title') }}</h1>
    </div>

    <v-row>
      <!-- Quick Entry Form -->
      <v-col cols="12" md="6">
        <v-card class="elevation-2">
          <v-card-title class="bg-primary text-white d-flex align-center">
            <v-icon class="mr-2">mdi-plus-circle</v-icon>
            {{ t('accounting.newRecord') }}
          </v-card-title>
          <v-card-text class="pt-6">
            <v-form @submit.prevent="submitEigenbeleg">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select 
                    v-model="ebForm.type" 
                    :items="[{title:t('treasurer.income'),value:'INCOME'},{title:t('treasurer.expense'),value:'EXPENSE'}]" 
                    :label="t('accounting.type')" 
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model.number="ebForm.amount" 
                    type="number" 
                    step="0.01" 
                    :label="t('finance.amount') + ' (€)'" 
                    variant="outlined" 
                    prefix="€"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field 
                v-model="ebForm.category" 
                :label="t('accounting.categoryHint')" 
                variant="outlined"
              ></v-text-field>
              
              <v-textarea 
                v-model="ebForm.description" 
                :label="t('treasurer.purpose')" 
                variant="outlined" 
                rows="2"
              ></v-textarea>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field 
                    v-model="ebForm.date" 
                    type="date" 
                    :label="t('treasurer.recordDate')" 
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-file-input 
                    v-model="ebForm.file" 
                    :label="t('treasurer.fileUpload')" 
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
                {{ t('common.save') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent History -->
      <v-col cols="12" md="6">
        <v-card class="elevation-2">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            {{ t('accounting.recent') }}
            <v-btn icon="mdi-refresh" variant="text" size="small" @click="load"></v-btn>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-data-table 
              :headers="headers" 
              :items="eigenbelege" 
              :loading="loading" 
              class="pb-2"
              :no-data-text="t('common.noData')"
            >
              <template #item.amount="{ item }">
                <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small" label>
                  {{ item.type === 'INCOME' ? '+' : '-' }}{{ Number(item.amount).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
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
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/axios'

const { t, locale } = useI18n()

const eigenbelege = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.bookingType'), key: 'category' },
  { title: t('finance.amount'), key: 'amount', align: 'end' as const },
])

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
    snackbarText.value = t('accounting.invalidAmount')
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
    
    snackbarText.value = t('accounting.saveSuccess')
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
    snackbarText.value = e.response?.data?.message || t('accounting.saveError')
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  saving.value = false
}

onMounted(() => load())
</script>
