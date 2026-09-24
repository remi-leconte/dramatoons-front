import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/privacy',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicyView.vue'),
    },
    {
      path: '/install-tutorial',
      name: 'install-tutorial',
      component: () => import('../views/InstallExtensionTutorialView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/auth/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/verify',
      name: 'verify',
      component: () => import('../views/auth/VerifyView.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPasswordView.vue'),
      meta: { guestOnly: true }
    },
    { path: '/admin/users', name: 'admin-users', component: () => import('../views/admin/UserListView.vue'), meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
    { path: '/admin/users/:id', name: 'admin-user-detail', component: () => import('../views/admin/UserDetailView.vue'), meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
    { path: '/admin/webtoons', name: 'admin-webtoons', component: () => import('../views/admin/WebtoonListView.vue'), meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
    { path: '/admin/webtoons/:id', name: 'admin-webtoon-detail', component: () => import('../views/admin/WebtoonDetailView.vue'), meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } }
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated && authStore.roles.length === 0) {
    try {
      await authStore.fetchUserProfile()
    } catch {
      authStore.logout()
      return { name: 'login' }
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const guestOnly = to.matched.some(record => record.meta.guestOnly)
  const requiredRoles = to.meta.roles as string[] | undefined

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = authStore.roles.some(role => requiredRoles.includes(role))

    if (!hasRole) {
      return { name: 'home' }
    }
  }
})

export default router