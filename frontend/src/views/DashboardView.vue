<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <v-icon size="x-large" color="primary" class="mr-3">mdi-cash-register</v-icon>
      <h1 class="text-h3 font-weight-bold">Persönliches Terminal</h1>
    </div>
    
    <v-row v-if="account">
      <!-- Left side: Balance & Cart -->
      <v-col cols="12" md="4">
        <v-card class="mb-4 elevation-2">
          <v-card-title class="bg-primary text-white">Mein Kontostand</v-card-title>
          <v-card-text class="pt-6 text-center">
            <div class="text-h3 font-weight-black" :class="Number(account.balance) < 0 ? 'text-error' : 'text-success'">
              {{ Number(account.balance).toFixed(2) }}€
            </div>
            <div class="text-caption text-grey mt-2">Guthaben / Offener Deckel</div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4 elevation-2">
          <v-card-title class="bg-primary text-white">Arbeitsstunden {{ currentYear }}</v-card-title>
          <v-card-text class="pt-6 text-center">
            <div class="text-h3 font-weight-bold text-primary">
              {{ hoursStats.confirmedHours }} / {{ requiredHours }}h
            </div>
            <v-progress-linear
              :model-value="requiredHours > 0 ? (hoursStats.confirmedHours / requiredHours) * 100 : 0"
              color="primary" height="10" rounded class="mt-4"
            ></v-progress-linear>
            <div class="text-caption text-grey mt-2 text-center">
              Gesamt inkl. geplant: {{ hoursStats.totalHours }}h
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="elevation-2">
          <v-card-title class="bg-primary text-white">Mein Warenkorb</v-card-title>
          <v-list density="compact" class="pt-0 pb-0 bg-transparent">
            <v-list-item v-for="(item, i) in cart" :key="i">
              <template #prepend>
                <span class="font-weight-bold mr-2">{{ item.quantity }}x</span>
              </template>
              <v-list-item-title>{{ item.article.name }}</v-list-item-title>
              <template #append>
                <span class="mr-4">{{ (Number(item.article.price) * item.quantity).toFixed(2) }}€</span>
                <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeFromCart(i)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          
          <v-divider></v-divider>
          <v-card-text class="d-flex justify-space-between align-center text-h6 font-weight-bold">
            <span>Total:</span>
            <span>{{ cartTotal.toFixed(2) }}€</span>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-btn color="success" block size="large" variant="flat" elevation="2" @click="checkout" :loading="checkingOut" :disabled="cart.length === 0">
              Jetzt Buchen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Right side: Articles Grid & History -->
      <v-col cols="12" md="8">
        <v-card class="mb-6 elevation-2">
          <v-card-title class="bg-surface-variant d-flex align-center flex-wrap">
            <span>Artikel Auswahl</span>
            <v-spacer></v-spacer>
            <v-chip-group v-model="selectedCategory" selected-class="text-primary" filter mandatory>
              <v-chip v-for="cat in categories" :key="cat" :value="cat" variant="tonal" size="small">{{ cat }}</v-chip>
            </v-chip-group>
          </v-card-title>
          <v-card-text class="pt-4 bg-surface overflow-y-auto" style="max-height: 500px">
            <v-row>
              <v-col v-for="article in filteredArticles" :key="article.id" cols="6" sm="4" md="3">
                <v-card @click="addToCart(article)" hover class="text-center pa-4" elevation="1">
                  <v-avatar size="64" class="mb-2" rounded="lg">
                    <v-img v-if="article.imageUrl" :src="getImageUrl(article.imageUrl)" cover></v-img>
                    <v-icon v-else size="48" color="primary">mdi-food-apple</v-icon>
                  </v-avatar>
                  <div class="text-subtitle-1 font-weight-bold">{{ article.name }}</div>
                  <div class="text-caption font-weight-black text-primary">{{ Number(article.price).toFixed(2) }}€</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

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
        <div class="mt-4 text-h6 text-grey">Lade Kontodaten...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { articlesApi, cashRegisterApi, type Article } from '../api/cash-register'
import { api } from '../api/axios'
import { hoursApi } from '../api/hours'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(val: any): boolean { return typeof val === 'string' && UUID_RE.test(val) }

const account = ref<any>(null)
const articles = ref<Article[]>([])
const invoices = ref<any[]>([])
const currentYear = new Date().getFullYear()
const hoursStats = ref({ confirmedHours: 0, totalHours: 0 })
const requiredHours = ref(0)
const selectedCategory = ref('Alle')

const categories = computed(() => {
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean))
  return ['Alle', ...Array.from(cats).sort()] as string[]
})

const filteredArticles = computed(() => {
  if (selectedCategory.value === 'Alle') return articles.value
  return articles.value.filter(a => a.category === selectedCategory.value)
})

interface CartItem {
  article: Article
  quantity: number
}
const cart = ref<CartItem[]>([])

const filterMode = ref('ALL')
function isSameMonth(d1: Date, d2: Date) { return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

function getImageUrl(path: string | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '')
  return `${baseURL}${path}`
}

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
  { title: 'Datum', key: 'createdAt' },
  { title: 'Details', key: 'details' },
  { title: 'Betrag', key: 'amount', align: 'end' },
  { title: 'Gebucht von', key: 'createdBy' },
]

const invoiceHeaders: any = [
  { title: 'Rechnungsnummer', key: 'invoiceNumber' },
  { title: 'Netto', key: 'totalNet' },
  { title: 'Fällig am', key: 'dueDate' },
  { title: 'Status', key: 'status' },
  { title: 'Aktion', key: 'actions', align: 'end' }
]

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (Number(item.article.price) * item.quantity), 0)
})

async function load() {
  try {
    const [acc, arts, invs, hData, qData] = await Promise.all([
      cashRegisterApi.getAccountMe(),
      articlesApi.getAll(),
      cashRegisterApi.getMyInvoices(),
      hoursApi.getMyEntries(currentYear),
      hoursApi.getQuota(currentYear)
    ])
    account.value = acc
    articles.value = arts
    invoices.value = invs
    hoursStats.value = hData.stats
    requiredHours.value = (qData as any)?.requiredHours || 0
  } catch (e) {
    console.error('Failed to load dashboard data', e)
  }
}

function downloadPdf(id: string) {
  cashRegisterApi.downloadInvoicePdf(id)
}

function addToCart(article: Article) {
  if (!account.value) return
  const existing = cart.value.find(c => c.article.id === article.id)
  if (existing) existing.quantity++
  else cart.value.push({ article, quantity: 1 })
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

const checkingOut = ref(false)
async function checkout() {
  if (cart.value.length === 0 || !account.value) return
  checkingOut.value = true
  try {
    await cashRegisterApi.createTransaction({
      accountId: account.value.id,
      items: cart.value.map(c => ({ articleId: c.article.id, quantity: c.quantity }))
    })
    cart.value = []
    await load() // Refresh balance and transaction log
  } catch(e: any) {
    alert(e.response?.data?.message || 'Fehler bei der Buchung')
  }
  checkingOut.value = false
}

onMounted(() => load())
</script>
