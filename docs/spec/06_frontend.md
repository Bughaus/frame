# Frontend-Architektur – VereinApp

**Version:** 0.1
**Datum:** 2026-03-27
**Framework:** Vue 3 (Composition API) + Vuetify 3

---

## 1. Technologie-Stack

| Bibliothek          | Version | Zweck                                          |
|---------------------|---------|------------------------------------------------|
| Vue 3               | ^3.4    | Frontend-Framework (Composition API)           |
| Vite                | ^5.0    | Build-Tool, Dev-Server                         |
| Vuetify             | ^3.5    | Material Design UI-Komponenten                 |
| Vue Router          | ^4.3    | Client-Side Routing, Navigation Guards         |
| Pinia               | ^2.1    | State Management                               |
| Axios               | ^1.6    | HTTP-Client mit Interceptors                   |
| vue-i18n            | ^9.9    | Internationalisierung (DE/EN)                  |
| FullCalendar        | ^6.1    | Kalenderdarstellung                            |
| vee-validate        | ^4.12   | Formularvalidierung                            |
| yup                 | ^1.3    | Validierungsschemas                            |
| Chart.js            | ^4.4    | Statistikcharts                                |
| vue-chartjs         | ^5.3    | Vue-Wrapper für Chart.js                       |
| Vitest              | ^1.4    | Unit-Tests                                     |
| Playwright          | ^1.42   | E2E-Tests                                      |

---

## 2. Projektstruktur

```
frontend/src/
├── main.ts                    # App-Initialisierung, Plugin-Registrierung
├── App.vue                    # Root-Komponente
│
├── router/
│   ├── index.ts               # Route-Definitionen
│   └── guards.ts              # Navigation Guards (Auth, Roles)
│
├── stores/                    # Pinia Stores
│   ├── auth.store.ts          # Login-State, Token-Management
│   ├── member.store.ts        # Eigenes Mitglied
│   ├── notification.store.ts  # Globale Benachrichtigungen/Snackbar
│   └── config.store.ts        # Systemkonfiguration
│
├── views/                     # Seitenkomponenten (1:1 mit Routen)
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── ChangePasswordView.vue
│   ├── DashboardView.vue
│   ├── profile/
│   │   ├── ProfileView.vue
│   │   └── ChangeRequestView.vue
│   ├── hours/
│   │   ├── HoursOverviewView.vue
│   │   └── HoursEventsView.vue
│   ├── feedback/
│   │   ├── FeedbackListView.vue
│   │   ├── FeedbackDetailView.vue
│   │   └── NewFeedbackView.vue
│   ├── documents/
│   │   └── DocumentsView.vue
│   ├── calendar/
│   │   └── CalendarView.vue
│   ├── cash-register/
│   │   ├── AccountView.vue
│   │   ├── BookingView.vue
│   │   └── InvoicesView.vue
│   └── admin/
│       ├── MembersView.vue
│       ├── UserManagementView.vue
│       ├── RfidManagementView.vue
│       ├── ImportView.vue
│       ├── DocumentManagementView.vue
│       ├── CashManagementView.vue  // Schatzmeister
│       └── SystemConfigView.vue
│
├── components/                # Wiederverwendbare Komponenten
│   ├── layout/
│   │   ├── AppShell.vue       # Nav-Drawer + App-Bar + Footer
│   │   ├── AppNavDrawer.vue
│   │   ├── AppBar.vue
│   │   └── UserMenu.vue
│   ├── common/
│   │   ├── DataTable.vue      # Wiederverwendbare Tabelle mit Paginierung
│   │   ├── ConfirmDialog.vue
│   │   ├── StatusChip.vue
│   │   ├── CurrencyDisplay.vue
│   │   └── DateDisplay.vue
│   ├── hours/
│   │   ├── HoursProgressBar.vue
│   │   └── HoursEventCard.vue
│   ├── cash-register/
│   │   ├── AccountBalance.vue
│   │   └── TransactionList.vue
│   └── rfid/
│       └── RfidInput.vue      # Verstecktes RFID-Eingabefeld
│
├── composables/               # Vue Composables (wiederverwendbare Logik)
│   ├── useAuth.ts             # Login, Logout, Token-Refresh
│   ├── useRfid.ts             # RFID-Input-Verarbeitung
│   ├── usePagination.ts       # Paginierungslogik
│   ├── useNotification.ts     # Snackbar/Toast-Nachrichten
│   ├── useApi.ts              # API-Aufrufe mit Error-Handling
│   └── useI18nDate.ts         # Lokalisierte Datumsformatierung
│
├── services/                  # API-Service-Schicht
│   ├── api.client.ts          # Axios-Instanz + Interceptors
│   ├── auth.service.ts
│   ├── member.service.ts
│   ├── hours.service.ts
│   ├── feedback.service.ts
│   ├── document.service.ts
│   ├── calendar.service.ts
│   ├── cash-register.service.ts
│   └── admin.service.ts
│
├── i18n/
│   ├── index.ts               # vue-i18n Konfiguration
│   ├── de.json                # Deutsche Übersetzungen
│   └── en.json                # Englische Übersetzungen
│
├── plugins/
│   ├── vuetify.ts             # Vuetify Konfiguration + Theme
│   └── i18n.ts                # i18n Plugin Setup
│
└── assets/
    ├── logo.svg
    └── styles/
        └── main.scss
```

---

## 3. Routing

```typescript
// router/index.ts
const routes = [
  // Öffentlich
  { path: '/login', component: LoginView, meta: { public: true } },

  // Authentifiziert (alle Rollen)
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: DashboardView },
      { path: 'profile', component: ProfileView },
      { path: 'hours', component: HoursOverviewView },
      { path: 'hours/events', component: HoursEventsView },
      { path: 'feedback', component: FeedbackListView },
      { path: 'feedback/new', component: NewFeedbackView },
      { path: 'feedback/:id', component: FeedbackDetailView },
      { path: 'documents', component: DocumentsView },
      { path: 'calendar', component: CalendarView },
      { path: 'account', component: AccountView },
      { path: 'account/book', component: BookingView },
      { path: 'account/invoices', component: InvoicesView },
    ]
  },

  // Vorstand
  {
    path: '/admin',
    component: AppShell,
    meta: { requiresAuth: true, roles: ['VORSTAND', 'ADMIN'] },
    children: [
      { path: 'members', component: MembersView },
      { path: 'feedback', component: AdminFeedbackView },
    ]
  },

  // Schatzmeister
  {
    path: '/cash',
    component: AppShell,
    meta: { requiresAuth: true, roles: ['SCHATZMEISTER', 'ADMIN'] },
    children: [
      { path: 'accounts', component: CashManagementView },
    ]
  },

  // Admin
  {
    path: '/system',
    component: AppShell,
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      { path: 'users', component: UserManagementView },
      { path: 'rfid', component: RfidManagementView },
      { path: 'import', component: ImportView },
      { path: 'config', component: SystemConfigView },
    ]
  },
]
```

---

## 4. State Management (Pinia)

### Auth Store

```typescript
// stores/auth.store.ts
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const hasRole = (role: Role) => user.value?.roles.includes(role) ?? false
  const isAdmin = computed(() => hasRole(Role.ADMIN))
  const isVorstand = computed(() => hasRole(Role.VORSTAND) || isAdmin.value)
  const isSchatzmeister = computed(() => hasRole(Role.SCHATZMEISTER) || isAdmin.value)

  async function login(credentials: LoginDto) { ... }
  async function loginWithRfid(token: string) { ... }
  async function logout() { ... }
  async function refreshToken() { ... }

  return { accessToken, user, isAuthenticated, hasRole, isAdmin, isVorstand, login, logout }
})
```

---

## 5. HTTP-Client & Token-Management

```typescript
// services/api.client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  withCredentials: true, // Für Refresh Token Cookie
})

// Request Interceptor: Access Token anhängen
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Response Interceptor: Token-Refresh bei 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      await useAuthStore().refreshToken()
      return apiClient(error.config)
    }
    return Promise.reject(error)
  }
)
```

---

## 6. Internationalisierung (i18n)

### Konfiguration

```typescript
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'
import de from '@/i18n/de.json'
import en from '@/i18n/en.json'

export const i18n = createI18n({
  legacy: false,           // Composition API Modus
  locale: 'de',
  fallbackLocale: 'en',
  messages: { de, en },
  datetimeFormats: {
    de: {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    },
    en: {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    }
  },
  numberFormats: {
    de: {
      currency: { style: 'currency', currency: 'EUR', notation: 'standard' }
    },
    en: {
      currency: { style: 'currency', currency: 'EUR', notation: 'standard' }
    }
  }
})
```

### Übersetzungsdatei-Struktur

```json
// i18n/de.json
{
  "nav": {
    "dashboard": "Übersicht",
    "profile": "Mein Profil",
    "hours": "Meine Stunden",
    "feedback": "Feedback",
    "documents": "Dokumente",
    "calendar": "Kalender",
    "account": "Mein Konto"
  },
  "auth": {
    "login": "Anmelden",
    "logout": "Abmelden",
    "username": "Benutzername",
    "password": "Passwort",
    "loginWithRfid": "Mit RFID anmelden",
    "errors": {
      "invalidCredentials": "Benutzername oder Passwort falsch.",
      "accountLocked": "Konto gesperrt. Bitte in {minutes} Minuten erneut versuchen."
    }
  },
  "hours": {
    "quota": "Pflichtstunden",
    "confirmed": "Geleistete Stunden",
    "remaining": "Verbleibende Stunden",
    "status": {
      "PLANNED": "Geplant",
      "CONFIRMED": "Bestätigt",
      "CANCELLED": "Abgesagt"
    }
  },
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "loading": "Wird geladen...",
    "noData": "Keine Daten vorhanden."
  }
}
```

---

## 7. RFID-Input-Komponente

```vue
<!-- components/rfid/RfidInput.vue -->
<template>
  <input
    ref="rfidInput"
    type="text"
    class="rfid-hidden-input"
    @keydown="handleKeydown"
    @blur="refocus"
    autocomplete="off"
    tabindex="-1"
  />
</template>

<script setup lang="ts">
const RFID_SPEED_THRESHOLD_MS = 100  // Maximale Zeit zwischen Zeichen
const RFID_MIN_LENGTH = 8

const emit = defineEmits<{ rfidDetected: [token: string] }>()

let buffer = ''
let lastKeyTime = 0

function handleKeydown(event: KeyboardEvent) {
  const now = Date.now()
  const timeDiff = now - lastKeyTime
  lastKeyTime = now

  if (event.key === 'Enter') {
    if (buffer.length >= RFID_MIN_LENGTH) {
      emit('rfidDetected', buffer)
    }
    buffer = ''
    return
  }

  // Wenn die Zeit zwischen Tastendrücken zu lang → kein RFID-Reader
  if (timeDiff > RFID_SPEED_THRESHOLD_MS && buffer.length > 0) {
    buffer = ''
  }

  buffer += event.key
}
</script>
```

---

## 8. Responsive Design & Mobile (Stufe 2)

Vuetify 3 nutzt ein 12-Spalten-Grid-System mit Breakpoints:

| Breakpoint | Gerät              | Breite     |
|------------|--------------------|------------|
| `xs`       | Smartphone         | < 600px    |
| `sm`       | Tablet             | 600–960px  |
| `md`       | Laptop             | 960–1280px |
| `lg`       | Desktop            | 1280px+    |

**Mobile-spezifische Anpassungen (Stufe 2):**
- Navigation: Bottom-Navigation für Smartphones (`v-bottom-navigation`)
- Tabellen: Auf mobil kollabierbar oder als Listenansicht
- Formulare: Einzelspaltig auf `xs`
- Touch-Events für Kalender
- Viewport-Meta-Tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

## 9. Vuetify Theme

```typescript
// plugins/vuetify.ts
const theme = {
  defaultTheme: 'vereinTheme',
  themes: {
    vereinTheme: {
      dark: false,
      colors: {
        primary: '#1565C0',     // Vereinsfarbe (anpassbar)
        secondary: '#42A5F5',
        accent: '#FF8F00',
        error: '#D32F2F',
        warning: '#F57C00',
        info: '#0288D1',
        success: '#388E3C',
        background: '#F5F5F5',
        surface: '#FFFFFF',
      }
    }
  }
}
```

---

## 10. Fehlerbehandlung & Benutzer-Feedback

- Globale Error-Handler für Axios-Fehler → Snackbar-Benachrichtigungen
- Formulare zeigen Inline-Fehler bei Validierungsproblemen
- Ladeanimationen (`v-progress-linear`, `v-skeleton-loader`) während API-Aufrufen
- Bestätigungs-Dialoge vor destruktiven Aktionen (Löschen, Stornieren)
- Globale `ConfirmDialog`-Komponente via Composable

```typescript
// composables/useNotification.ts
export function useNotification() {
  const store = useNotificationStore()
  return {
    success: (msg: string) => store.show(msg, 'success'),
    error: (msg: string) => store.show(msg, 'error'),
    info: (msg: string) => store.show(msg, 'info'),
    warning: (msg: string) => store.show(msg, 'warning'),
  }
}
```
