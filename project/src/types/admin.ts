// 管理员后台相关类型定义

export interface User {
  id: number
  name: string
  phone: string
  registerTime: string
  status: 'active' | 'disabled'
  role: 'user' | 'admin'
}

export interface Product {
  id: number
  name: string
  category: 'hotel' | 'restaurant' | 'ticket'
  price: number
  stock: number
  image: string
  description: string
}

export interface Order {
  id: number
  orderNumber: string
  userName: string
  userPhone: string
  productName: string
  amount: number
  orderTime: string
  status: 'pending' | 'paid' | 'completed' | 'cancelled'
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface ApiResponse<T> {
  [key: string]: T[] | number | undefined
  total: number
}

export type DialogMode = 'add' | 'edit'

export interface UserForm {
  id: number
  name: string
  phone: string
  status: 'active' | 'disabled'
  role: 'user' | 'admin'
}

export interface ProductForm {
  id: number
  name: string
  category: 'hotel' | 'restaurant' | 'ticket' | ''
  price: number
  stock: number
  image: string
  description: string
}

export interface OrderForm {
  id: number
  orderNumber: string
  userName: string
  userPhone: string
  productName: string
  amount: number
  status: string
}

