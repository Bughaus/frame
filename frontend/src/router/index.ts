import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const staffRoles = ['ADMIN', 'VORSTAND', 'MITARBEITER']
const boardRoles = ['ADMIN', 'VORSTAND']

const routes = [
  { path: '/login', component: () => import('../views/auth/LoginView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Verzehr', requiresAuth: true } },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { title: 'Mein Profil', requiresAuth: true } },
  { path: '/members', component: () => import('../views/MembersView.vue'), meta: { title: 'Mitglieder', requiresAuth: true, roles: staffRoles } },
  { path: '/my-finance', component: () => import('../views/MyFinanceView.vue'), meta: { title: 'Finanzen', requiresAuth: true } },
  { path: '/inbox', component: () => import('../views/InboxView.vue'), meta: { title: 'Inbox', requiresAuth: true, roles: ['ADMIN', 'VORSTAND'] } },
  { path: '/pos', component: () => import('../views/cash-register/POSView.vue'), meta: { title: 'Event Kasse', requiresAuth: true, roles: staffRoles } },
  { path: '/articles', component: () => import('../views/cash-register/ArticlesView.vue'), meta: { title: 'Artikel', requiresAuth: true, roles: staffRoles } },
  { path: '/treasurer', component: () => import('../views/cash-register/TreasurerView.vue'), meta: { title: 'Vereinskasse', requiresAuth: true, roles: boardRoles } },
  { path: '/accounting', component: () => import('../views/cash-register/AccountingView.vue'), meta: { title: 'Buchungen', requiresAuth: true, roles: boardRoles } },
  { path: '/hours', component: () => import('../views/WorkingHoursView.vue'), meta: { title: 'Arbeitsdienst', requiresAuth: true } },
  { path: '/hours-management', component: () => import('../views/admin/HoursManagementView.vue'), meta: { title: 'Events & Arbeitsdienste', requiresAuth: true, roles: ['ADMIN', 'VORSTAND'] } },
  { path: '/help', component: () => import('../views/HelpView.vue'), meta: { title: 'Hilfe', requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else if (to.meta.roles && authStore.isAuthenticated && !authStore.hasRole(to.meta.roles as string[])) {
    next('/dashboard')
  } else {
    next()
  }
})
