import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import FirmenverwaltungView from '../views/FirmenverwaltungView.vue'
import StundenreportView from '../views/StundenreportView.vue'
import UebernahmenView from '../views/UebernahmenView.vue'
import FruehzeitigeUebernahmeView from '../views/FruehzeitigeUebernahmeView.vue'
import RechnungErstellenView from '../views/RechnungErstellenView.vue'
import MahnwesenView from '../views/MahnwesenView.vue'
import OffeneRechnungenView from '../views/OffeneRechnungenView.vue'
import AlleRechnungenView from '../views/AlleRechnungenView.vue'
import ZahlungBuchenView from '../views/ZahlungBuchenView.vue'
import RechnungsversandView from '../views/RechnungsversandView.vue'
import EinstellungenView from '../views/EinstellungenView.vue'
import BenutzerverwaltungView from '../views/BenutzerverwaltungView.vue'
import StundenausgleichView from '../views/StundenausgleichView.vue'

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
      path: '/fruehzeitige-uebernahme',
      name: 'Frühzeitige Übernahme',
      component: FruehzeitigeUebernahmeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/rechnung-erstellen',
      name: 'Rechnung erstellen',
      component: RechnungErstellenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/offene-rechnungen',
      name: 'Offene Rechnungen',
      component: OffeneRechnungenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/alle-rechnungen',
      name: 'Alle Rechnungen',
      component: AlleRechnungenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/zahlung-buchen',
      name: 'Zahlung buchen',
      component: ZahlungBuchenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mahnwesen',
      name: 'Mahnwesen',
      component: MahnwesenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/rechnungsversand',
      name: 'Rechnungsversand',
      component: RechnungsversandView,
      meta: { requiresAuth: true }
    },
    {
      path: '/einstellungen',
      name: 'Einstellungen',
      component: EinstellungenView,
      meta: { requiresAuth: true }
    },
    {
      path: '/benutzerverwaltung',
      name: 'Benutzerverwaltung',
      component: BenutzerverwaltungView,
      meta: { requiresAuth: true }
    },
    {
      path: '/stundenausgleich',
      name: 'Stundenausgleich',
      component: StundenausgleichView,
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
