<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-cash-register</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('nav.accounting') }}</h1>
    </div>

    <v-row>
      <!-- Cash Balance Summary -->
      <v-col cols="12">
        <v-card class="elevation-2 bg-primary text-white mb-4">
          <v-card-text class="d-flex justify-space-between align-center py-6">
            <div>
              <div class="text-subtitle-1 opacity-80">{{ t('treasurer.cashBalance') }}</div>
              <div class="text-h2 font-weight-black">{{ cashBalance.toFixed(2) }}€</div>
            </div>
            <v-icon size="80" class="opacity-20">mdi-wallet-outline</v-icon>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Entry Form -->
      <v-col cols="12" lg="4">
        <v-card class="elevation-2 h-100">
          <v-card-title class="bg-primary text-white d-flex align-center">
            <v-icon class="mr-2">mdi-plus-circle</v-icon>
            {{ t('accounting.newRecord') }}
          </v-card-title>
          <v-card-text class="pt-6">
            <v-form @submit.prevent="submitEigenbeleg">
              <v-row>
                <v-col cols="12">
                  <v-select 
                    v-model="ebForm.type" 
                    :items="[{title:t('treasurer.income'),value:'INCOME'},{title:t('treasurer.expense'),value:'EXPENSE'}]" 
                    :label="t('accounting.type')" 
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12">
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

              <v-combobox 
                v-model="ebForm.category" 
                :items="categoryOptions"
                :label="t('accounting.categoryHint')" 
                variant="outlined"
              ></v-combobox>
              
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

      <!-- Cash Book (History) -->
      <v-col cols="12" lg="8">
        <v-card class="elevation-2 h-100">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            {{ t('treasurer.cashBook') }}
            <v-btn icon="mdi-refresh" variant="text" size="small" @click="load"></v-btn>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-data-table 
              :headers="headers" 
              :items="cashBookItems" 
              :loading="loading" 
              class="pb-2"
              :no-data-text="t('common.noData')"
              hover
            >
              <template #item.amount="{ item }">
                <v-chip :color="item.amount > 0 ? 'success' : 'error'" size="small" label>
                  {{ item.amount > 0 ? '+' : '' }}{{ (Number(item.amount)).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
              </template>
              <template #item.description="{ item }">
                <div class="font-weight-medium">{{ item.category }}</div>
                <div class="text-caption text-grey text-truncate" style="max-width: 300px">{{ item.description }}</div>
              </template>
              <template #item.source="{ item }">
                <v-chip v-if="item.isGuest" size="x-small" color="info" variant="flat">GAST</v-chip>
                <v-chip v-else size="x-small" color="secondary" variant="flat">INTERN</v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn 
                  v-if="item.isGuest" 
                  icon="mdi-file-pdf-box" 
                  size="x-small" 
                  variant="text" 
                  color="error" 
                  @click="downloadReceipt(item.id)"
                ></v-btn>
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
import { cashRegisterApi } from '../../api/cash-register'

const { t, locale } = useI18n()

const eigenbelege = ref<any[]>([])
const allTransactions = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.source'), key: 'source', width: '80px' },
  { title: t('treasurer.bookingType'), key: 'description' },
  { title: t('finance.amount'), key: 'amount', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const categoryOptions = computed(() => {
  const existing = eigenbelege.value.map(e => e.category).filter(Boolean)
  return [...new Set([t('treasurer.startingBalance'), 'Reinigung', 'Getränke', 'Material', 'Spende', ...existing])].sort()
})

const ebForm = ref<any>({ 
  type: 'EXPENSE', 
  amount: 0, 
  category: '', 
  description: '', 
  date: new Date().toISOString().split('T')[0], 
  file: null 
})

const cashBookItems = computed(() => {
  const items = [
    ...eigenbelege.value.map(e => ({
      id: e.id,
      date: e.date,
      amount: e.type === 'INCOME' ? Number(e.amount) : -Number(e.amount),
      category: e.category,
      description: e.description,
      isGuest: false,
      createdAt: e.createdAt
    })),
    ...allTransactions.value
      .filter(t => t.isGuest && (t.description.includes('CASH') || t.description.includes('Bar')))
      .map(t => ({
        id: t.id,
        date: t.date,
        amount: Math.abs(Number(t.amount)), // Guest payments are positive in the cashbook context
        category: 'Gastzahlung (Bar)',
        description: t.description,
        isGuest: true,
        createdAt: t.date
      }))
  ]
  
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const cashBalance = computed(() => {
  return cashBookItems.value.reduce((acc, item) => acc + item.amount, 0)
})

async function load() {
  loading.value = true
  try {
    const [ebRes, allTx] = await Promise.all([
      api.get('/cash-register/eigenbelege'),
      cashRegisterApi.getGlobalTransactions()
    ])
    eigenbelege.value = ebRes.data
    allTransactions.value = allTx
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

function downloadReceipt(id: string) {
  cashRegisterApi.downloadGuestReceiptPdf(id)
}

onMounted(() => load())
</script>
