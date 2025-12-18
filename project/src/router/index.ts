import { createRouter, createWebHistory } from 'vue-router'

const ROUTE_PATHS = {
  HOME: '/main',
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register'
}

const ROUTE_NAMES = {
  HOME: 'home',
  SHOW: 'show',
  LOGIN: 'login',
  REGISTER: 'register'
}

const routes = [
  {
    path: ROUTE_PATHS.HOME,
    name: ROUTE_NAMES.HOME,
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.ROOT,
    name: ROUTE_NAMES.SHOW,
    component: () => import('@/views/WelcomeView.vue'),
    meta: { title: '欢迎页', requiresAuth: false }
  },
  {
    path: ROUTE_PATHS.LOGIN,
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false, requiresGuest: true }
  },
  {
    path: ROUTE_PATHS.REGISTER,
    name: ROUTE_NAMES.REGISTER,
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false, requiresGuest: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router