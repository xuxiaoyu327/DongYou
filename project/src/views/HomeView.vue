<template>
    <div class="home-page">
        <!-- 极简背景 -->
        <div class="background-decoration">
            <div class="sakura sakura-1"></div>
            <div class="sakura sakura-2"></div>
            <div class="sakura sakura-3"></div>
        </div>

        <!-- 顶部导航栏 -->
        <header class="top-nav" :class="{ 'search-active': isMobileSearchActive }">
            <h1 v-if="!isMobileSearchActive" class="brand-title">MochiMap</h1>
            <div class="nav-actions">
                <div class="search-wrapper">
                    <!-- 移动端搜索图标按钮 -->
                    <div v-if="!isMobileSearchActive" class="mobile-search-trigger" @click="activateMobileSearch">
                        <el-icon :size="20">
                            <Search />
                        </el-icon>
                    </div>

                    <!-- 搜索输入框 -->
                    <el-input v-model="searchKeyword" :placeholder="isMobile ? '搜索帖子、作者...' : '搜索帖子、作者...'"
                        class="search-input" :class="{ 'mobile-full': isMobileSearchActive }" clearable
                        :prefix-icon="Search" @input="handleSearch" @clear="handleClearSearch"
                        @keyup.enter="performSearch" @focus="handleSearchFocus" @blur="handleSearchBlur"
                        ref="searchInputRef" />

                    <!-- 移动端取消按钮 -->
                    <div v-if="isMobileSearchActive" class="mobile-search-cancel" @click="deactivateMobileSearch">
                        取消
                    </div>

                    <!-- 搜索建议 -->
                    <div v-if="showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0)"
                        class="search-suggestions" :class="{ 'mobile-full': isMobileSearchActive }" @click.stop>
                        <!-- 搜索历史 -->
                        <div v-if="searchHistory.length > 0 && !searchKeyword" class="suggestion-section">
                            <div class="suggestion-header">
                                <span>搜索历史</span>
                                <span class="clear-history" @click="clearSearchHistory">清除</span>
                            </div>
                            <div v-for="(item, index) in searchHistory" :key="`history-${index}`"
                                class="suggestion-item" @click="selectSearchItem(item)">
                                <el-icon>
                                    <Clock />
                                </el-icon>
                                <span>{{ item }}</span>
                            </div>
                        </div>
                        <!-- 搜索建议 -->
                        <div v-if="searchSuggestions.length > 0" class="suggestion-section">
                            <div class="suggestion-header">
                                <span>搜索建议</span>
                            </div>
                            <div v-for="(item, index) in searchSuggestions" :key="`suggestion-${index}`"
                                class="suggestion-item" @click="selectSearchItem(item)">
                                <el-icon>
                                    <Search />
                                </el-icon>
                                <span>{{ item }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="!isMobileSearchActive" class="user-avatar" @click="goToProfile">
                    <el-avatar :size="36" :src="userInfo.avatar">
                        {{ userInfo.name?.charAt(0) || 'U' }}
                    </el-avatar>
                </div>
            </div>
        </header>

        <!-- 移动端搜索遮罩 -->
        <div v-if="isMobileSearchActive" class="mobile-search-overlay" @click="deactivateMobileSearch"></div>

        <!-- 中间部分：社交板块 -->
        <main class="social-board">
            <!-- 搜索状态提示 -->
            <div v-if="isSearching && filteredPosts.length === 0" class="empty-state">
                <el-icon :size="64" class="empty-icon">
                    <Search />
                </el-icon>
                <p class="empty-text">未找到相关帖子</p>
                <p class="empty-hint">试试其他关键词吧</p>
                <el-button type="primary" plain @click="handleClearSearch">清除搜索</el-button>
            </div>

            <!-- 帖子列表 -->
            <div v-else class="posts-container">
                <div v-for="post in filteredPosts" :key="post.id" class="post-card" @click="viewPost(post.id)">
                    <!-- 图片部分 -->
                    <div class="post-image">
                        <img :src="getPostImage(post)" :alt="post.title" />
                        <div class="image-overlay"></div>
                    </div>

                    <!-- 内容部分 -->
                    <div class="post-content">
                        <h3 class="post-title">
                            <span v-html="highlightText(post.title, searchKeyword)"></span>
                        </h3>
                        <div class="post-meta">
                            <div class="post-author">
                                <el-avatar :size="32" :src="post.author?.avatar" class="author-avatar">
                                    {{ post.author?.name?.charAt(0) || 'A' }}
                                </el-avatar>
                                <span class="author-name" v-html="highlightText(post.author?.name || '匿名用户', searchKeyword)"></span>
                            </div>
                            <div class="post-stats">
                                <span class="stat-item" v-if="post.likesCount !== undefined">
                                    <el-icon :size="14"><Star /></el-icon>
                                    {{ post.likesCount || 0 }}
                                </span>
                                <span class="stat-item" v-if="post.commentsCount !== undefined">
                                    <el-icon :size="14"><ChatLineRound /></el-icon>
                                    {{ post.commentsCount || 0 }}
                                </span>
                            </div>
                        </div>
                        <div class="post-time" v-if="post.createdAt">
                            {{ formatTime(post.createdAt) }}
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部导航栏 -->
        <footer class="bottom-nav">
            <div class="nav-item" @click="goToShop">
                <el-icon :size="24">
                    <Shop />
                </el-icon>
                <span>商城</span>
            </div>
            <div class="nav-item add-btn" @click="goToAdd">
                <el-icon :size="28">
                    <Plus />
                </el-icon>
            </div>
            <div class="nav-item" @click="goToProfile">
                <el-icon :size="24">
                    <User />
                </el-icon>
                <span>我的</span>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Shop, Plus, User, Clock, Star, ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const searchKeyword = ref('')
const showSuggestions = ref(false)
const isMobileSearchActive = ref(false)
const searchInputRef = ref()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

// 检测是否为移动端
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
})

// 用户信息
const userInfo = ref({
    name: '',
    avatar: '',
})

// 所有帖子数据（从数据库获取）
const allPosts = ref<any[]>([])

// 搜索历史
const searchHistory = ref<string[]>([])

// 热门搜索建议
const hotSuggestions = ref(['东京', '京都', '大阪', '樱花', '美食', '旅行'])

// 搜索建议（根据输入动态生成）
const searchSuggestions = computed(() => {
    if (!searchKeyword.value) return []

    const keyword = searchKeyword.value.toLowerCase().trim()
    if (!keyword) return []

    const suggestions: string[] = []

    // 从标题中提取建议
    allPosts.value.forEach(post => {
        if (post.title && post.title.toLowerCase().includes(keyword)) {
            const match = post.title.match(new RegExp(`.{0,20}${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.{0,20}`, 'i'))
            if (match && !suggestions.includes(match[0])) {
                suggestions.push(match[0])
            }
        }
    })

    // 从作者名中提取建议
    allPosts.value.forEach(post => {
        const authorName = post.author?.name || ''
        if (authorName && authorName.toLowerCase().includes(keyword)) {
            if (!suggestions.includes(authorName)) {
                suggestions.push(authorName)
            }
        }
    })

    // 从热门搜索中匹配
    hotSuggestions.value.forEach(item => {
        if (item.toLowerCase().includes(keyword) && !suggestions.includes(item)) {
            suggestions.push(item)
        }
    })

    return suggestions.slice(0, 5)
})

// 过滤后的帖子
const filteredPosts = computed(() => {
    if (!searchKeyword.value.trim()) {
        return allPosts.value
    }

    const keyword = searchKeyword.value.toLowerCase().trim()
    return allPosts.value.filter(post => {
        const titleMatch = post.title && post.title.toLowerCase().includes(keyword)
        const authorMatch = post.author?.name && post.author.name.toLowerCase().includes(keyword)
        return titleMatch || authorMatch
    })
})

// 是否正在搜索
const isSearching = computed(() => {
    return searchKeyword.value.trim().length > 0
})

// 防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

// 处理搜索输入
const handleSearch = () => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
        // 搜索逻辑已在 computed 中处理
        if (searchKeyword.value.trim()) {
            showSuggestions.value = false
        }
    }, 300)
}

// 激活移动端搜索
const activateMobileSearch = () => {
    isMobileSearchActive.value = true
    showSuggestions.value = true
    // 延迟聚焦，确保输入框已显示
    setTimeout(() => {
        searchInputRef.value?.focus()
    }, 100)
}

// 取消移动端搜索
const deactivateMobileSearch = () => {
    isMobileSearchActive.value = false
    showSuggestions.value = false
    if (!searchKeyword.value.trim()) {
        searchKeyword.value = ''
    }
}

// 处理搜索框聚焦
const handleSearchFocus = () => {
    if (isMobile.value) {
        isMobileSearchActive.value = true
    }
    showSuggestions.value = true
}

// 处理搜索框失焦
const handleSearchBlur = () => {
    // 延迟关闭，允许点击建议项
    setTimeout(() => {
        if (!isMobileSearchActive.value) {
            showSuggestions.value = false
        }
    }, 200)
}

// 执行搜索
const performSearch = () => {
    if (searchKeyword.value.trim()) {
        addToSearchHistory(searchKeyword.value.trim())
        showSuggestions.value = false
    }
}

// 清除搜索
const handleClearSearch = () => {
    searchKeyword.value = ''
    if (isMobile.value && isMobileSearchActive.value) {
        showSuggestions.value = true
    } else {
        showSuggestions.value = false
    }
}

// 选择搜索项
const selectSearchItem = (item: string) => {
    searchKeyword.value = item
    addToSearchHistory(item)
    showSuggestions.value = false
    if (isMobile.value) {
        isMobileSearchActive.value = false
    }
}

// 添加到搜索历史
const addToSearchHistory = (keyword: string) => {
    if (!keyword || keyword.trim() === '') return

    const history = searchHistory.value.filter(item => item !== keyword)
    history.unshift(keyword)
    searchHistory.value = history.slice(0, 10) // 最多保存10条
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清除搜索历史
const clearSearchHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
}

// 高亮文本
const highlightText = (text: string, keyword: string): string => {
    if (!keyword || !text) return text

    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 监听点击外部关闭建议
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.search-wrapper')) {
        showSuggestions.value = false
    }
}

// 获取用户信息
const fetchUserInfo = async () => {
    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            userInfo.value = JSON.parse(userStr)
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
    }
}

// 获取帖子列表
const fetchPosts = async () => {
    try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (!response.ok) {
            console.warn('获取帖子列表失败，状态码:', response.status)
            return
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('服务器返回非JSON响应')
            return
        }

        const data = await response.json()
        if (data.posts && Array.isArray(data.posts)) {
            allPosts.value = data.posts.map((post: any) => ({
                id: post.id,
                title: post.title || '无标题',
                content: post.content || '',
                image: post.image || (Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : ''),
                images: Array.isArray(post.images) ? post.images : [],
                author: {
                    id: post.author?.id || 0,
                    name: post.author?.name || '匿名用户',
                    avatar: post.author?.avatar || '',
                },
                likesCount: post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                createdAt: post.createdAt || new Date().toISOString(),
            }))
        } else {
            console.warn('API返回的数据格式不正确:', data)
            allPosts.value = []
        }
    } catch (error) {
        console.error('获取帖子列表失败:', error)
        allPosts.value = []
    }
}

// 获取帖子图片（优先使用image字段，否则使用images数组的第一张）
const getPostImage = (post: any) => {
    if (post.image) {
        return post.image
    }
    if (Array.isArray(post.images) && post.images.length > 0) {
        return post.images[0]
    }
    // 默认占位图
    return 'https://via.placeholder.com/400x500/ffc7d1/ffffff?text=No+Image'
}

// 格式化时间
const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 加载搜索历史
const loadSearchHistory = () => {
    try {
        const history = localStorage.getItem('searchHistory')
        if (history) {
            searchHistory.value = JSON.parse(history)
        }
    } catch (error) {
        console.error('加载搜索历史失败:', error)
    }
}

// 导航方法
const goToShop = () => {
    ElMessage.info('商城功能开发中')
}

const goToAdd = () => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录后再发布攻略')
        router.push('/login')
        return
    }
    router.push('/add')
}

const goToProfile = () => {
    router.push('/mine')
}

const viewPost = (postId: number) => {
    router.push(`/post/${postId}`)
}

onMounted(() => {
    fetchUserInfo()
    fetchPosts()
    loadSearchHistory()
    document.addEventListener('click', handleClickOutside)
    
    // 监听页面可见性变化，当页面重新可见时刷新帖子列表
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            fetchPosts()
        }
    })
})

// 组件卸载时移除事件监听
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('visibilitychange', fetchPosts)
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
})
</script>

<style scoped>
.home-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 80px;
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
    top: 50%;
    left: 5%;
    animation-delay: 7s;
    opacity: 0.2;
}

.sakura-3 {
    width: 45px;
    height: 45px;
    bottom: 30%;
    right: 15%;
    animation-delay: 14s;
    opacity: 0.25;
}

@keyframes sakura-float {

    0%,
    100% {
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
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

/* 移动端搜索激活状态 */
.top-nav.search-active {
    padding: 12px 16px;
}

.brand-title {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: 1px;
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
}

.search-input {
    width: 200px;
    transition: all 0.3s ease;
}

/* 移动端搜索触发按钮 */
.mobile-search-trigger {
    display: none;
    cursor: pointer;
    color: #666;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.mobile-search-trigger:hover {
    background: rgba(231, 84, 128, 0.1);
    color: #e75480;
}

/* 移动端取消按钮 */
.mobile-search-cancel {
    display: none;
    color: #e75480;
    font-size: 16px;
    padding: 0 8px;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;
}

/* 移动端搜索遮罩 */
.mobile-search-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 99;
    backdrop-filter: blur(2px);
}

:deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 4px 8px rgba(231, 84, 128, 0.15);
    border-color: #e75480;
}

:deep(.el-input__prefix) {
    color: #e75480;
}

/* 搜索建议框 */
.search-suggestions {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    border: 1px solid rgba(231, 84, 128, 0.1);
    transition: all 0.3s ease;
}

/* 移动端全屏搜索建议 */
.search-suggestions.mobile-full {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: none;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: 1px solid rgba(231, 84, 128, 0.1);
}

.suggestion-section {
    padding: 8px 0;
}

.suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    font-size: 12px;
    color: #999;
    font-weight: 500;
}

.clear-history {
    color: #e75480;
    cursor: pointer;
    transition: opacity 0.2s;
}

.clear-history:hover {
    opacity: 0.7;
}

.suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 14px;
    color: #333;
}

.suggestion-item:hover {
    background: rgba(231, 84, 128, 0.08);
}

.suggestion-item .el-icon {
    color: #e75480;
    font-size: 16px;
}

.user-avatar {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.user-avatar:hover {
    transform: scale(1.1);
}

/* 社交板块 */
.social-board {
    flex: 1;
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
    opacity: 0.5;
    margin-bottom: 20px;
}

.empty-text {
    font-size: 18px;
    color: #666;
    margin: 0 0 8px 0;
    font-weight: 500;
}

.empty-hint {
    font-size: 14px;
    color: #999;
    margin: 0 0 24px 0;
}

/* 高亮文本 */
:deep(.highlight) {
    background: linear-gradient(135deg, rgba(231, 84, 128, 0.2), rgba(255, 107, 157, 0.2));
    color: #e75480;
    font-weight: 600;
    padding: 2px 4px;
    border-radius: 4px;
}

.posts-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 0 20px;
}

.post-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.3s ease;
}

.post-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(231, 84, 128, 0.15);
}

.post-image {
    position: relative;
    width: 100%;
    padding-top: 125%;
    /* 4:5 比例 */
    overflow: hidden;
    background: linear-gradient(135deg, #ffeaea 0%, #fff5f5 100%);
}

.post-image img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
}

.post-content {
    padding: 16px;
}

.post-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.post-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.post-author {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.author-avatar {
    flex-shrink: 0;
    border: 2px solid rgba(231, 84, 128, 0.2);
}

.author-name {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.post-stats {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #999;
}

.stat-item .el-icon {
    color: #e75480;
}

.post-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

/* 底部导航栏 */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 12px 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    border-top: 1px solid rgba(231, 84, 128, 0.1);
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    color: #999;
    transition: all 0.2s ease;
    padding: 8px 20px;
    border-radius: 12px;
}

.nav-item:hover {
    color: #e75480;
    background: rgba(231, 84, 128, 0.05);
}

.nav-item span {
    font-size: 12px;
    font-weight: 500;
}

.add-btn {
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    color: white !important;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
    transform: translateY(-8px);
    padding: 0;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
}

/* 添加按钮的发光效果 */
.add-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: all 0.5s ease;
    opacity: 0;
}

.add-btn:hover {
    transform: translateY(-12px) scale(1.08);
    box-shadow: 0 8px 24px rgba(231, 84, 128, 0.5),
                0 0 30px rgba(255, 107, 157, 0.3);
    background: linear-gradient(135deg, #ff6b9d, #ff8fb3);
}

.add-btn:hover::before {
    width: 100px;
    height: 100px;
    opacity: 1;
}

.add-btn:active {
    transform: translateY(-10px) scale(1.05);
    transition: all 0.15s ease;
}

.add-btn :deep(.el-icon) {
    color: white !important;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;
}

.add-btn:hover :deep(.el-icon) {
    transform: rotate(90deg) scale(1.1);
}

/* 响应式设计 */
@media (max-width: 1024px) and (min-width: 769px) {
    .posts-container {
        grid-template-columns: repeat(3, 1fr);
        max-width: 1000px;
    }
}

@media (max-width: 768px) {

    /* 移动端搜索触发按钮显示 */
    .mobile-search-trigger {
        display: block;
    }

    /* 默认隐藏搜索框 */
    .search-input {
        width: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
        border: none;
        overflow: hidden;
    }

    /* 移动端搜索激活时显示搜索框 */
    .search-input.mobile-full {
        width: 100% !important;
        opacity: 1 !important;
        flex: 1;
    }

    .search-input.mobile-full :deep(.el-input__wrapper) {
        border-radius: 24px;
        height: 40px;
    }

    /* 移动端取消按钮显示 */
    .mobile-search-cancel {
        display: block;
    }

    /* 移动端遮罩显示 */
    .mobile-search-overlay {
        display: block;
    }

    /* 搜索激活时的导航栏 */
    .top-nav.search-active {
        padding: 12px 16px;
    }

    .top-nav.search-active .brand-title {
        display: none;
    }

    .top-nav.search-active .user-avatar {
        display: none;
    }

    .top-nav.search-active .mobile-search-trigger {
        display: none;
    }

    .top-nav.search-active .search-wrapper {
        width: 100%;
    }

    .search-suggestions {
        max-height: 300px;
    }

    .suggestion-item {
        padding: 14px 16px;
        font-size: 14px;
        min-height: 48px;
        display: flex;
        align-items: center;
    }

    .suggestion-item .el-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .brand-title {
        font-size: 20px;
    }

    .posts-container {
        grid-template-columns: repeat(2, 1fr);
        padding: 0 12px;
        gap: 12px;
    }

    .post-title {
        font-size: 14px;
    }

    .post-content {
        padding: 12px;
    }

    .author-name {
        font-size: 12px;
    }

    /* 搜索建议在移动端优化 */
    .search-suggestions.mobile-full {
        padding-bottom: 80px;
        /* 为底部导航栏留出空间 */
        -webkit-overflow-scrolling: touch;
        /* iOS 平滑滚动 */
    }

    .suggestion-header {
        padding: 12px 16px;
        font-size: 13px;
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        z-index: 1;
        border-bottom: 1px solid rgba(231, 84, 128, 0.1);
    }
}

@media (max-width: 480px) {
    .nav-actions {
        gap: 6px;
    }

    .top-nav {
        padding: 12px 12px;
    }

    .top-nav.search-active {
        padding: 10px 12px;
    }

    .search-input.mobile-full {
        font-size: 16px;
        /* 防止iOS缩放 */
    }

    .search-suggestions {
        max-height: calc(100vh - 60px);
    }

    .search-suggestions.mobile-full {
        top: 52px;
        padding-bottom: 20px;
    }

    /* 小屏设备优化 */
    .mobile-search-cancel {
        font-size: 14px;
        padding: 0 4px;
    }

    .search-input.mobile-full :deep(.el-input__wrapper) {
        height: 38px;
        font-size: 16px;
        /* 防止iOS自动缩放 */
    }

    .suggestion-item {
        padding: 12px 14px;
        font-size: 14px;
        min-height: 52px;
    }

    .suggestion-item .el-icon {
        font-size: 20px;
    }

    .mobile-search-cancel {
        font-size: 15px;
        padding: 0 6px;
    }

    .empty-state {
        padding: 60px 20px;
    }

    .empty-icon {
        font-size: 48px !important;
    }

    .empty-text {
        font-size: 16px;
    }

    .empty-hint {
        font-size: 12px;
    }

    .nav-item {
        padding: 8px 12px;
    }

    .nav-item span {
        font-size: 11px;
    }

    .posts-container {
        grid-template-columns: repeat(2, 1fr);
        padding: 0 8px;
        gap: 8px;
    }

    .post-title {
        font-size: 12px;
    }

    .post-content {
        padding: 10px;
    }

    .author-avatar {
        width: 28px !important;
        height: 28px !important;
    }

    .author-name {
        font-size: 11px;
    }
}
</style>