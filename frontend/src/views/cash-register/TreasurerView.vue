<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-bank</v-icon>
      <h1 class="text-h3 font-weight-bold">{{ t('treasurer.title') }}</h1>
    </div>
    <v-row>
      <v-col cols="12" md="7">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
            {{ t('treasurer.invoices') }}
            <v-btn color="white" variant="tonal" size="small" @click="generateInvoices" :loading="generating">{{ t('treasurer.generateInvoices') }}</v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="invoiceHeaders" :items="invoices" :loading="loading" class="elevation-1" :no-data-text="t('common.noData')">
              <template #item.totalGross="{ item }">{{ Number(item.totalGross).toFixed(2) }}€</template>
              <template #item.status="{ item }">
                <v-chip :color="item.status === 'PAID' ? 'success' : item.status === 'CANCELLED' ? 'grey' : 'warning'" size="small">{{ item.status }}</v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-file-pdf-box" size="small" color="error" variant="text" @click="downloadPdf(item.id)"></v-btn>
                <v-btn v-if="item.status !== 'PAID'" icon="mdi-check-circle" size="small" color="success" variant="text" :title="t('treasurer.markPaid')" @click="markAsPaid(item.id)"></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions class="bg-surface-variant pa-4">
            <v-btn color="success" block variant="flat" size="large" @click="exportSepa" :disabled="!invoices.some(i => i.status === 'DRAFT')">{{ t('treasurer.exportSepa') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
            {{ t('treasurer.internalRecords') }}
            <v-btn color="white" variant="tonal" size="small" @click="eigenbelegDialog = true">{{ t('treasurer.newRecord') }}</v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="eigenbelegHeaders" :items="eigenbelege" :loading="loading" class="elevation-1" density="compact" :no-data-text="t('common.noData')">
              <template #item.amount="{ item }">
                <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small">
                  {{ item.type === 'INCOME' ? '+' : '-' }}{{ Number(item.amount).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
              </template>
              <template #item.actions="{ item }">
                 <v-btn v-if="item.attachments && item.attachments.length > 0" icon="mdi-paperclip" size="small" variant="text"></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Global Buchungen Ledger -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white">{{ t('treasurer.globalLog') }}</v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="bookingHeaders" :items="bookings" :loading="loading" class="elevation-1" density="compact" :no-data-text="t('common.noData')">
              <template #item.amount="{ item }">
                <v-chip :color="item.amount > 0 ? 'success' : 'error'" size="small">
                  {{ item.amount > 0 ? '+' : '' }}{{ (Number(item.amount)).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') }}
              </template>
              <template #item.type="{ item }">
                {{ item.type }} <v-chip v-if="item.isGuest" size="x-small" color="blue">{{ t('pos.guests') }}</v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Eigenbeleg Form -->
    <v-dialog v-model="eigenbelegDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">{{ t('treasurer.newRecord') }}</v-card-title>
        <v-card-text class="pt-6">
          <v-select v-model="ebForm.type" :items="[{title:t('treasurer.income'),value:'INCOME'},{title:t('treasurer.expense'),value:'EXPENSE'}]" :label="t('accounting.type')" variant="outlined" density="compact"></v-select>
          <v-text-field v-model="ebForm.category" :label="t('treasurer.categoryHint')" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model.number="ebForm.amount" type="number" step="0.01" :label="t('finance.amount') + ' (€)'" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="ebForm.description" :label="t('treasurer.purpose')" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="ebForm.date" type="date" :label="t('treasurer.recordDate')" variant="outlined" density="compact"></v-text-field>
          <v-file-input v-model="ebForm.file" :label="t('treasurer.fileUpload')" variant="outlined" density="compact" prepend-icon="mdi-camera" accept="image/*,application/pdf"></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="eigenbelegDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" variant="flat" @click="submitEigenbeleg" :loading="saving">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

const invoices = ref<any[]>([])
const eigenbelege = ref<any[]>([])
const bookings = ref<any[]>([])
const loading = ref(false)
const generating = ref(false)

const invoiceHeaders = computed(() => [
  { title: t('treasurer.nr'), key: 'invoiceNumber' },
  { title: t('inbox.member'), key: 'account.member.lastName' },
  { title: t('finance.amount'), key: 'totalGross' },
  { title: t('common.status'), key: 'status' },
  { title: t('treasurer.pdf'), key: 'actions', sortable: false, align: 'end' as const },
])

const eigenbelegHeaders = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.bookingType'), key: 'category' },
  { title: t('treasurer.purpose'), key: 'description' },
  { title: t('finance.amount'), key: 'amount' },
  { title: t('treasurer.internalRecords'), key: 'actions', align: 'end' as const },
])

const bookingHeaders = computed(() => [
  { title: t('hours.date'), key: 'date' },
  { title: t('treasurer.source'), key: 'source' },
  { title: t('hours.details'), key: 'description' },
  { title: t('treasurer.bookingType'), key: 'type' },
  { title: t('finance.amount'), key: 'amount', align: 'end' as const },
])

const eigenbelegDialog = ref(false)
const saving = ref(false)
const ebForm = ref<any>({ type: 'EXPENSE', amount: 0, category: '', description: '', date: new Date().toISOString().split('T')[0], file: null })

async function load() {
  loading.value = true
  const [invs, ebs, bks] = await Promise.all([
    api.get('/cash-register/invoices').then(res => res.data),
    api.get('/cash-register/eigenbelege').then(res => res.data),
    cashRegisterApi.getGlobalTransactions()
  ])
  invoices.value = invs
  eigenbelege.value = ebs
  bookings.value = bks
  loading.value = false
}

async function generateInvoices() {
  generating.value = true
  try {
    const accs = await api.get('/cash-register/accounts').then(res => res.data)
    const validAccs = accs.filter((a: any) => a.balance !== 0).map((a: any) => a.id)
    if (validAccs.length > 0) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 14) // Fällig in 14 Tagen
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


async function submitEigenbeleg() {
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('type', ebForm.value.type);
    formData.append('category', ebForm.value.category);
    formData.append('amount', String(ebForm.value.amount));
    formData.append('description', ebForm.value.description);
    formData.append('date', ebForm.value.date);
    if (ebForm.value.file) {
      formData.append('file', ebForm.value.file);
    }
    
    await api.post('/cash-register/eigenbelege', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    eigenbelegDialog.value = false;
    ebForm.value = { type: 'EXPENSE', amount: 0, category: '', description: '', date: new Date().toISOString().split('T')[0], file: null };
    load();
  } catch (e: any) {
    alert(e.response?.data?.message || t('treasurer.uploadError'));
  }
  saving.value = false;
}

onMounted(() => load())
</script>
