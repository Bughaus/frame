<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <div class="d-flex align-center flex-shrink-0 mr-4 ml-3">
        <v-tooltip
          text="F.R.A.M.E. - Financials, Records, Activity, and Member Expenses"
          location="bottom"
          :open-delay="800"
        >
          <template #activator="{ props }">
            <v-img 
              v-bind="props"
              src="/logo.png" 
              alt="Logo" 
              width="32" 
              height="32" 
              class="mr-2 rounded-sm" 
              style="cursor: pointer"
              @click="router.push('/dashboard')"
            />
          </template>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>
      
      <!-- Mein Bereich - Centered -->
      <div class="d-flex align-end h-100 mr-2">
        <v-btn v-if="authStore.isAuthenticated" to="/dashboard" prepend-icon="mdi-silverware" variant="flat" class="nav-tab ml-1">
          Verzehr
          <v-tooltip activator="parent" location="bottom">Persönliches Verzehr-Dashboard</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated" to="/pos" prepend-icon="mdi-cash-register" variant="flat" class="nav-tab ml-1">
          Event Kasse
          <v-tooltip activator="parent" location="bottom">Kassenoberfläche für Events & Verkauf</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated" to="/hours" prepend-icon="mdi-clock-outline" variant="flat" class="nav-tab ml-1">
          Stunden
          <v-tooltip activator="parent" location="bottom">Meine Arbeitsstunden erfassen</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated" to="/my-finance" prepend-icon="mdi-wallet-outline" variant="flat" class="nav-tab ml-1">
          Finanzen
          <v-tooltip activator="parent" location="bottom">Mein Kontostand & Abrechnungen</v-tooltip>
        </v-btn>

        <!-- Verwaltung (Submenu) as a Tab -->
        <v-menu v-if="authStore.isAuthenticated && authStore.hasRole(['VORSTAND', 'MITARBEITER'])" offset="5">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="flat"
              class="nav-tab ml-1 px-2"
              :class="{ 'v-btn--active': isAdminActive }"
              append-icon="mdi-chevron-down"
            >
              <template #prepend>
                <v-badge 
                  :content="inboxCount?.total" 
                  :model-value="hasPendingItems" 
                  color="error" 
                  offset-x="-4" 
                  offset-y="-4"
                >
                  <v-icon>mdi-cog-outline</v-icon>
                </v-badge>
              </template>
              Verwaltung
              <v-tooltip activator="parent" location="bottom">Administration & Verwaltung</v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact" nav min-width="220">
            <v-list-item to="/members" prepend-icon="mdi-account-group" title="Mitglieder"></v-list-item>
            <v-list-item to="/articles" prepend-icon="mdi-package-variant" title="Artikelstamm"></v-list-item>
            
            <template v-if="authStore.hasRole(['VORSTAND'])">
              <v-divider class="my-1"></v-divider>
              <v-list-item to="/treasurer" prepend-icon="mdi-bank" title="Vereinskasse"></v-list-item>
              <v-list-item to="/accounting" prepend-icon="mdi-playlist-plus" title="Buchungen"></v-list-item>
              <v-list-item v-if="authStore.hasRole(['VORSTAND', 'ADMIN'])" to="/hours-management" prepend-icon="mdi-calendar-check" title="Events & Arbeitsdienste"></v-list-item>
              <v-list-item v-if="authStore.hasRole(['VORSTAND', 'ADMIN'])" to="/inbox" prepend-icon="mdi-inbox-multiple-outline">
                <template #title>
                  Inbox
                  <v-chip v-if="inboxCount?.total" size="x-small" color="error" class="ml-1" variant="flat">{{ inboxCount.total }}</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>
      </div>

      <v-spacer></v-spacer>
      

      <!-- User Menu Pill -->
      <v-menu v-if="authStore.isAuthenticated" offset="5">
        <template #activator="{ props }">
          <v-badge
            :model-value="!!(authStore.inboxStatus?.openFeedback)"
            color="error"
            dot
            overlap
            offset-x="8"
            offset-y="8"
          >
            <v-btn
              v-bind="props"
              variant="tonal"
              rounded="pill"
              class="px-2 ml-2 bg-surface-variant"
            >
              <v-icon start>mdi-account-circle</v-icon>
              <span class="text-none font-weight-bold">{{ userFullName }}</span>
              <v-icon end size="small">mdi-chevron-down</v-icon>
            </v-btn>
          </v-badge>
        </template>
        
        <v-list density="compact" nav min-width="200">
          <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Mein Profil">
            <template #append>
              <v-badge
                v-if="authStore.inboxStatus?.openFeedback"
                :content="authStore.inboxStatus.openFeedback"
                color="error"
                inline
              ></v-badge>
            </template>
          </v-list-item>
          <v-list-item to="/help" prepend-icon="mdi-help-circle-outline" title="Hilfe & Anleitungen"></v-list-item>
          <v-divider class="my-1"></v-divider>
          
          <v-list-subheader class="text-overline px-4">Design</v-list-subheader>
          <v-list-item 
            @click="setTheme('vereinTheme')" 
            prepend-icon="mdi-weather-sunny" 
            title="Helles Design"
            :active="theme.global.name.value === 'vereinTheme'"
          ></v-list-item>
          <v-list-item 
            @click="setTheme('vereinDarkTheme')" 
            prepend-icon="mdi-weather-night" 
            title="Dunkles Design"
            :active="theme.global.name.value === 'vereinDarkTheme'"
          ></v-list-item>
          <v-list-item 
            @click="setTheme('highContrastTheme')" 
            prepend-icon="mdi-contrast-circle" 
            title="Barrierefrei (Hochkontrast)"
            :active="theme.global.name.value === 'highContrastTheme'"
          ></v-list-item>
          <v-divider class="my-1"></v-divider>
          <v-list-item @click="logout" prepend-icon="mdi-logout" title="Abmelden" color="error"></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
      <RfidEmulator v-if="isDev && rfidEmulatorEnabled" />
      <AboutDialog v-model="aboutDialog" />
    </v-main>

    <v-footer app border class="bg-surface py-1 px-4 text-caption text-grey">
      <div class="d-flex w-100 justify-space-between align-center">
        <div class="d-flex align-center">
          <v-btn icon size="x-small" variant="text" class="mr-2" @click="aboutDialog = true">
            <v-icon size="small">mdi-information-outline</v-icon>
          </v-btn>
          <div>created with a vibe of Metal by <span class="text-primary font-weight-bold">Michael Backhaus</span></div>
        </div>
        <div v-if="authStore.isAuthenticated" class="d-flex align-center">
          <v-icon size="small" class="mr-1">mdi-account-outline</v-icon>
          <span class="mr-3">{{ userFullName }}</span>
          
          <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
          <span class="mr-3">Login: {{ authStore.user?.lastLoginAt ? new Date(authStore.user.lastLoginAt).toLocaleString('de-DE') : 'Jetzt' }}</span>
          
          <v-divider vertical class="mx-3"></v-divider>
          <span class="font-weight-bold">v{{ appVersion }}</span>
        </div>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { computed, onMounted, ref, onUnmounted, watch } from 'vue'
import { useAuthStore } from './stores/auth.store'
import { useRouter, useRoute } from 'vue-router'
import { api } from './api/axios'
import RfidEmulator from './components/dev/RfidEmulator.vue'
import AboutDialog from './components/AboutDialog.vue'

const theme = useTheme()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const adminRoutes = [
  '/members',
  '/articles',
  '/treasurer',
  '/accounting',
  '/hours-management',
  '/inbox'
]
const isAdminActive = computed(() => adminRoutes.some(r => route.path.startsWith(r)))

declare const __APP_VERSION__: string
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'

const aboutDialog = ref(false)

const userFullName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  return u?.username || ''
})

onMounted(() => {
  const saved = localStorage.getItem('theme-mode')
  if (saved && ['vereinTheme', 'vereinDarkTheme', 'highContrastTheme'].includes(saved)) {
    theme.global.name.value = saved
  }
})

function setTheme(name: string) {
  theme.global.name.value = name
  localStorage.setItem('theme-mode', name)
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Global Polling & Status Sync
const inboxCount = ref<{ pendingChanges: number, openFeedback: number, total: number } | null>(null)
const hasPendingItems = computed(() => !!inboxCount.value?.total)
let pollingInterval: any = null

async function refreshAllStatus() {
  if (!authStore.isAuthenticated) return
  
  // 1. Board Status (if applicable)
  if (authStore.hasRole(['VORSTAND'])) {
    try {
      const res = await api.get('/members/inbox-status/count')
      inboxCount.value = res.data
    } catch (e) {
      console.warn('Could not fetch board inbox status')
    }
  }

  // 2. Member Inbox Status
  authStore.fetchInboxStatus()
}

onMounted(() => {
  refreshAllStatus()
  pollingInterval = setInterval(refreshAllStatus, 60000) // Poll every 1 minute
  
  // Listen for global refresh requests
  window.addEventListener('app:refresh-status', refreshAllStatus)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
  window.removeEventListener('app:refresh-status', refreshAllStatus)
})

// Watch for login to trigger initial refresh
watch(() => authStore.isAuthenticated, (val: boolean) => {
  if (val) refreshAllStatus()
})

// Dev RFID Emulator logic
const isDev = import.meta.env.DEV
const rfidEmulatorEnabled = ref(localStorage.getItem('dev-rfid-enabled') !== 'false')

onMounted(() => {
  window.addEventListener('storage', () => {
    rfidEmulatorEnabled.value = localStorage.getItem('dev-rfid-enabled') !== 'false'
  })
})
</script>

<style scoped>
.nav-tab {
  height: 48px !important;
  border-radius: 8px 8px 0 0 !important;
  margin-bottom: 0 !important;
  box-shadow: none !important;
  text-transform: none !important;
  font-weight: 600 !important;
  background-color: transparent !important;
  color: rgba(var(--v-theme-on-primary), 0.7) !important;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.nav-tab.v-btn--active {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

.theme--vereinDarkTheme .nav-tab.v-btn--active {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: white !important;
}
</style>
