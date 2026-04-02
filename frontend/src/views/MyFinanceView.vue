<template>
  <v-container fluid class="pa-4">

    <v-row v-if="account">
      <v-col cols="12">
        <v-card class="elevation-2">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            {{ t('finance.recentTransactions') }}
            <v-select
              v-model="filterMode"
              :items="[
                { title: t('finance.allTransactions'), value: 'ALL' },
                { title: t('finance.uninvoiced'), value: 'UNINVOICED' },
                { title: t('finance.currentMonth'), value: 'CURRENT_MONTH' },
                { title: t('finance.lastMonth'), value: 'LAST_MONTH' }
              ]"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 200px"
              class="ml-4"
            ></v-select>
          </v-card-title>
          <v-data-table :headers="headers" :items="filteredTransactions" class="bg-surface" density="compact" :no-data-text="t('common.noData')">
            <template #item.amount="{ item }: { item: any }">
              <span :class="item.type === 'DEBIT' ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                {{ item.type === 'DEBIT' ? '-' : '+' }}{{ Math.abs(Number(item.amount)).toFixed(2) }}€
              </span>
            </template>
            <template #item.createdAt="{ item }: { item: any }">
              {{ new Date(item.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.details="{ item }: { item: any }">
              <span v-if="item.description">{{ item.description }}</span>
              <span v-else>
                {{ item.items?.map((i: any) => `${i.qty}x ${i.article?.name || (locale === 'de' ? 'Artikel' : 'Item')}`).join(', ') }}
              </span>
            </template>
            <template #item.createdBy="{ item }: { item: any }">
              <v-chip size="small" variant="flat" :color="isUuid(item.createdBy) ? 'grey' : 'primary'">{{ isUuid(item.createdBy) ? t('finance.system') : (item.createdBy || (locale === 'de' ? 'Unbekannt' : 'Unknown')) }}</v-chip>
            </template>
            <template #item.actions="{ item }: { item: any }">
              <v-btn v-if="!item.invoiceId && item.type === 'DEBIT'" icon="mdi-delete" size="small" color="error" variant="text" @click="deleteTransaction(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>

        <v-card class="elevation-2 mt-6">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            {{ t('finance.myInvoices') }}
          </v-card-title>
          <v-data-table :headers="invoiceHeaders" :items="invoices" class="bg-surface" density="compact" :no-data-text="t('common.noData')">
            <template #item.totalNet="{ item }">
              {{ Number(item.totalNet).toFixed(2) }}€
            </template>
            <template #item.dueDate="{ item }">
              {{ new Date(item.dueDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
            </template>
            <template #item.actions="{ item }">
              <v-btn size="small" variant="text" color="primary" icon="mdi-download" @click="downloadPdf(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row v-else>
      <v-col cols="12" class="text-center mt-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4 text-h6 text-grey">{{ t('finance.loading') }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { cashRegisterApi } from '../api/cash-register'
import { useConfirm } from '../composables/useConfirm'

const { t, locale } = useI18n()
const { confirm } = useConfirm()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(val: any): boolean { return typeof val === 'string' && UUID_RE.test(val) }

const account = ref<any>(null)
const invoices = ref<any[]>([])
const filterMode = ref('ALL')

function isSameMonth(d1: Date, d2: Date) { return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

const filteredTransactions = computed(() => {
  const txs = account.value?.transactions || []
  const now = new Date()
  
  return txs.filter((t: any) => {
    if (filterMode.value === 'UNINVOICED') return !t.invoiceId
    if (filterMode.value === 'CURRENT_MONTH') return isSameMonth(new Date(t.createdAt), now)
    if (filterMode.value === 'LAST_MONTH') {
      const last = new Date(now)
      last.setMonth(now.getMonth() - 1)
      return isSameMonth(new Date(t.createdAt), last)
    }
    return true
  })
})

const headers = computed(() => [
  { title: t('hours.details'), key: 'details' },
  { title: t('finance.amount'), key: 'amount', align: 'end' as const },
  { title: t('finance.bookedBy'), key: 'createdBy' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
])

const invoiceHeaders = computed(() => [
  { title: t('finance.invoiceNumber'), key: 'invoiceNumber' },
  { title: t('finance.net'), key: 'totalNet' },
  { title: t('finance.dueDate'), key: 'dueDate' },
  { title: t('common.status'), key: 'status' },
  { title: t('finance.action'), key: 'actions', align: 'end' as const }
])

async function load() {
  try {
    const [acc, invs] = await Promise.all([
      cashRegisterApi.getAccountMe(),
      cashRegisterApi.getMyInvoices()
    ])
    account.value = acc
    invoices.value = invs
  } catch (e) {
    console.error('Failed to load finance data', e)
  }
}

function downloadPdf(id: string) {
  cashRegisterApi.downloadInvoicePdf(id)
}

async function deleteTransaction(id: string) {
  if (!await confirm(t('common.confirm'), t('finance.deleteConfirm'))) return
  try {
    await cashRegisterApi.deleteTransaction(id)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || t('finance.deleteError'))
  }
}

onMounted(() => load())
</script>
