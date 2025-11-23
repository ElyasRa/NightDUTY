import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import FirmenverwaltungView from '../views/FirmenverwaltungView.vue'
import StundenreportView from '../views/StundenreportView.vue'
import UebernahmenView from '../views/UebernahmenView.vue'
import RechnungErstellenView from '../views/RechnungErstellenView.vue'
import MahnwesenView from '../views/MahnwesenView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/firmenverwaltung',
      name: 'Firmenverwaltung',
      component: FirmenverwaltungView,
      meta: { requiresAuth: true }
    },
    {
      path: '/stundenreport',
      name: 'Stundenreport',
      component: StundenreportView,
      meta: { requiresAuth: true }
    },
    {
      path: '/uebernahmen',
      name: 'Übernahmen',
      component: UebernahmenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/rechnung-erstellen',
      name: 'Rechnung erstellen',
      component: RechnungErstellenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mahnwesen',
      name: 'Mahnwesen',
      component: MahnwesenView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
