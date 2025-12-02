<template>
  <div class="page auth-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">‹</button>
      <h1 class="title">登录</h1>
      <span class="placeholder"></span>
    </header>

    <main class="page-main">
      <section class="welcome">
        <h2 class="welcome-title">欢迎回来</h2>
        <p class="welcome-subtitle">使用手机号快速登录账号</p>
      </section>

      <form class="form" @submit.prevent>
        <div class="form-item">
          <label class="label">手机号</label>
          <input
            class="input"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>

        <div class="form-item code-row">
          <div class="code-input">
            <label class="label">验证码</label>
            <input
              class="input"
              type="text"
              placeholder="短信验证码"
              maxlength="6"
            />
          </div>
          <button type="button" class="btn small">获取验证码</button>
        </div>

        <button type="submit" class="btn primary submit-btn">
          登录
        </button>

        <p class="tips">
          还没有账号？
          <router-link to="/register">去注册</router-link>
        </p>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 14px;
  color: #4b5563;
}

.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  outline: none;
  background: #ffffff;
}

.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.code-row {
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
}

.code-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn.small {
  padding: 10px 14px;
  font-size: 13px;
  background: #e5e7eb;
  color: #1f2937;
}

.btn.primary {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
}

.submit-btn {
  margin-top: 10px;
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


