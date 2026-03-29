<template>
  <v-container fluid class="pa-4">

    <v-row v-if="account">
      <v-col cols="12">
        <v-card class="elevation-2">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            Meine Letzten Buchungen
            <v-select
              v-model="filterMode"
              :items="[
                { title: 'Alle Buchungen', value: 'ALL' },
                { title: 'Noch nicht abgerechnet', value: 'UNINVOICED' },
                { title: 'Dieser Monat', value: 'CURRENT_MONTH' },
                { title: 'Letzter Monat', value: 'LAST_MONTH' }
              ]"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 200px"
              class="ml-4"
            ></v-select>
          </v-card-title>
          <v-data-table :headers="headers" :items="filteredTransactions" class="bg-surface" density="compact">
            <template #item.amount="{ item }: { item: any }">
              <span :class="item.type === 'DEBIT' ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
                {{ item.type === 'DEBIT' ? '-' : '+' }}{{ Math.abs(Number(item.amount)).toFixed(2) }}€
              </span>
            </template>
            <template #item.createdAt="{ item }: { item: any }">
              {{ new Date(item.createdAt).toLocaleString('de-DE') }}
            </template>
            <template #item.details="{ item }: { item: any }">
              <span v-if="item.description">{{ item.description }}</span>
              <span v-else>
                {{ item.items?.map((i: any) => `${i.qty}x ${i.article?.name || 'Artikel'}`).join(', ') }}
              </span>
            </template>
            <template #item.createdBy="{ item }: { item: any }">
              <v-chip size="small" variant="flat" :color="isUuid(item.createdBy) ? 'grey' : 'primary'">{{ isUuid(item.createdBy) ? 'System' : (item.createdBy || 'Unbekannt') }}</v-chip>
            </template>
            <template #item.actions="{ item }: { item: any }">
              <v-btn v-if="!item.invoiceId && item.type === 'DEBIT'" icon="mdi-delete" size="small" color="error" variant="text" @click="deleteTransaction(item.id)"></v-btn>
            </template>
          </v-data-table>
        </v-card>

        <v-card class="elevation-2 mt-6">
          <v-card-title class="bg-surface-variant d-flex justify-space-between align-center">
            Meine Rechnungen
          </v-card-title>
          <v-data-table :headers="invoiceHeaders" :items="invoices" class="bg-surface" density="compact">
            <template #item.totalNet="{ item }">
              {{ Number(item.totalNet).toFixed(2) }}€
            </template>
            <template #item.dueDate="{ item }">
              {{ new Date(item.dueDate).toLocaleDateString('de-DE') }}
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
        <div class="mt-4 text-h6 text-grey">Lade Finanzdaten...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cashRegisterApi } from '../api/cash-register'

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

const headers: any = [
  { title: 'Details', key: 'details' },
  { title: 'Betrag', key: 'amount', align: 'end' },
  { title: 'Gebucht von', key: 'createdBy' },
  { title: '', key: 'actions', align: 'end', sortable: false },
]

const invoiceHeaders: any = [
  { title: 'Rechnungsnummer', key: 'invoiceNumber' },
  { title: 'Netto', key: 'totalNet' },
  { title: 'Fällig am', key: 'dueDate' },
  { title: 'Status', key: 'status' },
  { title: 'Aktion', key: 'actions', align: 'end' }
]

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
  if (!confirm('Diese Buchung wirklich unwiderruflich löschen?')) return
  try {
    await cashRegisterApi.deleteTransaction(id)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler beim Löschen.')
  }
}

onMounted(() => load())
</script>
