// 管理员后台常量定义

export const PAGE_SIZES = [10, 20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 10

export const CATEGORY_MAP: Record<string, string> = {
  hotel: '酒店',
  restaurant: '食宿',
  ticket: '门票'
}

export const ORDER_STATUS_MAP: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  cancelled: '已取消'
}

export const ORDER_STATUS_TYPE_MAP: Record<string, string> = {
  pending: 'warning',
  paid: 'success',
  completed: 'info',
  cancelled: 'danger'
}

export const USER_STATUS_MAP: Record<string, string> = {
  active: '正常',
  disabled: '禁用'
}

export const USER_ROLE_MAP: Record<string, string> = {
  user: '普通用户',
  admin: '管理员'
}

export const DEFAULT_USER_PASSWORD = '123456'

export const MENU_ITEMS = [
  { key: 'users', label: '用户管理', icon: 'User' },
  { key: 'products', label: '商城管理', icon: 'Goods' },
  { key: 'orders', label: '订单管理', icon: 'ShoppingBag' }
] as const

export type MenuKey = typeof MENU_ITEMS[number]['key']

