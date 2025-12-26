<template>
  <div class="admin-container">
    <!-- 左侧导航栏 -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2 class="admin-title">管理员后台</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="admin-menu"
        @select="handleMenuSelect"
        background-color="#001529"
        text-color="rgba(255, 255, 255, 0.65)"
        active-text-color="#1890ff"
      >
        <el-menu-item index="users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="products">
          <el-icon><Goods /></el-icon>
          <span>商城管理</span>
        </el-menu-item>
        <el-menu-item index="orders">
          <el-icon><ShoppingBag /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <el-button type="danger" plain @click="handleLogout" :icon="SwitchButton">
          退出登录
        </el-button>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="admin-content">
      <!-- 用户管理模块 -->
      <div v-if="activeMenu === 'users'" class="module-container">
        <div class="module-header">
          <h3 class="module-title">用户管理</h3>
          <div class="header-actions">
            <el-input
              v-model="userSearchForm.keyword"
              placeholder="搜索用户名/手机号/用户ID"
              style="width: 300px; margin-right: 12px;"
              clearable
              @keyup.enter="handleUserSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleUserSearch" :icon="Search">
              查询
            </el-button>
            <el-button
              type="danger"
              :disabled="userCrud.selectedIds.value.length === 0"
              @click="handleBatchDeleteUsers"
              :icon="Delete"
            >
              批量删除
            </el-button>
            <el-button type="success" @click="handleAddUser" :icon="Plus">
              新增用户
            </el-button>
          </div>
        </div>

        <el-table
          :data="userCrud.list"
          v-loading="userCrud.loading"
          @selection-change="userCrud.handleSelectionChange"
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="用户ID" width="100" sortable />
          <el-table-column prop="name" label="用户名" width="150" />
          <el-table-column prop="phone" label="手机号" width="150" />
          <el-table-column prop="registerTime" label="注册时间" width="180" sortable />
          <el-table-column prop="status" label="账号状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ USER_STATUS_MAP[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="权限" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'warning' : 'info'">
                {{ USER_ROLE_MAP[row.role] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditUser(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="userCrud.handleDelete(row, loadUsers)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="userCrud.pagination.page"
          v-model:page-size="userCrud.pagination.pageSize"
          :total="userCrud.pagination.total"
          :page-sizes="PAGE_SIZES"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; justify-content: flex-end;"
          @size-change="handleUserPageSizeChange"
          @current-change="handleUserPageChange"
        />
      </div>

      <!-- 商城管理模块 -->
      <div v-if="activeMenu === 'products'" class="module-container">
        <div class="module-header">
          <h3 class="module-title">商城管理</h3>
          <div class="header-actions">
            <el-input
              v-model="productSearchForm.name"
              placeholder="搜索商品名称"
              style="width: 200px; margin-right: 12px;"
              clearable
              @keyup.enter="handleProductSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="productSearchForm.category"
              placeholder="选择分类"
              style="width: 150px; margin-right: 12px;"
              clearable
            >
              <el-option label="全部" value="" />
              <el-option
                v-for="(label, value) in CATEGORY_MAP"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
            <el-button type="primary" @click="handleProductSearch" :icon="Search">
              查询
            </el-button>
            <el-button
              type="danger"
              :disabled="productCrud.selectedIds.value.length === 0"
              @click="handleBatchDeleteProducts"
              :icon="Delete"
            >
              批量删除
            </el-button>
            <el-button type="success" @click="handleAddProduct" :icon="Plus">
              新增商品
            </el-button>
          </div>
        </div>

        <el-table
          :data="productCrud.list"
          v-loading="productCrud.loading"
          @selection-change="productCrud.handleSelectionChange"
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="商品ID" width="100" sortable />
          <el-table-column prop="name" label="商品名称" width="200" />
          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag>{{ CATEGORY_MAP[row.category] || row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="120" sortable>
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="100" sortable />
          <el-table-column prop="image" label="商品图片" width="120">
            <template #default="{ row }">
              <el-image
                :src="row.image || '/id.jpeg'"
                style="width: 80px; height: 80px;"
                fit="cover"
                :preview-src-list="[row.image || '/id.jpeg']"
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditProduct(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="productCrud.handleDelete(row, loadProducts)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="productCrud.pagination.page"
          v-model:page-size="productCrud.pagination.pageSize"
          :total="productCrud.pagination.total"
          :page-sizes="PAGE_SIZES"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; justify-content: flex-end;"
          @size-change="handleProductPageSizeChange"
          @current-change="handleProductPageChange"
        />
      </div>

      <!-- 订单管理模块 -->
      <div v-if="activeMenu === 'orders'" class="module-container">
        <div class="module-header">
          <h3 class="module-title">订单管理</h3>
          <div class="header-actions">
            <el-input
              v-model="orderSearchForm.orderNumber"
              placeholder="搜索订单号"
              style="width: 200px; margin-right: 12px;"
              clearable
              @keyup.enter="handleOrderSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="orderSearchForm.status"
              placeholder="订单状态"
              style="width: 150px; margin-right: 12px;"
              clearable
            >
              <el-option label="全部" value="" />
              <el-option
                v-for="(label, value) in ORDER_STATUS_MAP"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
            <el-button type="primary" @click="handleOrderSearch" :icon="Search">
              查询
            </el-button>
            <el-button
              type="danger"
              :disabled="orderCrud.selectedIds.value.length === 0"
              @click="handleBatchDeleteOrders"
              :icon="Delete"
            >
              批量删除
            </el-button>
          </div>
        </div>

        <el-table
          :data="orderCrud.list"
          v-loading="orderCrud.loading"
          @selection-change="orderCrud.handleSelectionChange"
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="orderNumber" label="订单号" width="200" />
          <el-table-column prop="userName" label="用户信息" width="150" />
          <el-table-column prop="userPhone" label="用户手机" width="150" />
          <el-table-column prop="productName" label="商品信息" width="200" />
          <el-table-column prop="amount" label="金额" width="120" sortable>
            <template #default="{ row }">
              ¥{{ row.amount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderTime" label="下单时间" width="180" sortable />
          <el-table-column prop="status" label="订单状态" width="120">
            <template #default="{ row }">
              <el-tag :type="ORDER_STATUS_TYPE_MAP[row.status]">
                {{ ORDER_STATUS_MAP[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditOrder(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="orderCrud.handleDelete(row, loadOrders)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="orderCrud.pagination.page"
          v-model:page-size="orderCrud.pagination.pageSize"
          :total="orderCrud.pagination.total"
          :page-sizes="PAGE_SIZES"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; justify-content: flex-end;"
          @size-change="handleOrderPageSizeChange"
          @current-change="handleOrderPageChange"
        />
      </div>
    </main>

    <!-- 用户编辑/新增对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="600px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限" prop="role">
          <el-radio-group v-model="userForm.role">
            <el-radio label="user">普通用户</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUser" :loading="userSaving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品编辑/新增对话框 -->
    <el-dialog
      v-model="productDialogVisible"
      :title="productDialogMode === 'add' ? '新增商品' : '编辑商品'"
      width="700px"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productFormRules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="productForm.category" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="(label, value) in CATEGORY_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="productForm.price" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="商品图片" prop="image">
          <el-input v-model="productForm.image" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveProduct" :loading="productSaving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 订单编辑对话框 -->
    <el-dialog v-model="orderDialogVisible" title="编辑订单" width="700px">
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderFormRules"
        label-width="100px"
      >
        <el-form-item label="订单号">
          <el-input v-model="orderForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="用户信息">
          <el-input v-model="orderForm.userName" disabled />
        </el-form-item>
        <el-form-item label="商品信息">
          <el-input v-model="orderForm.productName" disabled />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="orderForm.status" placeholder="请选择订单状态" style="width: 100%;">
            <el-option
              v-for="(label, value) in ORDER_STATUS_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveOrder" :loading="orderSaving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Goods,
  ShoppingBag,
  Search,
  Plus,
  Edit,
  Delete,
  SwitchButton
} from '@element-plus/icons-vue'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  fetchOrders,
  updateOrder,
  deleteOrder,
  batchDeleteOrders
} from '@/utils/adminApi'
import { useAdminCrud } from '@/composables/useAdminCrud'
import {
  PAGE_SIZES,
  CATEGORY_MAP,
  ORDER_STATUS_MAP,
  ORDER_STATUS_TYPE_MAP,
  USER_STATUS_MAP,
  USER_ROLE_MAP,
  DEFAULT_USER_PASSWORD
} from '@/utils/adminConstants'

const router = useRouter()

// 当前激活的菜单
const activeMenu = ref('users')

// ==================== 用户管理 ====================
const userSearchForm = reactive({
  keyword: ''
})

const userCrud = useAdminCrud<UserType>({
  loadData: (page, pageSize) => fetchUsers(page, pageSize, userSearchForm.keyword),
  deleteItem: deleteUser,
  batchDelete: batchDeleteUsers,
  dataKey: 'users',
  itemName: '用户',
  batchItemName: '用户'
})

const userFormRef = ref()
const userDialogVisible = ref(false)
const userDialogMode = ref('add')
const userSaving = ref(false)
const userForm = reactive({
  id: 0,
  name: '',
  phone: '',
  status: 'active',
  role: 'user'
})

const userFormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const loadUsers = () => {
  userCrud.load(userSearchForm.keyword)
}

const handleUserSearch = () => {
  userCrud.handleSearch(userSearchForm.keyword)
}

const handleUserPageChange = () => {
  userCrud.handlePageChange(userSearchForm.keyword)
}

const handleUserPageSizeChange = () => {
  userCrud.handlePageSizeChange(userSearchForm.keyword)
}

const handleAddUser = () => {
  userDialogMode.value = 'add'
  Object.assign(userForm, {
    id: 0,
    name: '',
    phone: '',
    status: 'active',
    role: 'user'
  })
  userDialogVisible.value = true
}

const handleEditUser = (row) => {
  userDialogMode.value = 'edit'
  Object.assign(userForm, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    role: row.role
  })
  userDialogVisible.value = true
}

const handleSaveUser = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      userSaving.value = true
      try {
        if (userDialogMode.value === 'add') {
          await createUser({ ...userForm, password: DEFAULT_USER_PASSWORD })
          ElMessage.success('新增用户成功')
        } else {
          await updateUser(userForm.id, {
            name: userForm.name,
            phone: userForm.phone,
            status: userForm.status,
            role: userForm.role
          })
          ElMessage.success('更新用户成功')
        }
        userDialogVisible.value = false
        loadUsers()
      } catch (error) {
        // 错误已在 API 函数中处理
      } finally {
        userSaving.value = false
      }
    }
  })
}

const handleBatchDeleteUsers = () => {
  userCrud.handleBatchDelete(loadUsers)
}

// ==================== 商品管理 ====================
const productSearchForm = reactive({
  name: '',
  category: ''
})

const productCrud = useAdminCrud<Product>({
  loadData: (page, pageSize) => fetchProducts(page, pageSize, productSearchForm.name, productSearchForm.category),
  deleteItem: deleteProduct,
  batchDelete: batchDeleteProducts,
  dataKey: 'products',
  itemName: '商品',
  batchItemName: '商品'
})

const productFormRef = ref()
const productDialogVisible = ref(false)
const productDialogMode = ref('add')
const productSaving = ref(false)
const productForm = reactive({
  id: 0,
  name: '',
  category: '',
  price: 0,
  stock: 0,
  image: '',
  description: ''
})

const productFormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

const loadProducts = () => {
  productCrud.load(productSearchForm.name, productSearchForm.category)
}

const handleProductSearch = () => {
  productCrud.handleSearch(productSearchForm.name, productSearchForm.category)
}

const handleProductPageChange = () => {
  productCrud.handlePageChange(productSearchForm.name, productSearchForm.category)
}

const handleProductPageSizeChange = () => {
  productCrud.handlePageSizeChange(productSearchForm.name, productSearchForm.category)
}

const handleAddProduct = () => {
  productDialogMode.value = 'add'
  Object.assign(productForm, {
    id: 0,
    name: '',
    category: '',
    price: 0,
    stock: 0,
    image: '',
    description: ''
  })
  productDialogVisible.value = true
}

const handleEditProduct = (row) => {
  productDialogMode.value = 'edit'
  Object.assign(productForm, {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    image: row.image,
    description: row.description
  })
  productDialogVisible.value = true
}

const handleSaveProduct = async () => {
  if (!productFormRef.value) return

  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      productSaving.value = true
      try {
        if (productDialogMode.value === 'add') {
          await createProduct(productForm)
          ElMessage.success('新增商品成功')
        } else {
          await updateProduct(productForm.id, productForm)
          ElMessage.success('更新商品成功')
        }
        productDialogVisible.value = false
        loadProducts()
      } catch (error) {
        // 错误已在 API 函数中处理
      } finally {
        productSaving.value = false
      }
    }
  })
}

const handleBatchDeleteProducts = () => {
  productCrud.handleBatchDelete(loadProducts)
}

// ==================== 订单管理 ====================
const orderSearchForm = reactive({
  orderNumber: '',
  status: ''
})

const orderCrud = useAdminCrud<Order>({
  loadData: (page, pageSize) => fetchOrders(page, pageSize, orderSearchForm.orderNumber, orderSearchForm.status),
  deleteItem: deleteOrder,
  batchDelete: batchDeleteOrders,
  dataKey: 'orders',
  itemName: '订单',
  batchItemName: '订单'
})

const orderFormRef = ref()
const orderDialogVisible = ref(false)
const orderSaving = ref(false)
const orderForm = reactive({
  id: 0,
  orderNumber: '',
  userName: '',
  userPhone: '',
  productName: '',
  amount: 0,
  status: ''
})

const orderFormRules = {
  status: [{ required: true, message: '请选择订单状态', trigger: 'change' }]
}

const loadOrders = () => {
  orderCrud.load(orderSearchForm.orderNumber, orderSearchForm.status)
}

const handleOrderSearch = () => {
  orderCrud.handleSearch(orderSearchForm.orderNumber, orderSearchForm.status)
}

const handleOrderPageChange = () => {
  orderCrud.handlePageChange(orderSearchForm.orderNumber, orderSearchForm.status)
}

const handleOrderPageSizeChange = () => {
  orderCrud.handlePageSizeChange(orderSearchForm.orderNumber, orderSearchForm.status)
}

const handleEditOrder = (row) => {
  Object.assign(orderForm, {
    id: row.id,
    orderNumber: row.orderNumber,
    userName: row.userName,
    userPhone: row.userPhone,
    productName: row.productName,
    amount: row.amount,
    status: row.status
  })
  orderDialogVisible.value = true
}

const handleSaveOrder = async () => {
  if (!orderFormRef.value) return

  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      orderSaving.value = true
      try {
        await updateOrder(orderForm.id, orderForm.status)
        ElMessage.success('更新订单成功')
        orderDialogVisible.value = false
        loadOrders()
      } catch (error) {
        // 错误已在 API 函数中处理
      } finally {
        orderSaving.value = false
      }
    }
  })
}

const handleBatchDeleteOrders = () => {
  orderCrud.handleBatchDelete(loadOrders)
}

// ==================== 菜单切换 ====================
const handleMenuSelect = (key) => {
  activeMenu.value = key
  // 切换菜单时重新加载数据
  const loadMap = {
    users: loadUsers,
    products: loadProducts,
    orders: loadOrders
  }
  loadMap[key]?.()
}

// ==================== 退出登录 ====================
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    })
    .catch(() => {
      // 用户取消
    })
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5;
}

/* 左侧导航栏 */
.admin-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #001529 0%, #002140 100%);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #001529 0%, #002140 100%);
}

.admin-title {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.admin-menu {
  flex: 1;
  border-right: none;
}

.admin-menu :deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  transition: all 0.3s ease;
  border-radius: 4px;
  margin: 4px 12px;
  width: calc(100% - 24px);
}

.admin-menu :deep(.el-menu-item:hover) {
  background-color: rgba(24, 144, 255, 0.1) !important;
  color: #1890ff !important;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%) !important;
  color: #fff !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.admin-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #fff !important;
}

.admin-menu :deep(.el-menu-item.is-active span) {
  color: #fff !important;
  font-weight: 600;
}

.admin-menu :deep(.el-menu-item .el-icon) {
  margin-right: 8px;
  font-size: 18px;
  transition: all 0.3s ease;
}

.admin-menu :deep(.el-menu-item:hover .el-icon) {
  color: #1890ff;
  transform: scale(1.1);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-footer .el-button {
  width: 100%;
  font-weight: 500;
  transition: all 0.3s ease;
}

.sidebar-footer .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 34, 45, 0.3);
}

/* 右侧内容区 */
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%);
}

.module-container {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.module-container:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.module-title {
  font-size: 22px;
  font-weight: 700;
  color: #1890ff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-title::before {
  content: '';
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 2px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions .el-button {
  transition: all 0.3s ease;
  font-weight: 500;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-actions .el-input {
  transition: all 0.3s ease;
}

.header-actions .el-input:hover {
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

/* 表格样式 */
:deep(.el-table) {
  font-size: 14px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
}

:deep(.el-table tr:hover > td) {
  background-color: #f5f7fa !important;
}

:deep(.el-table .el-table__row) {
  transition: all 0.2s ease;
}

:deep(.el-table .el-table__row:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.el-table .el-button) {
  margin-right: 8px;
}

:deep(.el-table .el-button:last-child) {
  margin-right: 0;
}

/* 分页样式 */
:deep(.el-pagination) {
  display: flex;
  justify-content: flex-end;
}

/* 对话框样式 */
:deep(.el-dialog__body) {
  padding: 20px 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* PC端适配 */
@media (min-width: 1200px) {
  .admin-content {
    padding: 32px;
  }

  .module-container {
    padding: 32px;
  }
}

@media (min-width: 1024px) and (max-width: 1199px) {
  .admin-content {
    padding: 24px;
  }

  .module-container {
    padding: 24px;
  }
}

/* 响应式提示（仅PC端） */
@media (max-width: 1023px) {
  .admin-container::before {
    content: '管理员后台仅支持PC端访问（屏幕宽度≥1024px）';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    font-size: 16px;
    color: #333;
    text-align: center;
  }
}
</style>
