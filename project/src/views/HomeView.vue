<template>
  <div class="page home-page">
    <header class="page-header">
      <h1 class="logo">DongYou</h1>
    </header>

    <main class="page-main">
      <section class="hero">
        <h2 class="hero-title">欢迎来到 DongYou</h2>
        <p class="hero-subtitle">专注移动端体验的应用首页示例。</p>
      </section>

      <section class="actions">
        <router-link class="btn primary" to="/login">登录</router-link>
        <router-link class="btn ghost" to="/register">注册</router-link>
      </section>
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
  color: #1f2933;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.page-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #2563eb;
}

.page-main {
  flex: 1;
  padding: 24px 20px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero {
  margin-top: 12px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  width: 100%;
  text-align: center;
  padding: 12px 16px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
}

.btn.primary {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
}

.btn.ghost {
  background: #ffffff;
  border-color: #d1d5db;
  color: #111827;
}

@media (min-width: 480px) {
  .page-main {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>


