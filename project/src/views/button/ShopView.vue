<template>
    <div class="shop-page">
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
            <h1 class="page-title">商城</h1>
            <div class="nav-right"></div>
        </header>

        <!-- 分类导航栏 -->
        <div class="category-nav">
            <div 
                v-for="category in categories" 
                :key="category.value"
                class="category-item"
                :class="{ active: activeCategory === category.value }"
                @click="switchCategory(category.value)">
                <el-icon :size="20">
                    <component :is="category.icon" />
                </el-icon>
                <span>{{ category.label }}</span>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p>加载中...</p>
        </div>

        <!-- 商品列表 -->
        <main v-else class="products-container">
            <div v-if="filteredProducts.length === 0" class="empty-state">
                <el-icon :size="64" class="empty-icon">
                    <ShoppingBag />
                </el-icon>
                <p class="empty-text">暂无商品</p>
            </div>
            
            <div v-else class="products-list">
                <div 
                    v-for="product in filteredProducts" 
                    :key="product.id"
                    class="product-card"
                    @click="viewProduct(product)">
                    <!-- 商品图片 -->
                    <div class="product-image">
                        <img 
                            :src="product.image || 'https://via.placeholder.com/300x200?text=商品图片'" 
                            :alt="product.name"
                            @error="handleImageError" />
                        <div v-if="product.originalPrice && product.originalPrice > product.price" class="discount-badge">
                            {{ Math.round((1 - product.price / product.originalPrice) * 100) }}折
                        </div>
                    </div>
                    
                    <!-- 商品信息 -->
                    <div class="product-info">
                        <h3 class="product-name">{{ product.name }}</h3>
                        <p class="product-description">{{ product.description }}</p>
                        
                        <div class="product-meta">
                            <div class="product-location">
                                <el-icon :size="14">
                                    <Location />
                                </el-icon>
                                <span>{{ product.location || '位置待定' }}</span>
                            </div>
                            <div class="product-rating">
                                <el-icon :size="14" class="star-icon">
                                    <StarFilled />
                                </el-icon>
                                <span>{{ product.rating.toFixed(1) }}</span>
                            </div>
                        </div>
                        
                        <div class="product-tags" v-if="product.tags && product.tags.length > 0">
                            <span 
                                v-for="tag in product.tags.slice(0, 3)" 
                                :key="tag"
                                class="tag">
                                {{ tag }}
                            </span>
                        </div>
                        
                        <div class="product-footer">
                            <div class="product-price">
                                <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
                                <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                                    ¥{{ product.originalPrice.toFixed(2) }}
                                </span>
                            </div>
                            <div class="product-sales">
                                已售{{ product.salesCount }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    ArrowLeft, 
    Loading, 
    ShoppingBag,
    Location,
    StarFilled,
    HomeFilled,
    House,
    Food,
    Ticket
} from '@element-plus/icons-vue'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const loading = ref(true)
const products = ref<any[]>([])
const activeCategory = ref<string | null>(null)

const categories = [
    { label: '酒店', value: 'hotel', icon: House },
    { label: '食宿', value: 'restaurant', icon: Food },
    { label: '门票', value: 'ticket', icon: Ticket }
]

// 过滤商品
const filteredProducts = computed(() => {
    if (!activeCategory.value) {
        return products.value
    }
    return products.value.filter(p => p.category === activeCategory.value)
})

// 返回上一页
const goBack = () => {
    router.back()
}

// 返回首页
const goToHome = () => {
    router.push('/main')
}

// 切换分类
const switchCategory = (category: string) => {
    activeCategory.value = activeCategory.value === category ? null : category
}

// 查看商品详情
const viewProduct = (product: any) => {
    router.push(`/product/${product.id}`)
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    target.src = 'https://via.placeholder.com/300x200?text=图片加载失败'
}

// 获取商品列表
const fetchProducts = async () => {
    loading.value = true
    try {
        const response = await fetch(`${API_BASE}/api/products`)
        
        if (!response.ok) {
            throw new Error('获取商品列表失败')
        }
        
        const data = await response.json()
        products.value = data.products || []
    } catch (error) {
        console.error('获取商品列表失败:', error)
        ElMessage.error('加载商品失败，请稍后再试')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchProducts()
})
</script>

<style scoped>
.shop-page {
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

/* 分类导航栏 */
.category-nav {
    position: sticky;
    top: 56px;
    z-index: 99;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    display: flex;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.category-nav::-webkit-scrollbar {
    display: none;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
    color: #666;
    background: rgba(231, 84, 128, 0.05);
    border: 1px solid transparent;
}

.category-item:hover {
    background: rgba(231, 84, 128, 0.1);
    color: #e75480;
}

.category-item.active {
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    color: #fff;
    border-color: #e75480;
    box-shadow: 0 2px 8px rgba(231, 84, 128, 0.3);
}

.category-item span {
    font-size: 14px;
    font-weight: 500;
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

/* 商品容器 */
.products-container {
    flex: 1;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 20px;
    z-index: 1;
    position: relative;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
}

.empty-icon {
    color: #e75480;
    opacity: 0.3;
    margin-bottom: 16px;
}

.empty-text {
    color: #999;
    font-size: 16px;
    margin: 0;
}

/* 商品列表 */
.products-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 商品卡片 */
.product-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(231, 84, 128, 0.1);
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    gap: 16px;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(231, 84, 128, 0.15);
    border-color: rgba(231, 84, 128, 0.3);
}

/* 商品图片 */
.product-image {
    position: relative;
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    background: #f5f5f5;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.discount-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 商品信息 */
.product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.product-name {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
}

.product-description {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.product-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #999;
}

.product-location,
.product-rating {
    display: flex;
    align-items: center;
    gap: 4px;
}

.star-icon {
    color: #ffd700;
}

.product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag {
    font-size: 12px;
    padding: 4px 10px;
    background: rgba(231, 84, 128, 0.1);
    color: #e75480;
    border-radius: 12px;
    border: 1px solid rgba(231, 84, 128, 0.2);
}

.product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 8px;
}

.product-price {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.current-price {
    font-size: 20px;
    font-weight: 700;
    color: #e75480;
}

.original-price {
    font-size: 14px;
    color: #999;
    text-decoration: line-through;
}

.product-sales {
    font-size: 12px;
    color: #999;
}

/* 返回首页按钮 */
.back-home-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 100;
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
    .products-container {
        padding: 16px 12px;
    }

    .product-card {
        padding: 12px;
        gap: 12px;
    }

    .product-image {
        width: 100px;
        height: 100px;
    }

    .product-name {
        font-size: 16px;
    }

    .product-description {
        font-size: 13px;
    }

    .current-price {
        font-size: 18px;
    }

    .back-home-btn {
        bottom: 20px;
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

    .category-nav {
        padding: 10px 16px;
    }

    .category-item {
        padding: 6px 12px;
        font-size: 13px;
    }

    .product-card {
        flex-direction: column;
    }

    .product-image {
        width: 100%;
        height: 200px;
    }

    .back-home-btn {
        bottom: 16px;
        right: 16px;
        padding: 8px 14px;
    }

    .back-home-btn span {
        display: none;
    }
}
</style>
