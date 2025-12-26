// 管理员后台 API 工具函数

import { ElMessage } from 'element-plus'
import type { User, Product, Order, ApiResponse } from '@/types/admin'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

/**
 * 获取认证请求头
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json',
  }
}

/**
 * 统一处理 API 响应
 */
const handleApiResponse = async <T>(response: Response, errorMessage: string): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
      throw new Error('未登录')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorMessage)
  }
  return response.json()
}

/**
 * 统一处理 API 错误
 */
const handleApiError = (error: unknown, defaultMessage: string): void => {
  console.error(defaultMessage, error)
  const message = error instanceof Error ? error.message : defaultMessage
  ElMessage.error(message)
}

/**
 * 检查是否为取消操作
 */
export const isCancelError = (error: unknown): boolean => {
  return error === 'cancel' || (error instanceof Error && error.message === 'cancel')
}

// ==================== 用户管理 API ====================
export const fetchUsers = async (
  page: number,
  pageSize: number,
  keyword?: string
): Promise<ApiResponse<User>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  })
  
  if (keyword) {
    params.append('keyword', keyword)
  }
  
  const response = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
    headers: getAuthHeaders()
  })
  
  return handleApiResponse<ApiResponse<User>>(response, '获取用户列表失败')
}

export const createUser = async (userData: Partial<User> & { password?: string }): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  })
  
  await handleApiResponse(response, '新增用户失败')
}

export const updateUser = async (id: number, userData: Partial<User>): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  })
  
  await handleApiResponse(response, '更新用户失败')
}

export const deleteUser = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  
  await handleApiResponse(response, '删除用户失败')
}

export const batchDeleteUsers = async (ids: number[]): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/admin/users/batch-delete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids })
  })
  
  return handleApiResponse<{ message: string }>(response, '批量删除失败')
}

// ==================== 商品管理 API ====================
export const fetchProducts = async (
  page: number,
  pageSize: number,
  name?: string,
  category?: string
): Promise<ApiResponse<Product>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  })
  
  if (name) {
    params.append('name', name)
  }
  if (category) {
    params.append('category', category)
  }
  
  const response = await fetch(`${API_BASE}/api/admin/products?${params.toString()}`, {
    headers: getAuthHeaders()
  })
  
  return handleApiResponse<ApiResponse<Product>>(response, '获取商品列表失败')
}

export const createProduct = async (productData: Partial<Product>): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  })
  
  await handleApiResponse(response, '新增商品失败')
}

export const updateProduct = async (id: number, productData: Partial<Product>): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  })
  
  await handleApiResponse(response, '更新商品失败')
}

export const deleteProduct = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  
  await handleApiResponse(response, '删除商品失败')
}

export const batchDeleteProducts = async (ids: number[]): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/admin/products/batch-delete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids })
  })
  
  return handleApiResponse<{ message: string }>(response, '批量删除失败')
}

// ==================== 订单管理 API ====================
export const fetchOrders = async (
  page: number,
  pageSize: number,
  orderNumber?: string,
  status?: string
): Promise<ApiResponse<Order>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  })
  
  if (orderNumber) {
    params.append('orderNumber', orderNumber)
  }
  if (status) {
    params.append('status', status)
  }
  
  const response = await fetch(`${API_BASE}/api/admin/orders?${params.toString()}`, {
    headers: getAuthHeaders()
  })
  
  return handleApiResponse<ApiResponse<Order>>(response, '获取订单列表失败')
}

export const updateOrder = async (id: number, status: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  })
  
  await handleApiResponse(response, '更新订单失败')
}

export const deleteOrder = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  
  await handleApiResponse(response, '删除订单失败')
}

export const batchDeleteOrders = async (ids: number[]): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/admin/orders/batch-delete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids })
  })
  
  return handleApiResponse<{ message: string }>(response, '批量删除失败')
}

// 导出错误处理函数供组件使用
export { handleApiError }

