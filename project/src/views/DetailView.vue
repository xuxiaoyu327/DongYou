<template>
    <div class="detail-page">
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
            <h1 class="page-title">攻略详情</h1>
            <div class="nav-right"></div>
        </header>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p>加载中...</p>
        </div>

        <!-- 内容区域 -->
        <main v-else-if="post" class="detail-content">
            <!-- 基本信息 -->
            <div class="post-info">
                <!-- 图片轮播 -->
                <div v-if="post.images && post.images.length > 0" class="post-images">
                    <el-carousel v-if="post.images.length > 1" height="400px" indicator-position="outside">
                        <el-carousel-item v-for="(image, index) in post.images" :key="index">
                            <img :src="image" :alt="`${post.title} - 图片${Number(index) + 1}`" class="carousel-image" />
                        </el-carousel-item>
                    </el-carousel>
                    <img v-else :src="post.images[0]" :alt="post.title" class="single-image" />
                </div>

                <!-- 标题 -->
                <h1 class="post-title">{{ post.title }}</h1>

                <!-- 作者信息 -->
                <div class="author-info">
                    <el-avatar :size="40" :src="post.author?.avatar" class="author-avatar">
                        {{ post.author?.name?.charAt(0) || 'A' }}
                    </el-avatar>
                    <div class="author-details">
                        <div class="author-name">{{ post.author?.name || '匿名用户' }}</div>
                        <div class="post-time">{{ formatTime(post.createdAt) }}</div>
                    </div>
                </div>

                <!-- 攻略内容 -->
                <div class="post-content">
                    <p class="content-text">{{ post.content }}</p>
                </div>
            </div>

            <!-- 点赞和评论功能 -->
            <div class="interaction-section">
                <!-- 点赞按钮 -->
                <div class="like-section">
                    <el-button 
                        :type="isLiked ? 'danger' : 'default'" 
                        circle
                        :loading="likeLoading"
                        @click="handleLike"
                        class="like-btn">
                        <el-icon :size="20">
                            <StarFilled v-if="isLiked" />
                            <Star v-else />
                        </el-icon>
                    </el-button>
                    <span class="like-count">{{ post.likesCount || 0 }}</span>
                </div>

                <!-- 评论区域 -->
                <div class="comments-section">
                    <div class="comments-header">
                        <h3>评论 ({{ post.commentsCount || 0 }})</h3>
                    </div>

                    <!-- 评论输入框 -->
                    <div class="comment-input-section">
                        <el-input
                            v-model="commentText"
                            type="textarea"
                            :rows="3"
                            placeholder="写下你的评论..."
                            maxlength="500"
                            show-word-limit
                            class="comment-input"
                        />
                        <el-button 
                            type="primary" 
                            :disabled="!commentText.trim() || commentLoading"
                            :loading="commentLoading"
                            @click="handleComment"
                            class="comment-submit-btn">
                            发布评论
                        </el-button>
                    </div>

                    <!-- 评论列表 -->
                    <div class="comments-list">
                        <div v-if="comments.length === 0" class="empty-comments">
                            <el-icon :size="48" class="empty-icon">
                                <ChatLineRound />
                            </el-icon>
                            <p>暂无评论，快来抢沙发吧~</p>
                        </div>
                        <div v-for="comment in comments" :key="comment.id" class="comment-item">
                            <el-avatar :size="36" :src="comment.userAvatar" class="comment-avatar">
                                {{ comment.userName?.charAt(0) || 'U' }}
                            </el-avatar>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-user-name">{{ comment.userName }}</span>
                                    <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                                </div>
                                <div class="comment-text">{{ comment.content }}</div>
                            </div>
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
            <p class="error-text">加载失败，请稍后再试</p>
            <el-button type="primary" @click="fetchPostDetail">重试</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, Star, StarFilled, ChatLineRound, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const loading = ref(true)
const post = ref<any>(null)
const comments = ref<any[]>([])
const isLiked = ref(false)
const likeLoading = ref(false)
const commentText = ref('')
const commentLoading = ref(false)

// 返回上一页
const goBack = () => {
    router.back()
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
    
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 获取帖子详情
const fetchPostDetail = async () => {
    const postId = route.params.id
    if (!postId) {
        ElMessage.error('无效的帖子ID')
        router.back()
        return
    }

    loading.value = true
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (!response.ok) {
            if (response.status === 404) {
                ElMessage.error('帖子不存在')
                setTimeout(() => router.back(), 1500)
                return
            }
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '获取帖子详情失败')
        }

        const data = await response.json()
        if (!data.post) {
            throw new Error('帖子数据格式错误')
        }

        post.value = data.post

        // 并行获取点赞状态和评论列表
        await Promise.all([
            checkLikeStatus(),
            fetchComments()
        ])
    } catch (error) {
        console.error('获取帖子详情失败:', error)
        ElMessage.error(error instanceof Error ? error.message : '加载失败，请稍后再试')
        post.value = null
    } finally {
        loading.value = false
    }
}

// 检查点赞状态
const checkLikeStatus = async () => {
    const postId = route.params.id
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/like-status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (response.ok) {
            const data = await response.json()
            isLiked.value = data.liked || false
        }
    } catch (error) {
        console.error('检查点赞状态失败:', error)
    }
}

// 处理点赞
const handleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
    }

    const postId = route.params.id
    likeLoading.value = true

    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '操作失败')
        }

        const data = await response.json()
        isLiked.value = data.liked
        
        // 重新获取帖子详情以获取最新的点赞数
        await refreshPostData()
        
        ElMessage.success(data.message || (data.liked ? '点赞成功' : '已取消点赞'))
    } catch (error) {
        console.error('点赞操作失败:', error)
        ElMessage.error(error instanceof Error ? error.message : '操作失败，请稍后再试')
    } finally {
        likeLoading.value = false
    }
}

// 刷新帖子数据
const refreshPostData = async () => {
    const postId = route.params.id
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (response.ok) {
            const data = await response.json()
            if (data.post && post.value) {
                // 只更新统计数据，保留其他数据
                post.value.likesCount = data.post.likesCount || 0
                post.value.commentsCount = data.post.commentsCount || 0
            }
        }
    } catch (error) {
        console.error('刷新帖子数据失败:', error)
    }
}

// 获取评论列表
const fetchComments = async () => {
    const postId = route.params.id
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`)

        if (response.ok) {
            const data = await response.json()
            comments.value = data.comments || []
        }
    } catch (error) {
        console.error('获取评论列表失败:', error)
    }
}

// 发布评论
const handleComment = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
    }

    if (!commentText.value.trim()) {
        ElMessage.warning('请输入评论内容')
        return
    }

    const postId = route.params.id
    commentLoading.value = true
    const commentContent = commentText.value.trim()

    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: commentContent,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '评论失败')
        }

        const data = await response.json()
        ElMessage.success(data.message || '评论成功')
        commentText.value = ''

        // 如果有返回的新评论，直接添加到列表（避免重新加载）
        if (data.comment) {
            comments.value.push({
                id: data.comment.id,
                postId: data.comment.postId,
                userId: data.comment.userId,
                userName: data.comment.userName,
                userAvatar: data.comment.userAvatar || '',
                content: data.comment.content,
                createdAt: data.comment.createdAt || new Date().toISOString(),
            })
        } else {
            // 否则重新获取评论列表
            await fetchComments()
        }

        // 更新评论数
        if (post.value) {
            post.value.commentsCount = data.commentsCount !== undefined 
                ? data.commentsCount 
                : (post.value.commentsCount || 0) + 1
        }
        
        // 刷新帖子数据以确保数据一致性
        await refreshPostData()
    } catch (error) {
        console.error('发布评论失败:', error)
        ElMessage.error(error instanceof Error ? error.message : '评论失败，请稍后再试')
    } finally {
        commentLoading.value = false
    }
}

onMounted(() => {
    fetchPostDetail()
})
</script>

<style scoped>
.detail-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 20px;
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

/* 内容区域 */
.detail-content {
    flex: 1;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 20px;
    z-index: 1;
    position: relative;
}

.post-info {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
    margin-bottom: 24px;
}

/* 图片区域 */
.post-images {
    margin-bottom: 24px;
    border-radius: 16px;
    overflow: hidden;
}

.carousel-image,
.single-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.single-image {
    max-height: 500px;
    display: block;
}

/* 标题 */
.post-title {
    font-size: 28px;
    font-weight: 700;
    color: #333;
    margin: 0 0 24px 0;
    line-height: 1.4;
}

/* 作者信息 */
.author-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(231, 84, 128, 0.1);
}

.author-avatar {
    flex-shrink: 0;
    border: 2px solid rgba(231, 84, 128, 0.2);
}

.author-details {
    flex: 1;
}

.author-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}

.post-time {
    font-size: 14px;
    color: #999;
}

/* 内容 */
.post-content {
    margin-bottom: 24px;
}

.content-text {
    font-size: 16px;
    line-height: 1.8;
    color: #555;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
}

/* 互动区域 */
.interaction-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
}

/* 点赞区域 */
.like-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(231, 84, 128, 0.1);
}

.like-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
}

.like-count {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

/* 评论区域 */
.comments-section {
    width: 100%;
}

.comments-header {
    margin-bottom: 20px;
}

.comments-header h3 {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

/* 评论输入 */
.comment-input-section {
    margin-bottom: 32px;
}

.comment-input {
    margin-bottom: 12px;
}

.comment-submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border: none;
    border-radius: 20px;
    padding: 12px;
    font-weight: 500;
}

/* 评论列表 */
.comments-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.empty-comments {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.empty-icon {
    color: #e75480;
    opacity: 0.3;
    margin-bottom: 16px;
}

.empty-comments p {
    color: #999;
    font-size: 14px;
    margin: 0;
}

.comment-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(231, 84, 128, 0.03);
    border-radius: 12px;
}

.comment-avatar {
    flex-shrink: 0;
    border: 2px solid rgba(231, 84, 128, 0.2);
}

.comment-content {
    flex: 1;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.comment-user-name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
}

.comment-time {
    font-size: 12px;
    color: #999;
}

.comment-text {
    font-size: 15px;
    line-height: 1.6;
    color: #555;
    white-space: pre-wrap;
    word-wrap: break-word;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .detail-content {
        padding: 16px 12px;
    }

    .post-info,
    .interaction-section {
        padding: 20px;
        border-radius: 16px;
    }

    .post-title {
        font-size: 22px;
    }

    .content-text {
        font-size: 15px;
    }

    .post-images {
        margin-bottom: 20px;
    }

    .single-image {
        max-height: 300px;
    }

    :deep(.el-carousel) {
        height: 300px !important;
    }
}

@media (max-width: 480px) {
    .top-nav {
        padding: 10px 16px;
    }

    .page-title {
        font-size: 16px;
    }

    .post-info,
    .interaction-section {
        padding: 16px;
    }

    .post-title {
        font-size: 20px;
    }

    .author-name {
        font-size: 15px;
    }

    .post-time {
        font-size: 12px;
    }

    .content-text {
        font-size: 14px;
    }
}
</style>
