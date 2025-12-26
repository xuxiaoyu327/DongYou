<template>
  <div class="login-page">
    <!-- 极简背景 -->
    <div class="background-decoration">
      <div class="sakura sakura-1"></div>
      <div class="sakura sakura-2"></div>
    </div>
    
    <!-- 简洁标题 -->
    <div class="page-header">
      <h1 class="brand-title">MochiMap</h1>
      <p class="page-subtitle">登录</p>
    </div>

    <!-- 主表单 -->
    <main class="login-form">
      <el-form
        :model="form"
        :rules="rules"
        @submit.prevent
        @keyup.enter.native="handleSubmit"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            type="text"
            placeholder="手机号或管理员账号(admin)"
            :prefix-icon="Phone"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            clearable
          />
        </el-form-item>

        <el-button
          class="submit-btn"
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSubmit"
        >
          登录
        </el-button>
      </el-form>

      <!-- 注册链接 -->
      <div class="form-actions">
        还没有账号？
        <router-link to="/register" class="action-link">立即注册</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus/es'
import { Phone, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

// 表单数据
const form = reactive({
  phone: '',
  password: '',
})

// 表单验证规则
const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号或管理员账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!form.phone || !form.password) {
    ElMessage.warning('请填写手机号和密码')
    return
  }

  // 管理员账号特殊处理（支持手机号格式或直接输入admin）
  const isAdminAccount = form.phone.toLowerCase() === 'admin' || form.phone === '13800000000'
  
  // 普通用户需要验证手机号格式
  if (!isAdminAccount && !/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '登录失败')
    }

    // 保存用户信息
    localStorage.setItem('token', data.token || '')
    localStorage.setItem('user', JSON.stringify(data.user || {}))

    ElMessage.success('登录成功')
    
    // 如果是管理员账号，跳转到管理员后台
    if (isAdminAccount) {
      router.push('/admin')
    } else {
      router.push('/main')
    }
  } catch (error) {
    // 如果API调用失败，检查是否是管理员账号（用于演示）
    if (isAdminAccount && form.password) {
      // 模拟管理员登录成功
      localStorage.setItem('token', 'admin_token_' + Date.now())
      localStorage.setItem('user', JSON.stringify({ 
        id: 0, 
        name: '管理员', 
        phone: 'admin',
        role: 'admin' 
      }))
      ElMessage.success('管理员登录成功')
      router.push('/admin')
    } else {
      ElMessage.error(error instanceof Error ? error.message : '登录失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
  padding: 0 20px;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.sakura {
  position: absolute;
  background: rgba(255, 199, 209, 0.2);
  border-radius: 50%;
  opacity: 0.3;
  animation: sakura-float 20s linear infinite;
}

.sakura-1 {
  width: 60px;
  height: 60px;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.sakura-2 {
  width: 40px;
  height: 40px;
  bottom: 20%;
  left: 10%;
  animation-delay: 10s;
  opacity: 0.2;
}

@keyframes sakura-float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 页面头部 */
.page-header {
  text-align: center;
  padding: 60px 0 40px;
  z-index: 1;
  position: relative;
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #e75480, #ff6b9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 400;
  opacity: 0.8;
}

/* 登录表单 */
.login-form {
  flex: 1;
  max-width: 360px;
  width: 100%;
  margin: 0 auto;
  z-index: 1;
  position: relative;
  padding-bottom: 40px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input) {
  --el-input-border-color: #e0e0e0;
  --el-input-hover-border-color: #e75480;
  --el-input-focus-border-color: #e75480;
  --el-input-border-radius: 8px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 0 16px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

:deep(.el-input__prefix) {
  color: #e75480;
  margin-right: 8px;
}

:deep(.el-input__inner) {
  font-size: 15px;
  color: #333;
}

:deep(.el-input__inner::placeholder) {
  color: #999;
  font-size: 15px;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #e75480, #ff6b9d);
  border: none;
  border-radius: 8px;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 表单操作 */
.form-actions {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.action-link {
  color: #e75480;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* 响应式设计 */
@media (min-width: 1024px) {
  .login-page {
    padding: 0 40px;
  }

  .page-header {
    padding: 100px 0 60px;
  }
  
  .brand-title {
    font-size: 48px;
  }
  
  .page-subtitle {
    font-size: 20px;
  }

  .login-form {
    max-width: 420px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .page-header {
    padding: 80px 0 50px;
  }
  
  .brand-title {
    font-size: 40px;
  }
  
  .page-subtitle {
    font-size: 18px;
  }

  .login-form {
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 0 16px;
  }

  .page-header {
    padding: 40px 0 30px;
  }

  .brand-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .login-form {
    padding-bottom: 30px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-input__wrapper) {
    height: 44px;
  }

  .submit-btn {
    height: 44px;
    font-size: 15px;
  }
}
</style>