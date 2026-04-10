import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '../layouts/AppShell.vue'
import AuthView from '../views/AuthView.vue'
import CommunityView from '../views/CommunityView.vue'
import HomeView from '../views/HomeView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'orders', name: 'orders', component: OrdersView },
        { path: 'community', name: 'community', component: CommunityView },
        { path: 'profile', name: 'profile', component: ProfileView }
      ]
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView
    }
  ]
})

export default router
