<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Kassensystem (POS)</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Left side: Select Member/Account & Cart -->
      <v-col cols="12" md="4">
        <v-btn-toggle v-model="checkoutMode" mandatory color="primary" class="w-100 mb-4" density="compact">
          <v-btn value="MEMBER" class="flex-grow-1">Mitglieder</v-btn>
          <v-btn value="GUEST" class="flex-grow-1">Gäste</v-btn>
        </v-btn-toggle>

        <v-card class="mb-4">
          <v-card-title class="bg-primary text-white">1. {{ checkoutMode === 'MEMBER' ? 'Konto' : 'Gast-Slot' }} wählen</v-card-title>
          <v-card-text class="pt-4">
            <v-autocomplete
              v-if="checkoutMode === 'MEMBER'"
              v-model="selectedAccountId"
              :items="accountOptions"
              item-title="title"
              item-value="id"
              label="Mitglied suchen..."
              variant="outlined"
              prepend-inner-icon="mdi-account-search"
            ></v-autocomplete>
            
            <v-autocomplete
              v-if="checkoutMode === 'GUEST'"
              v-model="selectedSlotId"
              :items="guestOptions"
              item-title="title"
              item-value="id"
              label="Gast-Slot wählen..."
              variant="outlined"
              prepend-inner-icon="mdi-human-greeting"
            ></v-autocomplete>
          </v-card-text>
        </v-card>
        
        <v-card v-if="(checkoutMode === 'MEMBER' && selectedAccountId) || (checkoutMode === 'GUEST' && selectedSlotId)">
          <v-card-title class="bg-primary text-white">2. Warenkorb</v-card-title>
          <v-list density="compact" class="pt-0 pb-0">
            <v-list-item v-for="(item, i) in cart" :key="i">
              <v-list-item-title class="font-weight-bold">{{ item.article.name }}</v-list-item-title>
              <template #append>
                <div class="d-flex align-center">
                  <span class="mr-4 text-primary">{{ item.quantity }}x</span>
                  <span class="mr-2">{{ (item.article.price * item.quantity).toFixed(2) }}€</span>
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeFromCart(i)"></v-btn>
                </div>
              </template>
            </v-list-item>
            <v-list-item v-if="cart.length === 0">
              <v-alert type="info" variant="tonal" class="mt-2 text-center">Warenkorb ist leer.</v-alert>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <v-card-text class="d-flex justify-space-between text-h6 font-weight-bold bg-surface-variant">
            <span>Summe:</span>
            <span>{{ cartTotal.toFixed(2) }}€</span>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 bg-surface-variant">
            <v-btn color="success" block size="large" variant="flat" @click="triggerCheckout" :loading="checkingOut" :disabled="cart.length === 0">
              Kaufen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Right side: Articles Grid -->
      <v-col cols="12" md="8">
        <v-card class="fill-height pb-4">
          <v-card-title class="bg-surface-variant d-flex align-center flex-wrap">
            <span>Artikel</span>
            <v-spacer></v-spacer>
            <v-chip-group v-model="selectedCategory" selected-class="text-primary" filter mandatory>
              <v-chip v-for="cat in categories" :key="cat" :value="cat" variant="tonal" size="small">{{ cat }}</v-chip>
            </v-chip-group>
          </v-card-title>
          <v-card-text class="pt-4 overflow-y-auto">
            <v-row>
              <v-col v-for="article in filteredArticles" :key="article.id" cols="6" sm="4" md="3">
                <v-card @click="addToCart(article)" hover class="text-center pa-4" :disabled="!(selectedAccountId || selectedSlotId)">
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const selectedAccountId = ref<string | null>(null)
const selectedSlotId = ref<string | null>(null)
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
    .filter(s => s.isActive)
    .map(s => ({ id: s.id, title: s.displayName || `Slot ${s.slotNumber}` }))
})

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (Number(item.article.price) * item.quantity), 0)
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
    selectedSlotId.value = null
    await loadData() // Refresh freed/taken slots
  } catch (e: any) {
    alert(e.response?.data?.message || 'Buchung fehlgeschlagen')
  }
  checkingOut.value = false
}

onMounted(() => loadData())
</script>
