<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-bank</v-icon>
      <h1 class="text-h3 font-weight-bold">Vereinskasse</h1>
    </div>
    <v-row>
      <v-col cols="12" md="7">
        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
            Rechnungen
            <v-btn color="white" variant="tonal" size="small" @click="generateInvoices" :loading="generating">Rechnungen für alle Salden erzeugen</v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="invoiceHeaders" :items="invoices" :loading="loading" class="elevation-1">
              <template #item.totalGross="{ item }">{{ Number(item.totalGross).toFixed(2) }}€</template>
              <template #item.status="{ item }">
                <v-chip :color="item.status === 'PAID' ? 'success' : item.status === 'CANCELLED' ? 'grey' : 'warning'" size="small">{{ item.status }}</v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-file-pdf-box" size="small" color="error" variant="text" @click="downloadPdf(item.id)"></v-btn>
                <v-btn v-if="item.status !== 'PAID'" icon="mdi-check-circle" size="small" color="success" variant="text" title="Als Bezahlt markieren" @click="markAsPaid(item.id)"></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions class="bg-surface-variant pa-4">
            <v-btn color="success" block variant="flat" size="large" @click="exportSepa" :disabled="!invoices.some(i => i.status === 'DRAFT')">SEPA-XML für Entwürfe exportieren</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
            Eigenbelege
            <v-btn color="white" variant="tonal" size="small" @click="eigenbelegDialog = true">Neuer Beleg</v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="eigenbelegHeaders" :items="eigenbelege" :loading="loading" class="elevation-1" density="compact">
              <template #item.amount="{ item }">
                <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small">
                  {{ item.type === 'INCOME' ? '+' : '-' }}{{ Number(item.amount).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString('de-DE') }}
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
          <v-card-title class="bg-primary text-white">Buchungen (Globales Logbuch)</v-card-title>
          <v-card-text class="pt-4">
            <v-data-table :headers="bookingHeaders" :items="bookings" :loading="loading" class="elevation-1" density="compact">
              <template #item.amount="{ item }">
                <v-chip :color="item.amount > 0 ? 'success' : 'error'" size="small">
                  {{ item.amount > 0 ? '+' : '' }}{{ (Number(item.amount)).toFixed(2) }}€
                </v-chip>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleString('de-DE') }}
              </template>
              <template #item.type="{ item }">
                {{ item.type }} <v-chip v-if="item.isGuest" size="x-small" color="blue">Gast</v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Eigenbeleg Form -->
    <v-dialog v-model="eigenbelegDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">Neuer Eigenbeleg</v-card-title>
        <v-card-text class="pt-6">
          <v-select v-model="ebForm.type" :items="[{title:'Einnahme',value:'INCOME'},{title:'Ausgabe',value:'EXPENSE'}]" label="Art" variant="outlined" density="compact"></v-select>
          <v-text-field v-model="ebForm.category" label="Kategorie (z.B. Reinigung, Spende)" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model.number="ebForm.amount" type="number" step="0.01" label="Betrag (€)" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="ebForm.description" label="Zweck / Beschreibung" variant="outlined" density="compact"></v-text-field>
          <v-text-field v-model="ebForm.date" type="date" label="Belegdatum" variant="outlined" density="compact"></v-text-field>
          <v-file-input v-model="ebForm.file" label="Kopie / Scan (PDF/JPG)" variant="outlined" density="compact" prepend-icon="mdi-camera" accept="image/*,application/pdf"></v-file-input>
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
import { ref, onMounted } from 'vue'
import { api } from '../../api/axios'
import { cashRegisterApi } from '../../api/cash-register'

const invoices = ref<any[]>([])
const eigenbelege = ref<any[]>([])
const bookings = ref<any[]>([])
const loading = ref(false)
const generating = ref(false)

const invoiceHeaders: any = [
  { title: 'Nr', key: 'invoiceNumber' },
  { title: 'Mitglied', key: 'account.member.lastName' },
  { title: 'Betrag', key: 'totalGross' },
  { title: 'Status', key: 'status' },
  { title: 'PDF', key: 'actions', sortable: false, align: 'end' },
]

const eigenbelegHeaders: any = [
  { title: 'Datum', key: 'date' },
  { title: 'Typ / Kategorie', key: 'category' },
  { title: 'Zweck', key: 'description' },
  { title: 'Betrag', key: 'amount' },
  { title: 'Beleg', key: 'actions', align: 'end' },
]

const bookingHeaders: any = [
  { title: 'Zeitpunkt', key: 'date' },
  { title: 'Quelle / Konto', key: 'source' },
  { title: 'Details', key: 'description' },
  { title: 'Buchungsart', key: 'type' },
  { title: 'Betrag', key: 'amount', align: 'end' },
]

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
      alert('Keine negativen / offenen Salden gefunden.')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || 'Fehler beim Generieren der Rechnungen.')
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
    alert('Keine Entwürfe zum Exportieren gefunden.')
    return
  }
  cashRegisterApi.downloadSepaExport(ids)
}

async function markAsPaid(id: string) {
  if (!confirm('Rechnung als BEZAHLT markieren?')) return
  try {
    await api.patch(`/cash-register/invoices/${id}/status`, { status: 'PAID' })
    await load()
  } catch(e) {
    alert('Fehler beim Aktualisieren der Rechnung.')
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
    alert(e.response?.data?.message || 'Upload fehlgeschlagen');
  }
  saving.value = false;
}

onMounted(() => load())
</script>
