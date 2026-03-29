<template>
  <v-container fluid class="fill-height pa-4 d-flex flex-column overflow-hidden" style="height: calc(100vh - 48px - 36px); max-height: calc(100vh - 48px - 36px);">
    
    <v-row v-if="account" class="flex-grow-1 overflow-hidden w-100 ma-0" justify="start">
      <!-- Left side: Balance & Cart -->
      <v-col cols="12" md="4" class="d-flex flex-column fill-height pb-2">
        <v-card class="mb-4 elevation-2 flex-shrink-0">
          <v-card-title class="bg-primary text-white py-2 text-subtitle-1">Mein Kontostand</v-card-title>
          <v-card-text class="pt-4 pb-2 text-center">
            <div class="text-h4 font-weight-black" :class="Number(account.balance) < 0 ? 'text-error' : 'text-success'">
              {{ Number(account.balance).toFixed(2) }}€
            </div>
            <div class="text-caption text-grey mt-1">Guthaben / Offener Deckel</div>
          </v-card-text>
        </v-card>

        <v-card class="elevation-2 d-flex flex-column flex-grow-1 overflow-hidden mb-2">
          <v-card-title class="bg-primary text-white py-2 text-subtitle-1">Mein Warenkorb</v-card-title>
          <v-list density="compact" class="pt-0 pb-0 bg-transparent flex-grow-1 overflow-y-scroll">
            <v-list-item v-for="(item, i) in cart" :key="i">
              <v-list-item-title class="font-weight-bold text-body-2">{{ item.article.name }}</v-list-item-title>
              <template #append>
                <div class="d-flex align-center">
                  <span class="mr-2 text-primary text-body-2 font-weight-bold">{{ item.quantity }}x</span>
                  <span class="mr-1 text-body-2">{{ (Number(item.article.price) * item.quantity).toFixed(2) }}€</span>
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeFromCart(i)"></v-btn>
                </div>
              </template>
            </v-list-item>
            <v-list-item v-if="cart.length === 0">
              <v-alert type="info" variant="tonal" class="mt-2 text-center py-2" density="compact">Warenkorb leer.</v-alert>
            </v-list-item>
          </v-list>
          
          <v-divider></v-divider>
          <div class="bg-surface-variant flex-shrink-0" style="height: 104px;">
            <v-card-text class="d-flex justify-space-between align-center text-h6 font-weight-bold py-2">
              <span>Total:</span>
              <span>{{ cartTotal.toFixed(2) }}€</span>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-btn color="success" block size="large" variant="flat" elevation="2" @click="checkout" :loading="checkingOut" :disabled="cart.length === 0">
                Jetzt Buchen
              </v-btn>
            </v-card-actions>
          </div>
        </v-card>
      </v-col>

      <!-- Right side: Articles Grid -->
      <v-col cols="12" md="8" class="d-flex flex-column fill-height pb-2">
        <v-card class="d-flex flex-column fill-height mb-0 elevation-2">
          <v-card-title class="bg-surface-variant d-flex align-center flex-wrap py-1 flex-shrink-0">
            <span class="text-subtitle-1 font-weight-bold mr-4">Artikel Auswahl</span>
            <v-chip-group v-model="selectedCategory" selected-class="text-primary" filter mandatory size="small">
              <v-chip v-for="cat in categories" :key="cat" :value="cat" variant="tonal" size="small" class="mr-1">{{ cat }}</v-chip>
            </v-chip-group>
          </v-card-title>
          <v-card-text class="pt-4 overflow-y-scroll flex-grow-1 px-4" style="scrollbar-gutter: stable;">
            <v-row dense class="w-100">
              <v-col v-for="article in filteredArticles" :key="article.id" cols="6" sm="4" md="3" lg="3">
                <v-card @click="addToCart(article)" hover class="text-center pa-2 article-card h-100 d-flex flex-column" elevation="1" variant="outlined">
                  <v-avatar size="56" class="mx-auto mb-1" rounded="lg">
                    <v-img v-if="article.imageUrl" :src="getImageUrl(article.imageUrl)" cover></v-img>
                    <v-icon v-else size="32" color="primary">mdi-food-apple</v-icon>
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
    
    <v-row v-else>
      <v-col cols="12" class="text-center mt-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4 text-h6 text-grey">Lade Kontodaten...</div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">Feedback erfolgreich gesendet!</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { articlesApi, cashRegisterApi, type Article } from '../api/cash-register'
import { api } from '../api/axios'

const account = ref<any>(null)
const articles = ref<Article[]>([])
const invoices = ref<any[]>([])
const selectedCategory = ref('Alle')

const snackbar = ref(false)

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

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (Number(item.article.price) * item.quantity), 0)
})

async function load() {
  try {
    const [acc, arts, invs] = await Promise.all([
      cashRegisterApi.getAccountMe(),
      articlesApi.getAll(),
      cashRegisterApi.getMyInvoices()
    ])
    account.value = acc
    articles.value = arts
    invoices.value = invs
  } catch (e) {
    console.error('Failed to load dashboard data', e)
  }
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
    await load() // Refresh balance
  } catch(e: any) {
    alert(e.response?.data?.message || 'Fehler bei der Buchung')
  }
  checkingOut.value = false
}

function getImageUrl(path: string | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '')
  return `${baseURL}${path}`
}

onMounted(() => load())
</script>
