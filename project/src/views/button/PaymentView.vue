<template>
    <div class="payment-page">
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
            <h1 class="page-title">支付</h1>
            <div class="nav-right"></div>
        </header>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p>加载中...</p>
        </div>

        <!-- 支付内容 -->
        <main v-else-if="productInfo" class="payment-content">
            <!-- 商品信息卡片 -->
            <div class="product-card">
                <div class="product-header">
                    <h3 class="card-title">商品信息</h3>
                </div>
                <div class="product-details">
                    <div class="detail-row">
                        <span class="label">商品名称：</span>
                        <span class="value">{{ productInfo.name }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">商品价格：</span>
                        <span class="price-value">¥{{ formattedPrice }}</span>
                    </div>
                </div>
            </div>

            <!-- 支付方式选择 -->
            <div class="payment-methods">
                <h3 class="card-title">选择支付方式</h3>
                <div class="method-list">
                    <div 
                        v-for="method in paymentMethods" 
                        :key="method.value"
                        class="method-item"
                        :class="{ active: selectedMethod === method.value }"
                        @click="selectedMethod = method.value">
                        <el-icon :size="24" class="method-icon">
                            <component :is="method.icon" />
                        </el-icon>
                        <span class="method-name">{{ method.label }}</span>
                        <el-icon v-if="selectedMethod === method.value" :size="20" class="check-icon">
                            <Check />
                        </el-icon>
                    </div>
                </div>
            </div>

            <!-- 订单摘要 -->
            <div class="order-summary">
                <h3 class="card-title">订单摘要</h3>
                <div class="summary-list">
                    <div class="summary-row">
                        <span class="label">商品金额：</span>
                        <span class="value">¥{{ formattedPrice }}</span>
                    </div>
                    <div class="summary-row">
                        <span class="label">优惠金额：</span>
                        <span class="value discount">-¥0.00</span>
                    </div>
                    <div class="summary-row total">
                        <span class="label">实付金额：</span>
                        <span class="value total-price">¥{{ formattedPrice }}</span>
                    </div>
                </div>
            </div>
        </main>

        <!-- 错误状态 -->
        <div v-else class="error-container">
            <el-icon :size="64" class="error-icon">
                <Warning />
            </el-icon>
            <p class="error-text">商品信息加载失败</p>
            <el-button type="primary" @click="goBack">返回</el-button>
        </div>

        <!-- 底部支付栏 -->
        <footer v-if="productInfo" class="payment-bar">
            <div class="total-info">
                <span class="total-label">合计：</span>
                <span class="total-amount">¥{{ formattedPrice }}</span>
            </div>
            <el-button 
                type="primary" 
                :loading="paying"
                @click="handlePay"
                class="pay-btn">
                {{ payButtonText }}
            </el-button>
        </footer>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    ArrowLeft, 
    Loading, 
    Warning,
    Check,
    CreditCard,
    Wallet,
    Money
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const loading = ref(true)
const paying = ref(false)
const productInfo = ref(null)
const selectedMethod = ref('alipay')

const paymentMethods = [
    { label: '支付宝', value: 'alipay', icon: CreditCard },
    { label: '微信支付', value: 'wechat', icon: Wallet },
    { label: '余额支付', value: 'balance', icon: Money }
]

const formattedPrice = computed(() => {
    return productInfo.value ? productInfo.value.price.toFixed(2) : '0.00'
})

const payButtonText = computed(() => {
    return paying.value ? '支付中...' : '确认支付'
})

// 返回上一页
const goBack = () => {
    router.back()
}

// 从查询参数创建商品信息
const createProductFromQuery = (productName, price) => {
    if (!productName || !price) {
        return null
    }

    const name = Array.isArray(productName) ? productName[0] : productName
    const priceValue = Array.isArray(price) ? price[0] : price
    
    if (!name || !priceValue || typeof name !== 'string' || typeof priceValue !== 'string') {
        return null
    }

    const parsedPrice = parseFloat(priceValue)

    if (isNaN(parsedPrice)) {
        return null
    }

    return {
        name,
        price: parsedPrice
    }
}

// 获取商品信息
const fetchProductInfo = async () => {
    const productId = route.query.productId
    const productName = route.query.productName
    const price = route.query.price

    // 如果没有商品ID，尝试使用查询参数中的信息
    if (!productId || (Array.isArray(productId) && productId.length === 0)) {
        const productFromQuery = createProductFromQuery(productName, price)
        if (productFromQuery) {
            productInfo.value = productFromQuery
            loading.value = false
            return
        }
        ElMessage.error('缺少商品信息')
        router.back()
        return
    }

    const productIdValue = Array.isArray(productId) ? productId[0] : productId

    loading.value = true
    try {
        const response = await fetch(`${API_BASE}/api/products/${productIdValue}`)
        
        if (!response.ok) {
            throw new Error('获取商品信息失败')
        }
        
        const data = await response.json()
        const fallbackProduct = createProductFromQuery(productName, price)
        
        productInfo.value = {
            name: data.product?.name || fallbackProduct?.name || '商品',
            price: data.product?.price ?? fallbackProduct?.price ?? 0
        }
    } catch (error) {
        console.error('获取商品信息失败:', error)
        // 如果API失败，尝试使用查询参数中的信息
        const productFromQuery = createProductFromQuery(productName, price)
        if (productFromQuery) {
            productInfo.value = productFromQuery
        } else {
            ElMessage.error('加载商品信息失败')
        }
    } finally {
        loading.value = false
    }
}

// 处理支付
const handlePay = async () => {
    if (!productInfo.value) {
        ElMessage.warning('商品信息不存在')
        return
    }

    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
    }

    paying.value = true

    try {
        // 创建订单
        const productId = route.query.productId
        const productIdValue = Array.isArray(productId) ? productId[0] : productId

        const createOrderResponse = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productIdValue,
                productName: productInfo.value.name,
                price: productInfo.value.price,
                paymentMethod: selectedMethod.value
            })
        })

        if (!createOrderResponse.ok) {
            throw new Error('创建订单失败')
        }

        const orderData = await createOrderResponse.json()
        const orderId = orderData.order.id

        // 模拟支付过程
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 更新订单状态为已支付
        const updateResponse = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'paid'
            })
        })

        if (!updateResponse.ok) {
            console.warn('更新订单状态失败，但支付已完成')
        }
        
        ElMessage.success('支付成功！')
        
        // 延迟跳转到首页
        setTimeout(() => {
            router.push('/main')
        }, 1500)
    } catch (error) {
        console.error('支付失败:', error)
        const errorMessage = error instanceof Error ? error.message : '支付失败，请稍后再试'
        ElMessage.error(errorMessage)
    } finally {
        paying.value = false
    }
}

onMounted(() => {
    fetchProductInfo()
})
</script>

<style scoped>
.payment-page {
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

/* 支付内容 */
.payment-content {
    flex: 1;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 20px;
    z-index: 1;
    position: relative;
}

/* 卡片样式 */
.product-card,
.payment-methods,
.order-summary {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
    margin-bottom: 20px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 20px 0;
}

/* 商品信息 */
.product-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
}

.detail-row .label {
    color: #666;
}

.detail-row .value {
    color: #333;
    font-weight: 500;
}

.price-value {
    color: #e75480;
    font-size: 20px;
    font-weight: 700;
}

/* 支付方式 */
.method-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.method-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid rgba(231, 84, 128, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    background: #fff;
}

.method-item:hover {
    border-color: rgba(231, 84, 128, 0.3);
    background: rgba(231, 84, 128, 0.05);
}

.method-item.active {
    border-color: #e75480;
    background: rgba(231, 84, 128, 0.1);
}

.method-icon {
    color: #e75480;
}

.method-name {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.check-icon {
    color: #e75480;
}

/* 订单摘要 */
.summary-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    padding: 8px 0;
}

.summary-row.total {
    padding-top: 16px;
    border-top: 1px solid rgba(231, 84, 128, 0.1);
    margin-top: 8px;
}

.summary-row .label {
    color: #666;
}

.summary-row .value {
    color: #333;
    font-weight: 500;
}

.discount {
    color: #67c23a;
}

.total-price {
    color: #e75480;
    font-size: 20px;
    font-weight: 700;
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

/* 底部支付栏 */
.payment-bar {
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

.total-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.total-label {
    font-size: 12px;
    color: #999;
}

.total-amount {
    font-size: 24px;
    font-weight: 700;
    color: #e75480;
}

.pay-btn {
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 25px;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border: none;
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
}

.pay-btn:hover {
    background: linear-gradient(135deg, #ff6b9d, #ff8fb3);
    box-shadow: 0 6px 16px rgba(231, 84, 128, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .payment-content {
        padding: 16px 12px;
    }

    .product-card,
    .payment-methods,
    .order-summary {
        padding: 20px;
        border-radius: 16px;
    }

    .payment-bar {
        padding: 12px 16px;
    }

    .total-amount {
        font-size: 20px;
    }

    .pay-btn {
        padding: 10px 24px;
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .top-nav {
        padding: 10px 16px;
    }

    .page-title {
        font-size: 16px;
    }

    .product-card,
    .payment-methods,
    .order-summary {
        padding: 16px;
    }

    .card-title {
        font-size: 16px;
    }

    .method-item {
        padding: 12px;
    }

    .method-name {
        font-size: 14px;
    }
}
</style>

