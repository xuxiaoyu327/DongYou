<template>
  <div class="page auth-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">‹</button>
      <h1 class="title">注册</h1>
      <span class="placeholder"></span>
    </header>

    <main class="page-main">
      <section class="welcome">
        <h2 class="welcome-title">创建新账号</h2>
        <p class="welcome-subtitle">只需几步，完成账号注册</p>
      </section>

      <el-form
        class="form"
        :model="form"
        label-position="top"
        @submit.prevent
        @keyup.enter.native="handleSubmit"
      >
        <el-form-item label="姓名">
          <el-input
            v-model="form.name"
            maxlength="16"
            placeholder="请输入姓名或昵称"
            clearable
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="form.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            clearable
          />
        </el-form-item>

        <el-form-item label="设置密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="至少 6 位数字或字母"
            clearable
          />
        </el-form-item>

        <el-form-item label="确认密码">
          <el-input
            v-model="form.confirm"
            type="password"
            show-password
            placeholder="请再次输入密码"
            clearable
          />
        </el-form-item>

        <el-button
          class="submit-btn"
          type="primary"
          size="large"
          round
          :loading="loading"
          @click="handleSubmit"
        >
          注册
        </el-button>

        <p class="tips">
          已有账号？
          <router-link to="/login">去登录</router-link>
        </p>
      </el-form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const form = reactive({
  name: '',
  phone: '',
  password: '',
  confirm: '',
})

const handleSubmit = async () => {
  if (!form.name || !form.phone || !form.password || !form.confirm) {
    ElMessage.warning('请填写完整的注册信息')
    return
  }

  if (form.password !== form.confirm) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        password: form.password,
      }),
    })

    if (response.status === 409) {
      ElMessage.error('该手机号已注册，请直接登录')
      router.push('/login')
      return
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '注册失败')
    }

    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.page-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
}

.back-btn {
  border: none;
  background: transparent;
  font-size: 22px;
  padding: 4px 8px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.placeholder {
  width: 32px;
}

.page-main {
  flex: 1;
  padding: 24px 20px 32px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.form {
  margin-top: 32px;
}

.submit-btn {
  margin-top: 10px;
  width: 100%;
}

.tips {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
}

.tips a {
  color: #2563eb;
  text-decoration: none;
}

@media (min-width: 480px) {
  .page-main {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>