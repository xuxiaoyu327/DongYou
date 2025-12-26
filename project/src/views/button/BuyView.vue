<template>
    <div class="buy-page">
        <!-- 背景装饰 -->
        <div class="background-decoration">
            <div class="sakura sakura-1"></div>
            <div class="sakura sakura-2"></div>
        </div>

        <!-- 顶部导航栏 -->
        <header class="top-nav">
            <div class="nav-left" @click="goBack">
                <el-icon :size="24">
                    <ArrowLeft />
                </el-icon>
            </div>
            <h1 class="page-title">商品详情</h1>
            <div class="nav-right"></div>
        </header>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p>加载中...</p>
        </div>

        <!-- 商品详情内容 -->
        <main v-else-if="product" class="product-detail">
            <!-- 商品图片区域（上方） -->
            <div class="product-image-section">
                <img 
                    :src="product.image || 'https://via.placeholder.com/800x600?text=商品图片'" 
                    :alt="product.name"
                    class="product-main-image"
                    @error="handleImageError" />
                <div v-if="product.originalPrice && product.originalPrice > product.price" class="discount-badge-large">
                    {{ Math.round((1 - product.price / product.originalPrice) * 100) }}折
                </div>
            </div>

            <!-- 商品信息区域（下方） -->
            <div class="product-info-section">
                <!-- 商品名称和价格 -->
                <div class="product-header">
                    <h1 class="product-title">{{ product.name }}</h1>
                    <div class="price-section">
                        <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
                        <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                            ¥{{ product.originalPrice.toFixed(2) }}
                        </span>
                    </div>
                </div>

                <!-- 商品评分和销量 -->
                <div class="product-stats">
                    <div class="stat-item">
                        <el-icon :size="18" class="star-icon">
                            <StarFilled />
                        </el-icon>
                        <span class="rating-text">{{ product.rating.toFixed(1) }}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="sales-text">已售{{ product.salesCount }}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stock-text">库存{{ product.stock }}</span>
                    </div>
                </div>

                <!-- 商品位置 -->
                <div class="product-location">
                    <el-icon :size="18">
                        <Location />
                    </el-icon>
                    <span>{{ product.location || '位置待定' }}</span>
                </div>

                <!-- 商品标签 -->
                <div class="product-tags" v-if="product.tags && product.tags.length > 0">
                    <span 
                        v-for="tag in product.tags" 
                        :key="tag"
                        class="tag">
                        {{ tag }}
                    </span>
                </div>

                <!-- 商品描述 -->
                <div class="product-description">
                    <h3 class="section-title">商品描述</h3>
                    <p class="description-text">{{ product.description || '暂无描述' }}</p>
                </div>

                <!-- 详细信息 -->
                <div class="product-details" v-if="product.details && Object.keys(product.details).length > 0">
                    <h3 class="section-title">详细信息</h3>
                    <div class="details-list">
                        <div 
                            v-for="(value, key) in product.details" 
                            :key="key"
                            class="detail-item">
                            <span class="detail-label">{{ formatDetailKey(key) }}：</span>
                            <span class="detail-value">{{ formatDetailValue(value) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 错误状态 -->
        <div v-else class="error-container">
            <el-icon :size="64" class="error-icon">
                <Warning />
            </el-icon>
            <p class="error-text">商品不存在或已下架</p>
            <el-button type="primary" @click="goBack">返回</el-button>
        </div>

        <!-- 底部购买栏 -->
        <footer v-if="product" class="purchase-bar">
            <div class="price-info">
                <span class="price-label">价格</span>
                <span class="price-value">¥{{ product.price.toFixed(2) }}</span>
            </div>
            <el-button 
                type="primary" 
                :disabled="product.stock === 0"
                :loading="purchasing"
                @click="handlePurchase"
                class="purchase-btn">
                {{ product.stock === 0 ? '已售罄' : '立即购买' }}
            </el-button>
        </footer>

        <!-- 返回首页按钮 -->
        <div class="back-home-btn" @click="goToHome">
            <el-icon :size="20">
                <HomeFilled />
            </el-icon>
            <span>返回首页</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    ArrowLeft, 
    Loading, 
    Location,
    StarFilled,
    HomeFilled,
    Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const loading = ref(true)
const product = ref<any>(null)
const purchasing = ref(false)

// 返回上一页
const goBack = () => {
    router.back()
}

// 返回首页
const goToHome = () => {
    router.push('/main')
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    target.src = 'https://via.placeholder.com/800x600?text=图片加载失败'
}

// 格式化详情键名
const formatDetailKey = (key: string | number): string => {
    const keyStr = String(key)
    const keyMap: Record<string, string> = {
        'rooms': '房间数',
        'check_in': '入住时间',
        'check_out': '退房时间',
        'facilities': '设施',
        'cuisine': '菜系',
        'meal_type': '用餐类型',
        'duration': '时长',
        'dress_code': '着装要求',
        'validity': '有效期',
        'opening_hours': '营业时间',
        'includes': '包含项目',
        'departure': '出发时间'
    }
    return keyMap[keyStr] || keyStr
}

// 格式化详情值
const formatDetailValue = (value: any): string => {
    if (Array.isArray(value)) {
        return value.join('、')
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value)
    }
    return String(value)
}

// 处理购买
const handlePurchase = async () => {
    if (!product.value) return
    
    if (product.value.stock === 0) {
        ElMessage.warning('商品已售罄')
        return
    }

    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录后再购买')
        router.push('/login')
        return
    }

    purchasing.value = true
    
    try {
        // 跳转到支付页面，传递商品信息
        router.push({
            path: '/payment',
            query: {
                productId: product.value.id.toString(),
                productName: product.value.name,
                price: product.value.price.toString()
            }
        })
    } catch (error) {
        console.error('跳转支付页面失败:', error)
        ElMessage.error('跳转失败，请稍后再试')
    } finally {
        purchasing.value = false
    }
}

// 获取商品详情
const fetchProductDetail = async () => {
    const productId = route.params.id
    if (!productId) {
        ElMessage.error('无效的商品ID')
        router.back()
        return
    }

    loading.value = true
    try {
        const response = await fetch(`${API_BASE}/api/products/${productId}`)
        
        if (!response.ok) {
            if (response.status === 404) {
                ElMessage.error('商品不存在')
                product.value = null
                return
            }
            throw new Error('获取商品详情失败')
        }
        
        const data = await response.json()
        product.value = data.product || null
    } catch (error) {
        console.error('获取商品详情失败:', error)
        ElMessage.error('加载失败，请稍后再试')
        product.value = null
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchProductDetail()
})
</script>

<style scoped>
.buy-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 100px;
}

/* 背景装饰 */
.background-decoration {
    position: fixed;
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
    width: 50px;
    height: 50px;
    top: 10%;
    right: 10%;
    animation-delay: 0s;
}

.sakura-2 {
    width: 35px;
    height: 35px;
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

/* 顶部导航栏 */
.top-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    min-height: 56px;
}

.nav-left {
    cursor: pointer;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 6px;
    border-radius: 50%;
    min-width: 36px;
    min-height: 36px;
}

.nav-left:hover {
    color: #e75480;
    background: rgba(231, 84, 128, 0.1);
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    flex: 1;
    text-align: center;
}

.nav-right {
    min-width: 36px;
}

/* 加载状态 */
.loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    z-index: 1;
    position: relative;
}

.loading-icon {
    color: #e75480;
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* 商品详情内容 */
.product-detail {
    flex: 1;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    z-index: 1;
    position: relative;
}

/* 商品图片区域（上方） */
.product-image-section {
    position: relative;
    width: 100%;
    background: #fff;
    margin-bottom: 20px;
}

.product-main-image {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: cover;
    display: block;
}

.discount-badge-large {
    position: absolute;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 商品信息区域（下方） */
.product-info-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
    margin: 0 20px 100px;
}

.product-header {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(231, 84, 128, 0.1);
}

.product-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin: 0 0 16px 0;
    line-height: 1.4;
}

.price-section {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.current-price {
    font-size: 32px;
    font-weight: 700;
    color: #e75480;
}

.original-price {
    font-size: 20px;
    color: #999;
    text-decoration: line-through;
}

/* 商品统计信息 */
.product-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(231, 84, 128, 0.05);
    border-radius: 12px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.star-icon {
    color: #ffd700;
}

.rating-text {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.sales-text,
.stock-text {
    font-size: 14px;
    color: #666;
}

.stat-divider {
    width: 1px;
    height: 20px;
    background: rgba(231, 84, 128, 0.2);
}

/* 商品位置 */
.product-location {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;
}

.product-location .el-icon {
    color: #e75480;
}

/* 商品标签 */
.product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
}

.tag {
    font-size: 13px;
    padding: 6px 12px;
    background: rgba(231, 84, 128, 0.1);
    color: #e75480;
    border-radius: 16px;
    border: 1px solid rgba(231, 84, 128, 0.2);
}

/* 商品描述 */
.product-description {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(231, 84, 128, 0.1);
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
}

.description-text {
    font-size: 15px;
    line-height: 1.8;
    color: #555;
    margin: 0;
    white-space: pre-wrap;
}

/* 详细信息 */
.product-details {
    margin-bottom: 24px;
}

.details-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.detail-item {
    display: flex;
    font-size: 14px;
    line-height: 1.6;
}

.detail-label {
    color: #666;
    min-width: 100px;
    font-weight: 500;
}

.detail-value {
    color: #333;
    flex: 1;
}

/* 错误状态 */
.error-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    z-index: 1;
    position: relative;
}

.error-icon {
    color: #e75480;
    opacity: 0.5;
    margin-bottom: 20px;
}

.error-text {
    font-size: 16px;
    color: #666;
    margin-bottom: 24px;
}

/* 底部购买栏 */
.purchase-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    border-top: 1px solid rgba(231, 84, 128, 0.1);
}

.price-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.price-label {
    font-size: 12px;
    color: #999;
}

.price-value {
    font-size: 24px;
    font-weight: 700;
    color: #e75480;
}

.purchase-btn {
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 25px;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border: none;
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
}

.purchase-btn:hover {
    background: linear-gradient(135deg, #ff6b9d, #ff8fb3);
    box-shadow: 0 6px 16px rgba(231, 84, 128, 0.4);
}

/* 返回首页按钮 */
.back-home-btn {
    position: fixed;
    bottom: 90px;
    right: 30px;
    z-index: 99;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    color: #fff;
    border-radius: 25px;
    box-shadow: 0 4px 16px rgba(231, 84, 128, 0.4);
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    font-weight: 500;
}

.back-home-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(231, 84, 128, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .product-info-section {
        margin: 0 12px 100px;
        padding: 20px;
    }

    .product-title {
        font-size: 20px;
    }

    .current-price {
        font-size: 28px;
    }

    .product-stats {
        flex-wrap: wrap;
        gap: 12px;
    }

    .stat-divider {
        display: none;
    }

    .purchase-bar {
        padding: 12px 16px;
    }

    .price-value {
        font-size: 20px;
    }

    .purchase-btn {
        padding: 10px 24px;
        font-size: 14px;
    }

    .back-home-btn {
        bottom: 80px;
        right: 20px;
        padding: 10px 16px;
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .top-nav {
        padding: 10px 16px;
    }

    .page-title {
        font-size: 16px;
    }

    .product-info-section {
        margin: 0 8px 100px;
        padding: 16px;
        border-radius: 16px;
    }

    .product-title {
        font-size: 18px;
    }

    .current-price {
        font-size: 24px;
    }

    .original-price {
        font-size: 16px;
    }

    .section-title {
        font-size: 16px;
    }

    .description-text {
        font-size: 14px;
    }

    .back-home-btn span {
        display: none;
    }

    .back-home-btn {
        padding: 10px;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
