<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <div class="d-flex align-center flex-shrink-0 mr-4 ml-3">
        <v-tooltip
          :text="configStore.clubName"
          location="bottom"
          :open-delay="800"
        >
          <template #activator="{ props }">
            <v-img 
              v-bind="props"
               :src="configStore.clubLogoUrl" 
              alt="Logo" 
              width="32" 
              height="32" 
              class="mr-2 rounded-sm" 
              style="cursor: pointer"
              contain
              @click="router.push('/dashboard')"
            />
          </template>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>
      
      <!-- Mein Bereich - Centered -->
      <div class="d-flex align-end h-100 mr-2">
        <v-btn v-if="authStore.isAuthenticated" to="/dashboard" prepend-icon="mdi-silverware" variant="flat" class="nav-tab ml-1">
          {{ t('nav.dashboard') }}
          <v-tooltip activator="parent" location="bottom">Persönliches Verzehr-Dashboard</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated && authStore.hasRole(['VORSTAND', 'MITARBEITER'])" to="/pos" prepend-icon="mdi-cash-register" variant="flat" class="nav-tab ml-1">
          {{ t('nav.pos') }}
          <v-tooltip activator="parent" location="bottom">{{ t('nav.posHint') }}</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated" to="/hours" prepend-icon="mdi-clock-outline" variant="flat" class="nav-tab ml-1">
          {{ t('nav.hours') }}
          <v-tooltip activator="parent" location="bottom">{{ t('nav.hoursHint') }}</v-tooltip>
        </v-btn>
        <v-btn v-if="authStore.isAuthenticated" to="/my-finance" prepend-icon="mdi-wallet-outline" variant="flat" class="nav-tab ml-1">
          {{ t('nav.finance') }}
          <v-tooltip activator="parent" location="bottom">{{ t('nav.financeHint') }}</v-tooltip>
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
              {{ t('nav.admin') }}
              <v-tooltip activator="parent" location="bottom">{{ t('nav.adminHint') }}</v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact" nav min-width="220">
            <v-list-item to="/members" prepend-icon="mdi-account-group" :title="t('nav.members')"></v-list-item>
            <v-list-item to="/articles" prepend-icon="mdi-package-variant" :title="t('nav.articles')"></v-list-item>
            
            <template v-if="authStore.hasRole(['VORSTAND'])">
              <v-divider class="my-1"></v-divider>
              <v-list-item to="/billing" prepend-icon="mdi-account-cash" :title="t('nav.clubCash')"></v-list-item>
              <v-list-item to="/cashbox" prepend-icon="mdi-cash-register" :title="t('nav.accounting')"></v-list-item>
              <v-list-item to="/admin/devices" prepend-icon="mdi-tablet-cellphone" :title="t('nav.devices')"></v-list-item>
              <v-list-item v-if="authStore.hasRole(['VORSTAND', 'ADMIN'])" to="/inbox" prepend-icon="mdi-inbox-multiple-outline">
                <template #title>
                  {{ t('nav.inbox') }}
                  <v-chip v-if="inboxCount?.total" size="x-small" color="error" class="ml-1" variant="flat">{{ inboxCount.total }}</v-chip>
                </template>
              </v-list-item>
              <v-divider class="my-1"></v-divider>
              <v-list-item to="/admin/settings" prepend-icon="mdi-cog-outline" :title="t('admin.navSettings')"></v-list-item>
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
            class="mr-4"
          >
            <v-btn
              v-bind="props"
              variant="tonal"
              rounded="pill"
              class="px-2 ml-2 bg-surface-variant"
            >
              <v-icon :color="deviceStore.isAuthorized ? 'success' : undefined" start>{{ deviceStore.isAuthorized ? 'mdi-shield-check' : 'mdi-account-circle' }}</v-icon>
              <span class="text-none font-weight-bold">{{ userFullName }}</span>
              <v-icon end size="small">mdi-chevron-down</v-icon>
            </v-btn>
          </v-badge>
        </template>
        
        <v-list density="compact" nav min-width="200">
          <v-list-item to="/profile" prepend-icon="mdi-account-outline" :title="t('ui.profile')">
            <template #append>
              <v-badge
                v-if="authStore.inboxStatus?.openFeedback"
                :content="authStore.inboxStatus.openFeedback"
                color="error"
                inline
              ></v-badge>
            </template>
          </v-list-item>
          <v-list-item v-if="!deviceStore.isAuthorized" to="/activate-device" prepend-icon="mdi-tablet-cellphone" :title="t('ui.authorizeDevice')" color="primary"></v-list-item>
          <v-list-item to="/help" prepend-icon="mdi-help-circle-outline" :title="t('ui.help')"></v-list-item>
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
            :title="t('ui.themeContrast')"
            :active="theme.global.name.value === 'highContrastTheme'"
          ></v-list-item>
          <v-divider class="my-1"></v-divider>
          <v-list-subheader class="text-overline px-4">{{ t('ui.language') }}</v-list-subheader>
          <v-list-item 
            @click="setLanguage('de')" 
            :active="locale === 'de'"
            title="Deutsch"
          >
            <template #prepend>
              <span class="mr-2" style="font-size: 1.2rem; line-height: 1">🇩🇪</span>
            </template>
          </v-list-item>
          <v-list-item 
            @click="setLanguage('en')" 
            :active="locale === 'en'"
            title="English"
          >
            <template #prepend>
              <span class="mr-2" style="font-size: 1.2rem; line-height: 1">🇬🇧</span>
            </template>
          </v-list-item>
          <v-divider class="my-1"></v-divider>
          <v-list-item @click="logout" prepend-icon="mdi-logout" :title="t('ui.logout')" color="error"></v-list-item>
        </v-list>
      </v-menu>
      
      <!-- Theme Selector for Guests (Issue #16) -->
      <v-menu v-if="!authStore.isAuthenticated" offset="5">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            class="ml-2"
          >
            <v-icon>{{ currentThemeIcon }}</v-icon>
            <v-tooltip activator="parent" location="bottom">{{ t('ui.design') }}</v-tooltip>
          </v-btn>
        </template>
        <v-list density="compact" nav min-width="200">
          <v-list-subheader class="text-overline px-4">{{ t('ui.design') }}</v-list-subheader>
          <v-list-item 
            @click="setTheme('vereinTheme')" 
            prepend-icon="mdi-weather-sunny" 
            :title="t('ui.themeLight')"
            :active="theme.global.name.value === 'vereinTheme'"
          ></v-list-item>
          <v-list-item 
            @click="setTheme('vereinDarkTheme')" 
            prepend-icon="mdi-weather-night" 
            :title="t('ui.themeDark')"
            :active="theme.global.name.value === 'vereinDarkTheme'"
          ></v-list-item>
          <v-list-item 
            @click="setTheme('highContrastTheme')" 
            prepend-icon="mdi-contrast-circle" 
            :title="t('ui.themeContrast')"
            :active="theme.global.name.value === 'highContrastTheme'"
          ></v-list-item>
        </v-list>
      </v-menu>

      <!-- Universal Language Selector (Guest Only) -->
      <v-menu v-if="!authStore.isAuthenticated" offset="5">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="ml-2 mr-4"
            min-width="48"
          >
            <span style="font-size: 1.4rem">{{ currentLocaleFlag }}</span>
            <v-tooltip activator="parent" location="bottom">{{ t('ui.language') }}</v-tooltip>
          </v-btn>
        </template>
        <v-list density="compact" nav min-width="150">
          <v-list-subheader class="text-overline px-4">{{ t('ui.language') }}</v-list-subheader>
          <v-list-item 
            @click="setLanguage('de')" 
            :active="locale === 'de'"
            title="Deutsch"
          >
            <template #prepend>
              <span class="mr-2" style="font-size: 1.2rem">🇩🇪</span>
            </template>
          </v-list-item>
          <v-list-item 
            @click="setLanguage('en')" 
            :active="locale === 'en'"
            title="English"
          >
            <template #prepend>
              <span class="mr-2" style="font-size: 1.2rem">🇬🇧</span>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
      <RfidEmulator v-if="isDev && rfidEmulatorEnabled" />
      <AboutDialog v-model="aboutDialog" :backend-version="backendVersion" />
      <GlobalConfirmDialog />
    </v-main>

    <v-footer app border class="bg-surface py-1 px-4 text-caption text-grey">
      <div class="d-flex w-100 justify-space-between align-center">
        <div class="d-flex align-center">
          <v-btn icon size="x-small" variant="text" class="mr-1" @click="aboutDialog = true">
            <v-icon size="small">mdi-information-outline</v-icon>
          </v-btn>
          <div class="mr-4">created with a vibe of Metal by <span class="text-primary font-weight-bold">Michael Backhaus</span></div>
          
          <!-- Device Status Pill -->
          <v-chip
            v-if="deviceStore.isAuthorized"
            size="x-small"
            color="success"
            variant="tonal"
            prepend-icon="mdi-shield-check"
            class="font-weight-bold"
          >
            {{ t('ui.deviceAuthorized') }}: {{ deviceStore.deviceName }}
          </v-chip>
          <v-chip
            v-else-if="deviceStore.isBootstrapMode"
            size="x-small"
            color="warning"
            variant="elevated"
            prepend-icon="mdi-shield-alert-outline"
            class="font-weight-bold"
            to="/admin/devices"
          >
            {{ t('ui.deviceBootstrap') }}
          </v-chip>
          <v-chip
            v-else
            size="x-small"
            color="grey"
            variant="tonal"
            prepend-icon="mdi-shield-off-outline"
            class="font-weight-bold"
          >
            {{ t('ui.deviceUnauthorized') }}
          </v-chip>
        </div>
        <div v-if="authStore.isAuthenticated" class="d-flex align-center">
          <v-icon size="small" class="mr-1">mdi-account-outline</v-icon>
          <span class="mr-3">{{ userFullName }}</span>
          
          <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
          <span class="mr-3">Login: {{ authStore.user?.lastLoginAt ? new Date(authStore.user.lastLoginAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US') : 'Jetzt' }}</span>
          
          <v-divider vertical class="mx-3"></v-divider>

          <!-- Session Countdown -->
          <div class="d-flex align-center" :class="secondsRemaining < 60 ? 'text-error font-weight-bold animate-pulse' : ''">
            <v-icon size="x-small" class="mr-1" :color="isUserActive ? 'success' : 'grey'">
              {{ isUserActive ? 'mdi-account-check' : 'mdi-account-sleep' }}
            </v-icon>
            <span style="font-size: 0.75rem">
              {{ t('auth.sessionExpires', { time: timeDisplay }) }}
            </span>
            <v-tooltip activator="parent" location="top">
              {{ isUserActive ? t('auth.active') : t('auth.inactive') }}
            </v-tooltip>
          </div>
        </div>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { computed, onMounted, ref, onUnmounted, watch } from 'vue'
import { useAuthStore } from './stores/auth.store'
import { useDeviceStore } from './stores/device.store'
import { useRouter, useRoute } from 'vue-router'
import { api } from './api/axios'
import { useSystemConfigStore } from './stores/system-config.store'
import { useI18n } from 'vue-i18n'
import RfidEmulator from './components/dev/RfidEmulator.vue'
import AboutDialog from './components/AboutDialog.vue'
import GlobalConfirmDialog from './components/GlobalConfirmDialog.vue'

const { t, locale } = useI18n()

const theme = useTheme()
const authStore = useAuthStore()
const deviceStore = useDeviceStore()
const configStore = useSystemConfigStore()
const router = useRouter()
const route = useRoute()

// Session & Activity Management
const currentTime = ref(Date.now())
const secondsRemaining = computed(() => {
  if (!authStore.isAuthenticated || !authStore.expiresAt) return 0
  return Math.max(0, Math.floor((authStore.expiresAt - currentTime.value) / 1000))
})

const timeDisplay = computed(() => {
  const m = Math.floor(secondsRemaining.value / 60)
  const s = secondsRemaining.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const isUserActive = computed(() => {
  // Active if interaction in the last 60 seconds
  return (currentTime.value - authStore.lastActivity) < 60000
})

function updateActivity() {
  authStore.lastActivity = Date.now()
}

const adminRoutes = [
  '/members',
  '/articles',
  '/billing',
  '/cashbox',
  '/hours-management',
  '/inbox',
  '/admin/devices',
  '/admin/settings'
]
const isAdminActive = computed(() => adminRoutes.some(r => route.path.startsWith(r)))

const aboutDialog = ref(false)
const backendVersion = ref<string | null>(null)

async function fetchBackendVersion() {
  try {
    const res = await api.get('/version')
    backendVersion.value = res.data
  } catch (e) {
    console.warn('Could not fetch backend version', e)
  }
}

const currentThemeIcon = computed(() => {
  if (theme.global.name.value === 'vereinTheme') return 'mdi-weather-sunny'
  if (theme.global.name.value === 'vereinDarkTheme') return 'mdi-weather-night'
  return 'mdi-contrast-circle'
})

const currentLocaleFlag = computed(() => {
  return locale.value === 'de' ? '🇩🇪' : '🇬🇧'
})

const userFullName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  return u?.username || ''
})

// User Actions
function setTheme(name: string) {
  theme.global.name.value = name
  localStorage.setItem('theme-mode', name)
}

function setLanguage(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Global Polling & Status Sync
const inboxCount = ref<{ pendingChanges: number, openFeedback: number, total: number } | null>(null)
const hasPendingItems = computed(() => !!inboxCount.value?.total)
let pollingInterval: any = null
let sessionInterval: any = null

async function refreshAllStatus() {
  if (!authStore.isAuthenticated) {
    deviceStore.fetchStatus()
    return
  }
  
  if (authStore.hasRole(['VORSTAND'])) {
    try {
      const res = await api.get('/members/inbox-status/count')
      inboxCount.value = res.data
    } catch (e: any) {
      const isHardwareError = e.response?.data?.message?.includes('autorisierten Club-Geräten') || 
                              e.response?.data?.message?.includes('nicht (mehr) für sensible Funktionen autorisiert');
      if (!isHardwareError) console.warn('Could not fetch board inbox status', e)
    }
  }
  authStore.fetchInboxStatus()
  deviceStore.fetchStatus()
}

onMounted(() => {
  // Initial Theme Load
  const saved = localStorage.getItem('theme-mode')
  if (saved && ['vereinTheme', 'vereinDarkTheme', 'highContrastTheme'].includes(saved)) {
    theme.global.name.value = saved
  }

  refreshAllStatus()
  fetchBackendVersion()
  configStore.fetchPublicConfig()
  
  // Buffers
  pollingInterval = setInterval(refreshAllStatus, 60000)
  sessionInterval = setInterval(async () => {
    currentTime.value = Date.now()
    if (authStore.isAuthenticated) {
      if (secondsRemaining.value < 300 && secondsRemaining.value > 0 && isUserActive.value) {
        await authStore.refreshAccessToken()
      }
      if (secondsRemaining.value <= 0) logout()
    }
  }, 1000)

  // Listeners
  window.addEventListener('mousemove', updateActivity)
  window.addEventListener('keydown', updateActivity)
  window.addEventListener('click', updateActivity)
  window.addEventListener('scroll', updateActivity)
  window.addEventListener('app:refresh-status', refreshAllStatus)
  window.addEventListener('storage', () => {
    rfidEmulatorEnabled.value = localStorage.getItem('dev-rfid-enabled') !== 'false'
  })
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
  if (sessionInterval) clearInterval(sessionInterval)
  window.removeEventListener('mousemove', updateActivity)
  window.removeEventListener('keydown', updateActivity)
  window.removeEventListener('click', updateActivity)
  window.removeEventListener('scroll', updateActivity)
  window.removeEventListener('app:refresh-status', refreshAllStatus)
})

// Dev RFID Emulator logic
const isDev = import.meta.env.DEV
const rfidEmulatorEnabled = ref(localStorage.getItem('dev-rfid-enabled') !== 'false')

// Watch for login to trigger initial refresh
watch(() => authStore.isAuthenticated, (val: boolean) => {
  if (val) refreshAllStatus()
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

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
