<template>
  <div class="welcome-container">
    <!-- 主背景 -->
    <div class="background-wrapper">
      <div class="sakura-sakura sakura-1"></div>
      <div class="sakura-sakura sakura-2"></div>
      <div class="sakura-sakura sakura-3"></div>
      <div class="sakura-sakura sakura-4"></div>
      <div class="sakura-sakura sakura-5"></div>
      
      <!-- 日本地图形状 -->
      <div class="japan-shape"></div>
      
      <!-- 动画元素：鸟居、富士山轮廓 -->
      <div class="fujisan-silhouette"></div>
      <div class="torii-gate"></div>
      
      <!-- 底部装饰 -->
      <div class="bottom-decoration">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
      </div>
    </div>
    
    <!-- 主要内容 -->
    <div class="welcome-content">
      <!-- 英文标题 -->
      <div class="title">MochiMap</div>
      
      <!-- 中文描述 -->
      <div class="text">欢迎来到东游纪!</div>
      
      <!-- 极简倒计时 -->
      <div class="minimal-countdown" @click="goLogin">
        <div class="countdown-dot" :class="{ active: countdown === 3 }"></div>
        <div class="countdown-dot" :class="{ active: countdown === 2 }"></div>
        <div class="countdown-dot" :class="{ active: countdown === 1 }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(3)
let timer = null
let countdownTimer = null

const goLogin = () => {
  clearTimeout(timer)
  clearInterval(countdownTimer)
  router.push('/main')
}

onMounted(() => {
  // 倒计时
  countdownTimer = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
  
  // 3秒后自动跳转
  timer = setTimeout(() => {
    goLogin()
  }, 3000)
})

onUnmounted(() => {
  clearTimeout(timer)
  clearInterval(countdownTimer)
})
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9f0f0 0%, #fff5f5 50%, #ffeaea 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Hiragino Sans GB', 'Microsoft YaHei', 'Yu Gothic', sans-serif;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 樱花飘落效果 */
.sakura-sakura {
  position: absolute;
  background: #ffc7d1;
  border-radius: 50% 50% 50% 0;
  opacity: 0.7;
  animation: sakura-fall linear infinite;
}

.sakura-sakura:before {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: #ff9aab;
  border-radius: 50%;
  top: 2px;
  left: 2px;
}

.sakura-1 {
  width: 20px;
  height: 20px;
  top: -20px;
  left: 10%;
  animation-duration: 8s;
  animation-delay: 0s;
}

.sakura-2 {
  width: 15px;
  height: 15px;
  top: -15px;
  left: 20%;
  animation-duration: 10s;
  animation-delay: 1s;
}

.sakura-3 {
  width: 18px;
  height: 18px;
  top: -18px;
  left: 30%;
  animation-duration: 12s;
  animation-delay: 2s;
}

.sakura-4 {
  width: 12px;
  height: 12px;
  top: -12px;
  left: 40%;
  animation-duration: 9s;
  animation-delay: 3s;
}

.sakura-5 {
  width: 16px;
  height: 16px;
  top: -16px;
  left: 50%;
  animation-duration: 11s;
  animation-delay: 4s;
}

@keyframes sakura-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

/* 日本地图轮廓 */
.japan-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: rgba(255, 182, 193, 0.1);
  clip-path: polygon(50% 0%, 60% 20%, 80% 25%, 70% 40%, 85% 50%, 70% 65%, 50% 80%, 30% 65%, 15% 50%, 30% 40%, 20% 25%, 40% 20%);
  animation: gentle-float 6s ease-in-out infinite;
}

/* 富士山轮廓 */
.fujisan-silhouette {
  position: absolute;
  bottom: 0;
  right: 10%;
  width: 200px;
  height: 150px;
  background: linear-gradient(to top, #ffb6c1, #ffc7d1);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  opacity: 0.3;
}

/* 鸟居简笔画 */
.torii-gate {
  position: absolute;
  bottom: 20%;
  left: 15%;
  width: 100px;
  height: 120px;
  opacity: 0.2;
}

.torii-gate:before,
.torii-gate:after {
  content: '';
  position: absolute;
  background: #d4a5a5;
}

.torii-gate:before {
  width: 100px;
  height: 10px;
  top: 0;
  left: 0;
  box-shadow: 0 20px 0 #d4a5a5;
}

.torii-gate:after {
  width: 20px;
  height: 100px;
  top: 10px;
  left: 40px;
}

.welcome-content {
  text-align: center;
  z-index: 2;
  position: relative;
  padding: 2rem;
  max-width: 800px;
  width: 90%;
}

/* 英文标题样式 */
.title {
  font-size: 5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #e75480, #ff6b9d, #ff8ab5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 3px 3px 8px rgba(231, 84, 128, 0.2);
  letter-spacing: 2px;
  font-family: 'Arial Rounded MT Bold', 'Yu Gothic', sans-serif;
  display: block;
  animation: title-glow 2s ease-in-out infinite alternate;
  margin-bottom: 1rem;
}

/* 中文描述样式 */
.text {
  font-size: 2.2rem;
  color: #a18888;
  font-weight: 300;
  opacity: 0.9;
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
}

.text::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e75480, transparent);
  opacity: 0.4;
}

/* 极简倒计时 - 低存在感设计 */
.minimal-countdown {
  display: flex;
  justify-content: center;
  gap: 8px;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.3s ease;
  margin-top: 2rem;
}

.minimal-countdown:hover {
  opacity: 0.8;
}

.countdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(167, 124, 124, 0.3);
  transition: all 0.5s ease;
}

.countdown-dot.active {
  background: #e75480;
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(231, 84, 128, 0.3);
}

/* 底部装饰 */
.bottom-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 60px;
  background: rgba(255, 182, 193, 0.1);
  border-radius: 50%;
  animation: wave-animation 10s linear infinite;
}

.wave-1 {
  animation-delay: 0s;
  opacity: 0.5;
}

.wave-2 {
  animation-delay: -5s;
  bottom: 10px;
  opacity: 0.3;
  height: 40px;
}

/* 动画定义 */
@keyframes gentle-float {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0px);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-20px);
  }
}

@keyframes title-glow {
  from {
    filter: drop-shadow(3px 3px 8px rgba(231, 84, 128, 0.2));
  }
  to {
    filter: drop-shadow(3px 3px 12px rgba(231, 84, 128, 0.3));
  }
}

@keyframes wave-animation {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* 响应式设计 */
@media (min-width: 1024px) {
  .title {
    font-size: 6rem;
  }
  
  .text {
    font-size: 2.5rem;
  }
  
  .japan-shape {
    width: 400px;
    height: 400px;
  }
  
  .fujisan-silhouette {
    width: 250px;
    height: 180px;
  }

  .welcome-content {
    max-width: 1000px;
  }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .title {
    font-size: 5rem;
  }
  
  .text {
    font-size: 2.2rem;
  }
  
  .japan-shape {
    width: 300px;
    height: 300px;
  }
  
  .fujisan-silhouette {
    width: 200px;
    height: 150px;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 3.5rem;
  }
  
  .text {
    font-size: 1.8rem;
  }
  
  .japan-shape {
    width: 200px;
    height: 200px;
  }
  
  .fujisan-silhouette {
    width: 150px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 2.8rem;
  }
  
  .text {
    font-size: 1.5rem;
  }
  
  .welcome-content {
    padding: 1rem;
  }

  .japan-shape {
    width: 150px;
    height: 150px;
  }
  
  .fujisan-silhouette {
    width: 120px;
    height: 80px;
  }
}
</style>