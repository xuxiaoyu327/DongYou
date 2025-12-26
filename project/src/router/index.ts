import { createRouter, createWebHistory } from 'vue-router'

const ROUTE_PATHS = {
  HOME: '/main',
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADD: '/add',
  POST_DETAIL: '/post/:id',
  MINE: '/mine',
  SHOP: '/shop',
  PRODUCT_DETAIL: '/product/:id',
  PAYMENT: '/payment',
  ADMIN: '/admin',
  AI: '/ai'
}

const ROUTE_NAMES = {
  HOME: 'home',
  SHOW: 'show',
  LOGIN: 'login',
  REGISTER: 'register',
  ADD: 'add',
  POST_DETAIL: 'postDetail',
  MINE: 'mine',
  SHOP: 'shop',
  PRODUCT_DETAIL: 'productDetail',
  PAYMENT: 'payment',
  ADMIN: 'admin',
  AI: 'ai'
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
  },
  {
    path: ROUTE_PATHS.ADD,
    name: ROUTE_NAMES.ADD,
    component: () => import('@/views/button/AddView.vue'),
    meta: { title: '发布攻略', requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.POST_DETAIL,
    name: ROUTE_NAMES.POST_DETAIL,
    component: () => import('@/views/DetailView.vue'),
    meta: { title: '攻略详情', requiresAuth: false }
  },
  {
    path: ROUTE_PATHS.MINE,
    name: ROUTE_NAMES.MINE,
    component: () => import('@/views/button/MineView.vue'),
    meta: { title: '我的', requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.SHOP,
    name: ROUTE_NAMES.SHOP,
    component: () => import('@/views/button/ShopView.vue'),
    meta: { title: '商城', requiresAuth: false }
  },
  {
    path: ROUTE_PATHS.PRODUCT_DETAIL,
    name: ROUTE_NAMES.PRODUCT_DETAIL,
    component: () => import('@/views/button/BuyView.vue'),
    meta: { title: '商品详情', requiresAuth: false }
  },
  {
    path: ROUTE_PATHS.PAYMENT,
    name: ROUTE_NAMES.PAYMENT,
    component: () => import('@/views/button/PaymentView.vue'),
    meta: { title: '支付', requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.ADMIN,
    name: ROUTE_NAMES.ADMIN,
    component: () => import('@/views/AdminView.vue'),
    meta: { title: '管理员后台', requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.AI,
    name: ROUTE_NAMES.AI,
    component: () => import('@/views/button/AIView.vue'),
    meta: { title: 'AI旅游助手', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router