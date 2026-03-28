<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <div class="d-flex align-center flex-shrink-0 mr-4 ml-3">
        <v-img src="/logo.png" alt="Logo" width="32" height="32" class="mr-2 rounded-sm" />
        <v-tooltip
          text="Financials, Records, Activity, and Member Expenses"
          location="bottom"
          :open-delay="800"
        >
          <template #activator="{ props }">
            <v-app-bar-title v-bind="props" class="flex-grow-0" style="cursor: default; font-weight: 800; letter-spacing: 0.15em; font-size: 1.25rem; min-width: 100px;">
              FRAME
            </v-app-bar-title>
          </template>
        </v-tooltip>
      </div>

      <v-spacer></v-spacer>
      
      <!-- Mein Bereich -->
      <v-btn v-if="authStore.isAuthenticated" to="/dashboard" prepend-icon="mdi-monitor-dashboard" variant="text">Terminal</v-btn>
      <v-btn v-if="authStore.isAuthenticated" to="/hours" prepend-icon="mdi-clock-outline" variant="text">Stunden</v-btn>
      
      <v-divider vertical class="mx-2 my-3" v-if="authStore.isAuthenticated"></v-divider>

      <!-- Verwaltung -->
      <template v-if="authStore.isAuthenticated">
        <v-btn v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER', 'SCHATZMEISTER'])" to="/members" prepend-icon="mdi-account-group" variant="text">Mitglieder</v-btn>
        <v-btn v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER', 'SCHATZMEISTER'])" to="/pos" prepend-icon="mdi-cash-register" variant="text">Kasse</v-btn>
        <v-btn v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER', 'SCHATZMEISTER'])" to="/articles" prepend-icon="mdi-package-variant" variant="text">Artikel</v-btn>
        <v-btn v-if="authStore.hasRole(['VORSTAND', 'SCHATZMEISTER'])" to="/treasurer" prepend-icon="mdi-bank" variant="text">Finanzen</v-btn>
        <v-btn v-if="authStore.hasRole(['VORSTAND'])" to="/hours-management" prepend-icon="mdi-calendar-check" variant="text">Einsätze</v-btn>
        <v-btn v-if="authStore.hasRole(['VORSTAND', 'MITARBEITER'])" to="/change-requests" prepend-icon="mdi-clipboard-text-outline" variant="text">Anträge</v-btn>
      </template>

      <v-spacer></v-spacer>
      <v-btn icon @click="aboutDialog = true">
        <v-icon>mdi-information-outline</v-icon>
      </v-btn>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-btn v-if="authStore.isAuthenticated" to="/profile" icon><v-icon>mdi-account</v-icon></v-btn>
      <v-btn v-if="authStore.isAuthenticated" @click="logout" text>
        {{ t('auth.logout') }}
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
      <RfidEmulator />
      <AboutDialog v-model="aboutDialog" />
    </v-main>

    <v-footer app border class="bg-surface py-1 px-4 text-caption text-grey">
      <div class="d-flex w-100 justify-space-between align-center">
        <div>created with a vibe of Metal by <span class="text-primary font-weight-bold">Michael Backhaus</span></div>
        <div v-if="authStore.isAuthenticated" class="d-flex align-center">
          <v-divider vertical class="mx-3"></v-divider>
          <v-icon size="small" class="mr-1">mdi-account-circle-outline</v-icon>
          <span class="mr-3">{{ authStore.user?.username }}</span>
          
          <v-divider vertical class="mx-3"></v-divider>
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
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth.store'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import RfidEmulator from './components/dev/RfidEmulator.vue'
import AboutDialog from './components/AboutDialog.vue'

const theme = useTheme()
const authStore = useAuthStore()
const { t } = useI18n()
const router = useRouter()

declare const __APP_VERSION__: string
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'

const isDark = computed(() => theme.global.name.value === 'vereinDarkTheme')
const aboutDialog = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('theme-mode')
  if (saved) theme.global.name.value = saved
})

function toggleTheme() {
  const newTheme = isDark.value ? 'vereinTheme' : 'vereinDarkTheme'
  theme.global.name.value = newTheme
  localStorage.setItem('theme-mode', newTheme)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
