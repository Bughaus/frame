<template>
  <v-container fluid class="fill-height pa-4 d-flex flex-column overflow-hidden" style="height: calc(100vh - 48px - 36px); max-height: calc(100vh - 48px - 36px);">

    <v-row class="flex-grow-1 overflow-hidden w-100 ma-0" justify="start">
      <!-- Left side: Select Member/Account & Cart -->
      <v-col cols="12" md="4" class="d-flex flex-column fill-height pb-2">
        <v-btn-toggle v-model="checkoutMode" mandatory color="primary" class="w-100 mb-4 flex-shrink-0" density="compact">
          <v-btn value="MEMBER" class="flex-grow-1">Mitglieder</v-btn>
          <v-btn value="GUEST" class="flex-grow-1">Gäste</v-btn>
        </v-btn-toggle>

        <v-card class="mb-4 flex-shrink-0">
          <v-card-title class="bg-primary text-white py-2 text-subtitle-1">1. {{ checkoutMode === 'MEMBER' ? 'Konto' : 'Gast-Slot' }} wählen</v-card-title>
          <v-card-text class="pt-4 pb-2">
            <v-autocomplete
              v-if="checkoutMode === 'MEMBER'"
              v-model="selectedAccountId"
              :items="accountOptions"
              item-title="title"
              item-value="id"
              label="Mitglied suchen..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account-search"
              hide-details
            ></v-autocomplete>
            
            <v-autocomplete
              v-if="checkoutMode === 'GUEST'"
              v-model="selectedSlotId"
              :items="guestOptions"
              item-title="title"
              item-value="id"
              label="Gast-Slot wählen..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-human-greeting"
              hide-details
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :title="item.title">
                  <template #append>
                    <v-chip size="x-small" :color="item.raw.isActive ? 'success' : 'warning'" variant="flat">
                      {{ item.raw.isActive ? 'Frei' : 'Belegt' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Guest Name Edit and Current Balance -->
            <div v-if="checkoutMode === 'GUEST' && selectedSlot" class="mt-2 pa-2 border-sm rounded-lg bg-surface-variant">
              <v-text-field
                v-model="guestDisplayName"
                label="Gast Name / Info"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-pencil"
                @update:model-value="updateGuestName"
                class="mb-2"
              ></v-text-field>
              
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Aktueller Deckel:</span>
                <span class="text-subtitle-1 font-weight-bold" :class="selectedSlot.balance > 0 ? 'text-primary' : ''">
                  {{ (Number(selectedSlot.balance) || 0).toFixed(2) }}€
                </span>
              </div>

              <!-- Itemized Details for Guest -->
              <div v-if="openTabItems.length > 0" class="mt-2 pt-2 border-t">
                <div class="text-caption font-weight-bold mb-1 ml-1">Details:</div>
                <div class="overflow-y-auto pr-1" style="max-height: 100px;">
                  <div v-for="item in openTabItems" :key="item.name" class="d-flex justify-space-between text-caption px-1">
                    <span>{{ item.qty }}x {{ item.name }}</span>
                    <span>{{ (item.qty * item.price).toFixed(2) }}€</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Member Account Detail Summary -->
            <div v-if="checkoutMode === 'MEMBER' && selectedAccount" class="mt-2 pa-2 border-sm rounded-lg bg-surface-variant">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Kontostand (Unfakturiert):</span>
                <span class="text-subtitle-1 font-weight-bold" :class="Number(selectedAccount.balance) < 0 ? 'text-error' : 'text-success'">
                  {{ (Number(selectedAccount.balance) || 0).toFixed(2) }}€
                </span>
              </div>
              
              <!-- Itemized Details for Member -->
              <div v-if="openTabItems.length > 0" class="mt-2 pt-2 border-t">
                <div class="text-caption font-weight-bold mb-1 ml-1">Offene Posten:</div>
                <div class="overflow-y-auto pr-1" style="max-height: 100px;">
                  <div v-for="item in openTabItems" :key="item.name" class="d-flex justify-space-between text-caption px-1">
                    <span>{{ item.qty }}x {{ item.name }}</span>
                    <span>{{ (item.qty * item.price).toFixed(2) }}€</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="d-flex flex-column flex-grow-1 overflow-hidden mb-2">
          <v-card-title class="bg-primary text-white py-2 text-subtitle-1">2. Warenkorb</v-card-title>
          <v-list density="compact" class="pt-0 pb-0 flex-grow-1 overflow-y-scroll">
            <v-list-item v-for="(item, i) in cart" :key="i">
              <v-list-item-title class="font-weight-bold text-body-2">{{ item.article.name }}</v-list-item-title>
              <template #append>
                <div class="d-flex align-center">
                  <span class="mr-2 text-primary text-body-2 font-weight-bold">{{ item.quantity }}x</span>
                  <span class="mr-1 text-body-2">{{ (item.article.price * item.quantity).toFixed(2) }}€</span>
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeFromCart(i)"></v-btn>
                </div>
              </template>
            </v-list-item>
            <v-list-item v-if="cart.length === 0">
              <v-alert type="info" variant="tonal" class="mt-2 text-center py-2" density="compact">
                {{ (!(selectedAccountId || selectedSlotId)) ? 'Konto wählen...' : 'Warenkorb leer.' }}
              </v-alert>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <div class="bg-surface-variant flex-shrink-0" style="height: 160px;">
            <v-card-text class="d-flex justify-space-between text-subtitle-1 font-weight-bold py-2 mb-1">
              <span>Summe:</span>
              <span>{{ cartTotal.toFixed(2) }}€</span>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0 flex-column">
              <v-btn color="success" block size="large" variant="flat" elevation="2" @click="triggerCheckout" :loading="checkingOut" :disabled="cart.length === 0" class="mb-2">
                Kaufen
              </v-btn>
              <v-btn 
                v-if="checkoutMode === 'GUEST' && selectedSlot && !selectedSlot.isActive" 
                color="primary" 
                block 
                size="large"
                variant="tonal"
                @click="openAbrechnenDialog"
              >
                Gast Abrechnen
              </v-btn>
            </v-card-actions>
          </div>
        </v-card>
      </v-col>

      <!-- Right side: Articles Grid -->
      <v-col cols="12" md="8" class="d-flex flex-column fill-height pb-2">
        <v-card class="d-flex flex-column fill-height mb-0">
          <v-card-title class="bg-surface-variant d-flex align-center flex-wrap py-1 flex-shrink-0">
            <span class="text-subtitle-1 font-weight-bold mr-4">Artikel Auswahl</span>
            <v-chip-group v-model="selectedCategory" selected-class="text-primary" filter mandatory size="small">
              <v-chip v-for="cat in categories" :key="cat" :value="cat" variant="tonal" size="small" class="mr-1">{{ cat }}</v-chip>
            </v-chip-group>
          </v-card-title>
          <v-card-text class="pt-4 overflow-y-scroll flex-grow-1 px-4" style="scrollbar-gutter: stable;">
            <v-row dense class="w-100">
              <v-col v-for="article in filteredArticles" :key="article.id" cols="6" sm="4" md="3" lg="3">
                <v-card @click="addToCart(article)" hover class="text-center pa-2 article-card h-100 d-flex flex-column" elevation="1" variant="outlined" :disabled="!(selectedAccountId || selectedSlotId)">
                  <v-avatar size="56" class="mx-auto mb-1" rounded="lg">
                    <v-img v-if="article.imageUrl" :src="getImageUrl(article.imageUrl)" cover></v-img>
                    <v-icon v-else size="40" color="primary">mdi-food-apple</v-icon>
                  </v-avatar>
                  <div class="text-caption font-weight-bold text-truncate w-100" :title="article.name">{{ article.name }}</div>
                  <div class="text-button font-weight-black text-primary mt-auto">{{ Number(article.price).toFixed(2) }}€</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Abrechnen Dialog -->
    <v-dialog v-model="abrechnenDialog" max-width="400px">
      <v-card>
        <v-card-title class="bg-primary text-white">Slot Abrechnen</v-card-title>
        <v-card-text class="pt-6">
          <div class="mb-4 pa-3 border rounded-lg bg-surface-variant">
            <div class="d-flex justify-space-between mb-1">
              <span>Offener Betrag:</span>
              <span class="font-weight-bold">{{ Number(selectedSlot?.balance || 0).toFixed(2) }}€</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span>Trinkgeld:</span>
              <div style="width: 100px">
                <v-text-field
                  v-model.number="abrechnenForm.tipAmount"
                  type="number"
                  suffix="€"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right font-weight-bold text-success"
                ></v-text-field>
              </div>
            </div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Gesamt:</span>
              <span>{{ (Number(selectedSlot?.balance || 0) + Number(abrechnenForm.tipAmount || 0)).toFixed(2) }}€</span>
            </div>
          </div>

          <v-select v-model="abrechnenForm.method" :items="paymentOptions" label="Zahlungsart" variant="outlined" density="compact"></v-select>
          <v-text-field v-if="abrechnenForm.method === 'PAYPAL'" v-model="abrechnenForm.paypalReference" label="PayPal Referenz (optional)" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="abrechnenDialog = false">Abbrechen</v-btn>
          <v-btn color="success" variant="flat" @click="confirmAbrechnen" :loading="checkingOut">Bestätigen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { articlesApi, type Article, cashRegisterApi } from '../../api/cash-register'
import { api } from '../../api/axios'

function getImageUrl(path: string | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '')
  return `${baseURL}${path}`
}

const checkoutMode = ref<'MEMBER'|'GUEST'>('MEMBER')
const articles = ref<Article[]>([])
const accounts = ref<any[]>([])
const guestSlots = ref<any[]>([])
const guestDisplayName = ref('')
const selectedAccountId = ref<string | null>(null)
const selectedAccount = ref<any>(null)
const selectedSlotId = ref<string | null>(null)
const selectedSlot = computed(() => guestSlots.value.find(s => s.id === selectedSlotId.value))
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

const accountOptions = computed(() => {
  return accounts.value.map(a => ({
    id: a.id,
    title: a.member ? `${a.member.firstName} ${a.member.lastName} (${a.member.memberNumber})` : 'Unbekannt'
  }))
})

const guestOptions = computed(() => {
  return guestSlots.value
    .map(s => ({ 
      id: s.id, 
      title: s.isActive ? `Slot ${s.slotNumber} (Frei)` : `[BELEGT] ${s.displayName || 'Gast'} (Slot ${s.slotNumber})`,
      isActive: s.isActive
    }))
})

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (Number(item.article.price) * item.quantity), 0)
})

const openTabItems = computed(() => {
  let txs = []
  if (checkoutMode.value === 'GUEST' && selectedSlot.value?.transactions) {
    txs = selectedSlot.value.transactions
  } else if (checkoutMode.value === 'MEMBER' && selectedAccount.value?.transactions) {
    txs = selectedAccount.value.transactions.filter((t: any) => !t.invoiceId && t.type === 'DEBIT')
  }

  const summary: Record<string, { name: string, qty: number, price: number }> = {}
  txs.forEach((t: any) => {
    if (t.items && t.items.length > 0) {
      t.items.forEach((item: any) => {
        const name = item.description || item.name || item.article?.name || 'Unbekannt'
        if (!summary[name]) {
          summary[name] = { name, qty: 0, price: Number(item.unitPrice || item.article?.price || 0) }
        }
        summary[name].qty += Number(item.qty || item.quantity || 1)
      })
    } else if (t.amount < 0) {
      const name = t.description || 'Manuelle Buchung'
      if (!summary[name]) {
        summary[name] = { name, qty: 1, price: Math.abs(Number(t.amount)) }
      } else {
        summary[name].qty += 1
      }
    }
  })

  return Object.values(summary).sort((a, b) => b.qty - a.qty)
})

async function loadData() {
  const [arts, accs, slots] = await Promise.all([
    articlesApi.getAll(),
    cashRegisterApi.getAccounts(),
    cashRegisterApi.getGuestSlots()
  ])
  articles.value = arts
  accounts.value = accs
  guestSlots.value = slots
}

function addToCart(article: Article) {
  if (checkoutMode.value === 'MEMBER' && !selectedAccountId.value) return alert('Bitte zuerst Konto wählen.')
  if (checkoutMode.value === 'GUEST' && !selectedSlotId.value) return alert('Bitte zuerst Slot wählen.')

  const existing = cart.value.find(c => c.article.id === article.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ article, quantity: 1 })
  }
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

const checkingOut = ref(false)

watch(selectedSlotId, (newId) => {
  if (newId) {
    const slot = guestSlots.value.find(s => s.id === newId)
    if (slot) {
      guestDisplayName.value = slot.displayName || `Gast ${slot.slotNumber}`
    }
  } else {
    guestDisplayName.value = ''
  }
})

watch(selectedAccountId, async (newId) => {
  if (newId) {
    try {
      selectedAccount.value = await cashRegisterApi.getAccount(newId)
    } catch (e) {
      console.error('Failed to load member details', e)
    }
  } else {
    selectedAccount.value = null
  }
})

let updateTimer: any = null
function updateGuestName() {
  if (!selectedSlotId.value) return
  if (updateTimer) clearTimeout(updateTimer)
  
  updateTimer = setTimeout(async () => {
    try {
      await api.patch(`/cash-register/guest-slots/${selectedSlotId.value}`, {
        displayName: guestDisplayName.value
      })
      // No reload needed for the name itself as it is v-modelled
      const slot = guestSlots.value.find(s => s.id === selectedSlotId.value)
      if (slot) slot.displayName = guestDisplayName.value
    } catch (e) {
      console.error('Failed to update guest name', e)
    }
  }, 800)
}

function triggerCheckout() {
  if (checkoutMode.value === 'GUEST') {
    submitGuestCheckout()
  } else {
    submitMemberCheckout()
  }
}

async function submitMemberCheckout() {
  if (!selectedAccountId.value || cart.value.length === 0) return
  checkingOut.value = true
  try {
    await cashRegisterApi.createTransaction({
      accountId: selectedAccountId.value,
      items: cart.value.map(c => ({ articleId: c.article.id, quantity: c.quantity }))
    })
    // Silent success — cart will be cleared below
    cart.value = []
    // Reload the account to refresh the 'open items' summary
    selectedAccount.value = await cashRegisterApi.getAccount(selectedAccountId.value)
    selectedAccountId.value = null
  } catch (e: any) {
    alert(e.response?.data?.message || 'Buchung fehlgeschlagen')
  }
  checkingOut.value = false
}

async function submitGuestCheckout() {
  if (!selectedSlotId.value || cart.value.length === 0) return
  checkingOut.value = true
  try {
    await cashRegisterApi.createGuestTransaction({
      slotId: selectedSlotId.value,
      items: cart.value.map(c => ({ articleId: c.article.id, quantity: c.quantity })),
      paymentMethod: 'PENDING'
    })
    // Silent success — cart will be cleared below
    cart.value = []
    // Don't deselect the slot, user might want to continue or settle
    await loadData() // Refresh freed/taken slots
  } catch (e: any) {
    alert(e.response?.data?.message || 'Buchung fehlgeschlagen')
  }
  checkingOut.value = false
}

// Settlement logic
const abrechnenDialog = ref(false)
const abrechnenForm = ref({ method: 'CASH', paypalReference: '', tipAmount: 0 })
const paymentOptions = [
  { title: 'Bar (Kasse)', value: 'CASH' },
  { title: 'PayPal (Manuell geprüft)', value: 'PAYPAL' },
]

function openAbrechnenDialog() {
  abrechnenForm.value = { method: 'CASH', paypalReference: '', tipAmount: 0 }
  abrechnenDialog.value = true
}

async function confirmAbrechnen() {
  if (!selectedSlotId.value) return
  checkingOut.value = true
  try {
    await api.post(`/cash-register/guest-slots/${selectedSlotId.value}/clear`, {
      paymentMethod: abrechnenForm.value.method,
      paypalReference: abrechnenForm.value.paypalReference,
      tipAmount: abrechnenForm.value.tipAmount
    })
    abrechnenDialog.value = false
    selectedSlotId.value = null
    await loadData()
  } catch(e) {
    alert('Fehler beim Abrechnen!')
  }
  checkingOut.value = false
}

onMounted(() => loadData())
</script>
