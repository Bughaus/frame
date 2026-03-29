import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useDeviceStore } from '../stores/device.store'

const staffRoles = ['ADMIN', 'VORSTAND', 'MITARBEITER']
const boardRoles = ['ADMIN', 'VORSTAND']

const routes = [
  { path: '/login', component: () => import('../views/auth/LoginView.vue'), meta: { public: true } },
  { path: '/activate-device', component: () => import('../views/auth/DeviceActivationView.vue'), meta: { public: true } },
  { path: '/unauthorized-device', component: () => import('../views/auth/UnauthorizedDeviceView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Verzehr', requiresAuth: true } },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { title: 'Mein Profil', requiresAuth: true } },
  { path: '/members', component: () => import('../views/MembersView.vue'), meta: { title: 'Mitglieder', requiresAuth: true, roles: staffRoles, requiresSecureDevice: true } },
  { path: '/my-finance', component: () => import('../views/MyFinanceView.vue'), meta: { title: 'Finanzen', requiresAuth: true } },
  { path: '/inbox', component: () => import('../views/InboxView.vue'), meta: { title: 'Inbox', requiresAuth: true, roles: ['ADMIN', 'VORSTAND'], requiresSecureDevice: true } },
  { path: '/pos', component: () => import('../views/cash-register/POSView.vue'), meta: { title: 'Event Kasse', requiresAuth: true, roles: staffRoles, requiresSecureDevice: true } },
  { path: '/articles', component: () => import('../views/cash-register/ArticlesView.vue'), meta: { title: 'Artikel', requiresAuth: true, roles: staffRoles, requiresSecureDevice: true } },
  { path: '/treasurer', component: () => import('../views/cash-register/TreasurerView.vue'), meta: { title: 'Vereinskasse', requiresAuth: true, roles: boardRoles, requiresSecureDevice: true } },
  { path: '/accounting', component: () => import('../views/cash-register/AccountingView.vue'), meta: { title: 'Buchungen', requiresAuth: true, roles: boardRoles, requiresSecureDevice: true } },
  { path: '/admin/devices', component: () => import('../views/admin/DeviceManagementView.vue'), meta: { title: 'Geräteverwaltung', requiresAuth: true, roles: boardRoles } },
  { path: '/hours', component: () => import('../views/WorkingHoursView.vue'), meta: { title: 'Arbeitsdienst', requiresAuth: true } },
  { path: '/hours-management', component: () => import('../views/admin/HoursManagementView.vue'), meta: { title: 'Events & Arbeitsdienste', requiresAuth: true, roles: ['ADMIN', 'VORSTAND'], requiresSecureDevice: true } },
  { path: '/help', component: () => import('../views/HelpView.vue'), meta: { title: 'Hilfe', requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const deviceStore = useDeviceStore()

  // 1. Auth Guard
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 2. Hardware Security Guard (Secure Device Check)
  if (to.meta.requiresSecureDevice && !deviceStore.isAuthorized) {
    return next('/unauthorized-device')
  }

  // 3. Login Redirect
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  // 4. Roles Guard
  if (to.meta.roles && authStore.isAuthenticated && !authStore.hasRole(to.meta.roles as string[])) {
    return next('/dashboard')
  }

  next()
})
