import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const adminRoles = ['ADMIN', 'SCHATZMEISTER', 'VORSTAND']
const routes = [
  { path: '/login', component: () => import('../views/auth/LoginView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/members', component: () => import('../views/MembersView.vue'), meta: { requiresAuth: true, roles: adminRoles } },
  { path: '/change-requests', component: () => import('../views/DataChangeRequestsView.vue'), meta: { requiresAuth: true, roles: ['ADMIN', 'VORSTAND'] } },
  { path: '/pos', component: () => import('../views/cash-register/POSView.vue'), meta: { requiresAuth: true, roles: adminRoles } },
  { path: '/articles', component: () => import('../views/cash-register/ArticlesView.vue'), meta: { requiresAuth: true, roles: adminRoles } },
  { path: '/treasurer', component: () => import('../views/cash-register/TreasurerView.vue'), meta: { requiresAuth: true, roles: adminRoles } },
  { path: '/hours', component: () => import('../views/WorkingHoursView.vue'), meta: { requiresAuth: true } },
  { path: '/hours-management', component: () => import('../views/admin/HoursManagementView.vue'), meta: { requiresAuth: true, roles: ['ADMIN', 'VORSTAND'] } },
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
