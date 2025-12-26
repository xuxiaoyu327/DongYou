// 管理员后台通用 CRUD Composable

import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { handleApiError, isCancelError } from '@/utils/adminApi'
import type { Pagination } from '@/types/admin'
import { DEFAULT_PAGE_SIZE } from '@/utils/adminConstants'

import type { ApiResponse } from '@/types/admin'

interface UseCrudOptions<T> {
  loadData: (page: number, pageSize: number, ...args: any[]) => Promise<ApiResponse<T>>
  deleteItem: (id: number) => Promise<void>
  batchDelete: (ids: number[]) => Promise<{ message?: string }>
  dataKey: string
  itemName: string
  batchItemName: string
}

export function useAdminCrud<T extends { id: number }>(options: UseCrudOptions<T>) {
  const { loadData, deleteItem, batchDelete, dataKey, itemName, batchItemName } = options

  const list = ref<T[]>([])
  const loading = ref(false)
  const selectedIds = ref<number[]>([])
  const pagination = reactive<Pagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  })

  // 加载数据
  const load = async (...searchArgs: any[]) => {
    loading.value = true
    try {
      const data = await loadData(pagination.page, pagination.pageSize, ...searchArgs)
      list.value = (data[dataKey] as T[]) || []
      pagination.total = data.total
    } catch (error) {
      handleApiError(error, `加载${itemName}列表失败`)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = (...searchArgs: any[]) => {
    pagination.page = 1
    load(...searchArgs)
  }

  // 分页变化
  const handlePageChange = (...searchArgs: any[]) => {
    load(...searchArgs)
  }

  // 分页大小变化
  const handlePageSizeChange = (...searchArgs: any[]) => {
    pagination.page = 1
    load(...searchArgs)
  }

  // 选择变化
  const handleSelectionChange = (selection: T[]) => {
    selectedIds.value = selection.map(item => item.id)
  }

  // 删除单个
  const handleDelete = async (row: T, onSuccess?: () => void) => {
    try {
      await ElMessageBox.confirm(`确定要删除该${itemName}吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await deleteItem(row.id)
      ElMessage.success('删除成功')
      onSuccess?.()
    } catch (error) {
      if (!isCancelError(error)) {
        handleApiError(error, '删除失败')
      }
    }
  }

  // 批量删除
  const handleBatchDelete = async (onSuccess?: () => void) => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要删除的项')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 个${batchItemName}吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      const result = await batchDelete(selectedIds.value)
      ElMessage.success(result.message || '批量删除成功')
      selectedIds.value = []
      onSuccess?.()
    } catch (error) {
      if (!isCancelError(error)) {
        handleApiError(error, '批量删除失败')
      }
    }
  }

  return {
    list,
    loading,
    selectedIds,
    pagination,
    load,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange,
    handleDelete,
    handleBatchDelete
  }
}

// 通用表单保存逻辑
import type { Ref } from 'vue'

export function useFormSave<T>(
  formRef: Ref<FormInstance | undefined>,
  saveFn: (data: T) => Promise<void>,
  onSuccess?: () => void
) {
  const saving = ref(false)

  const handleSave = async (formData: T, successMessage?: string) => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        saving.value = true
        try {
          await saveFn(formData)
          ElMessage.success(successMessage || '保存成功')
          onSuccess?.()
        } catch (error) {
          handleApiError(error, '保存失败')
        } finally {
          saving.value = false
        }
      }
    })
  }

  return {
    saving,
    handleSave
  }
}

