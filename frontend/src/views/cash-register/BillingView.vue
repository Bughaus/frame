<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-account-cash</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('treasurer.title') }}</h1>
    </div>

    <v-card class="elevation-2">
      <v-tabs v-model="activeTab" bg-color="primary" grow>
        <v-tab value="invoices">
          <v-icon start>mdi-file-document-outline</v-icon>
          {{ t('treasurer.invoices') }}
        </v-tab>
        <v-tab value="paypal">
          <v-icon start>mdi-paypal</v-icon>
          {{ t('treasurer.paypalLedger') }}
        </v-tab>
        <v-tab value="master">
          <v-icon start>mdi-book-multiple</v-icon>
          {{ t('treasurer.masterLedger') }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="pa-4">
        <!-- TAB 1: INVOICES -->
        <v-window-item value="invoices">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h5">{{ t('treasurer.invoices') }}</h2>
            <div class="d-flex ga-2">
              <v-btn color="primary" variant="flat" size="small" @click="generateInvoices" :loading="generating" prepend-icon="mdi-plus">
                {{ t('treasurer.generateInvoices') }}
              </v-btn>
              <v-btn color="success" variant="flat" size="small" @click="exportSepa" :disabled="!invoices.some(i => i.status === 'DRAFT')" prepend-icon="mdi-xml">
                {{ t('treasurer.exportSepa') }}
              </v-btn>
            </div>
          </div>

          <v-data-table 
            :headers="invoiceHeaders" 
            :items="invoices" 
            :loading="loading" 
            class="elevation-0 border rounded-lg" 
            :no-data-text="t('common.noData')"
          >
            <template #item.totalGross="{ item }">{{ Number(item.totalGross).toFixed(2) }}€</template>
            <template #item.status="{ item }">
              <v-chip :color="item.status === 'PAID' ? 'success' : item.status === 'CANCELLED' ? 'grey' : 'warning'" size="small" label>
                {{ item.status }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex justify-end">
                <v-btn icon="mdi-file-pdf-box" size="small" color="error" variant="text" @click="downloadPdf(item.id)"></v-btn>
                <v-btn v-if="item.status !== 'PAID'" icon="mdi-check-circle" size="small" color="success" variant="text" :title="t('treasurer.markPaid')" @click="markAsPaid(item.id)"></v-btn>
              </div>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- TAB 2: PAYPAL GUESTS -->
        <v-window-item value="paypal">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h5">{{ t('treasurer.paypalLedger') }}</h2>
            <v-chip color="info" variant="flat">Digital Only</v-chip>
          </div>
          <v-data-table 
            :headers="guestHeaders" 
            :items="paypalTransactions" 
            :loading="loading" 
            class="elevation-0 border rounded-lg" 
            :no-data-text="t('common.noData')"
          >
            <template #item.amount="{ item }">
              <span class="font-weight-bold">{{ Math.abs(Number(item.amount)).toFixed(2) }}€</span>
            </template>
            <template #item.date="{ item }">
              {{ new Date(item.date).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.description="{ item }">
              <div class="text-caption text-grey">{{ item.description }}</div>
            </template>
            <template #item.actions="{ item }">
              <v-btn 
                icon="mdi-file-pdf-box" 
                size="small" 
                color="error" 
                variant="text" 
                @click="downloadGuestReceipt(item.id)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- TAB 3: MASTER LEDGER -->
        <v-window-item value="master">
          <div class="d-flex flex-column ga-4">
            <div class="d-flex justify-space-between align-center flex-wrap ga-2">
               <h2 class="text-h5">{{ t('treasurer.masterLedger') }}</h2>
               <v-btn color="secondary" prepend-icon="mdi-export" @click="exportMasterCsv">
                 {{ t('treasurer.exportCsv') }}
               </v-btn>
            </div>

            <!-- Filters -->
            <v-row dense class="bg-grey-lighten-4 pa-3 rounded-lg border mb-2">
              <v-col cols="12" sm="4">
                <v-select
                  v-model="filters.type"
                  :items="filterTypeOptions"
                  :label="t('treasurer.filterType')"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="filters.search"
                  :label="t('treasurer.filterMember')"
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-btn block color="grey-darken-1" variant="outlined" prepend-icon="mdi-filter-off" @click="resetFilters">
                  {{ t('common.all') }}
                </v-btn>
              </v-col>
            </v-row>

            <v-data-table 
              :headers="masterHeaders" 
              :items="filteredBookings" 
              :loading="loading" 
              class="elevation-0 border rounded-lg" 
              density="compact" 
              :no-data-text="t('common.noData')"
            >
              <template #item.amount="{ item }">
                <v-chip :color="item.amount > 0 ? 'success' : 'error'" size="x-small" label>
                  {{ item.amount > 0 ? '+' : '' }}{{ (Number(item.amount)).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}
              </template>
              <template #item.type="{ item }">
                <span class="text-caption text-uppercase">{{ item.type }}</span>
                <v-chip v-if="item.isGuest" size="x-small" color="info" class="ml-1" variant="outlined">GAST</v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn 
                  v-if="item.isGuest" 
                  icon="mdi-file-pdf-box" 
                  size="x-small" 
                  variant="text" 
                  color="error" 
                  @click="downloadGuestReceipt(item.id)"
                ></v-btn>
              </template>
            </v-data-table>
          </div>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/axios'
import { cashRegisterApi } from '../../api/cash-register'
import { useConfirm } from '../../composables/useConfirm'

const { t, locale } = useI18n()
const { confirm } = useConfirm()

const activeTab = ref('invoices')
const loading = ref(false)
const generating = ref(false)

const invoices = ref<any[]>([])
const allBookings = ref<any[]>([])
const filters = ref({
  type: null,
  search: ''
})

const invoiceHeaders = computed(() => [
  { title: t('treasurer.nr'), key: 'invoiceNumber' },
  { title: t('inbox.member'), key: 'account.member.lastName' },
  { title: t('finance.amount'), key: 'totalGross' },
  { title: t('common.status'), key: 'status' },
  { title: t('treasurer.pdf'), key: 'actions', sortable: false, align: 'end' as const },
])

const guestHeaders = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.source'), key: 'source' },
  { title: t('finance.amount'), key: 'amount' },
  { title: t('hours.details'), key: 'description' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const masterHeaders = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.source'), key: 'source' },
  { title: t('hours.details'), key: 'description' },
  { title: t('treasurer.bookingType'), key: 'type' },
  { title: t('finance.amount'), key: 'amount', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const filterTypeOptions = computed(() => [
  { title: 'Member Debit', value: 'DEBIT' },
  { title: 'Adjustment', value: 'ADJUSTMENT' },
  { title: 'Credit', value: 'CREDIT' },
  { title: 'Guest Sale', value: 'GAST' }
])

const paypalTransactions = computed(() => {
  return allBookings.value.filter(b => b.isGuest && (b.description.includes('PAYPAL') || b.description.includes('Paypal')))
})

const filteredBookings = computed(() => {
  let result = [...allBookings.value]
  
  if (filters.value.type) {
    if (filters.value.type === 'GAST') {
      result = result.filter(b => b.isGuest)
    } else {
      result = result.filter(b => b.type === filters.value.type && !b.isGuest)
    }
  }
  
  if (filters.value.search) {
    const s = filters.value.search.toLowerCase()
    result = result.filter(b => 
      b.source.toLowerCase().includes(s) || 
      b.description.toLowerCase().includes(s)
    )
  }
  
  return result
})

async function load() {
  loading.value = true
  try {
    const [invs, bookings] = await Promise.all([
      api.get('/cash-register/invoices').then(res => res.data),
      cashRegisterApi.getGlobalTransactions()
    ])
    invoices.value = invs
    allBookings.value = bookings
  } catch (e) {
    console.error('Failed to load billing data', e)
  }
  loading.value = false
}

async function generateInvoices() {
  generating.value = true
  try {
    const accs = await api.get('/cash-register/accounts').then(res => res.data)
    const validAccs = accs.filter((a: any) => a.balance !== 0).map((a: any) => a.id)
    if (validAccs.length > 0) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 14)
      await api.post('/cash-register/invoices', { accountIds: validAccs, dueDate: targetDate.toISOString() })
      await load()
    } else {
      alert(t('treasurer.noBalances'))
    }
  } catch (e: any) {
    alert(e.response?.data?.message || t('treasurer.genError'))
  }
  generating.value = false
}

function resetFilters() {
  filters.value = { type: null, search: '' }
}

function exportMasterCsv() {
  const data = filteredBookings.value
  if (!data.length) return
  
  const headers = ['Date', 'Source', 'Description', 'Type', 'Amount']
  const rows = data.map(b => [
    new Date(b.date).toISOString(),
    b.source,
    b.description,
    b.isGuest ? 'GUEST' : b.type,
    Number(b.amount).toFixed(2)
  ])
  
  const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `master_ledger_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadPdf(id: string) {
  cashRegisterApi.downloadInvoicePdf(id)
}

function exportSepa() {
  const ids = invoices.value
    .filter(i => i.status === 'DRAFT')
    .map(i => i.id)
    .join(',')
    
  if (!ids) {
    alert(t('treasurer.noDrafts'))
    return
  }
  cashRegisterApi.downloadSepaExport(ids)
}

async function markAsPaid(id: string) {
  if (!await confirm(t('common.confirm'), t('treasurer.confirmPaid'))) return
  try {
    await api.patch(`/cash-register/invoices/${id}/status`, { status: 'PAID' })
    await load()
  } catch(e) {
    alert(t('common.error'))
  }
}

function downloadGuestReceipt(id: string) {
  cashRegisterApi.downloadGuestReceiptPdf(id)
}

onMounted(() => load())
</script>
