import { createRouter, createWebHashHistory } from 'vue-router'

import AppShell from '../layouts/AppShell.vue'
import AboutView from '../views/AboutView.vue'
import AddPetView from '../views/AddPetView.vue'
import AuthView from '../views/AuthView.vue'
import CityCoverageView from '../views/CityCoverageView.vue'
import CommunityView from '../views/CommunityView.vue'
import HomeView from '../views/HomeView.vue'
import MyOrdersView from '../views/MyOrdersView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProfileView from '../views/ProfileView.vue'
import ServiceGuideView from '../views/ServiceGuideView.vue'
import ServicesView from '../views/ServicesView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'my-orders', name: 'my-orders', component: MyOrdersView },
        { path: 'orders', name: 'orders', component: OrdersView },
        { path: 'services', name: 'services', component: ServicesView },
        { path: 'service-guide', name: 'service-guide', component: ServiceGuideView },
        { path: 'city-coverage', name: 'city-coverage', component: CityCoverageView },
        { path: 'community', name: 'community', component: CommunityView },
        { path: 'pets/new', name: 'pet-new', component: AddPetView },
        { path: 'about', name: 'about', component: AboutView },
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
