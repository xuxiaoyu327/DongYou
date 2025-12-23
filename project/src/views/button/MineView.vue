<template>
    <div class="mine-page">
        <!-- 背景装饰 -->
        <div class="background-decoration">
            <div class="sakura sakura-1"></div>
            <div class="sakura sakura-2"></div>
        </div>

        <!-- 顶部导航栏 -->
        <header class="top-nav">
            <div class="nav-left">
                <el-icon :size="24" class="home-icon" @click="goToHome" title="返回首页">
                    <House />
                </el-icon>
            </div>
            <h1 class="page-title">我的</h1>
            <div class="nav-right">
                <el-icon :size="24" class="settings-icon" @click="showSettings = true">
                    <Setting />
                </el-icon>
            </div>
        </header>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p>加载中...</p>
        </div>

        <!-- 内容区域 -->
        <main v-else-if="userInfo" class="mine-content">
            <!-- 用户信息卡片 -->
            <div class="user-card">
                <!-- 背景图片 -->
                <div 
                    class="background-image" 
                    :style="backgroundImageStyle">
                    <div class="background-overlay"></div>
                </div>

                <!-- 用户信息 -->
                <div class="user-info">
                    <div class="avatar-wrapper" @click="showEditAvatar = true">
                        <el-avatar 
                            :size="80" 
                            :src="userInfo.avatar || DEFAULT_AVATAR" 
                            class="user-avatar">
                            {{ userInfo.name?.charAt(0) || 'U' }}
                        </el-avatar>
                        <div class="avatar-edit-icon">
                            <el-icon :size="20"><Camera /></el-icon>
                        </div>
                    </div>
                    <h2 class="user-name">{{ userInfo.name || '未设置昵称' }}</h2>
                    <div class="user-meta">
                        <span v-if="userInfo.gender" class="gender-badge" :class="userInfo.gender">
                            <el-icon v-if="genderIcon" :size="14">
                                <component :is="genderIcon" />
                            </el-icon>
                            {{ genderText }}
                        </span>
                    </div>
                    <div class="bio-wrapper" @click="showEditBio = true">
                        <p v-if="userInfo.bio" class="user-bio">{{ userInfo.bio }}</p>
                        <p v-else class="user-bio placeholder">这个人很懒，还没有设置个性签名~</p>
                        <el-icon class="bio-edit-icon" :size="16"><Edit /></el-icon>
                    </div>
                </div>

                <!-- 统计数据 -->
                <div class="stats-section">
                    <div class="stat-item" @click="activeTab = 'posts'">
                        <div class="stat-value">{{ userInfo.stats?.postsCount || 0 }}</div>
                        <div class="stat-label">我的攻略</div>
                    </div>
                    <div class="stat-item" @click="activeTab = 'likes'">
                        <div class="stat-value">{{ userInfo.stats?.likesCount || 0 }}</div>
                        <div class="stat-label">我的点赞</div>
                    </div>
                    <div class="stat-item" @click="activeTab = 'comments'">
                        <div class="stat-value">{{ userInfo.stats?.commentsCount || 0 }}</div>
                        <div class="stat-label">我的评论</div>
                    </div>
                </div>
            </div>

            <!-- 内容标签页 -->
            <div class="tabs-section">
                <div class="tabs-header">
                    <div 
                        class="tab-item" 
                        :class="{ active: activeTab === 'posts' }"
                        @click="activeTab = 'posts'">
                        我的攻略
                    </div>
                    <div 
                        class="tab-item" 
                        :class="{ active: activeTab === 'likes' }"
                        @click="activeTab = 'likes'">
                        我的点赞
                    </div>
                    <div 
                        class="tab-item" 
                        :class="{ active: activeTab === 'comments' }"
                        @click="activeTab = 'comments'">
                        我的评论
                    </div>
                </div>

                <!-- 我的攻略 -->
                <div v-if="activeTab === 'posts'" class="tab-content">
                    <div v-if="myPosts.length === 0" class="empty-state">
                        <el-icon :size="64" class="empty-icon">
                            <Document />
                        </el-icon>
                        <p class="empty-text">还没有发布过攻略</p>
                        <el-button type="primary" @click="goToAdd">去发布</el-button>
                    </div>
                    <div v-else class="posts-grid">
                        <div 
                            v-for="post in myPosts" 
                            :key="post.id" 
                            class="post-item">
                            <img 
                                :src="post.image || DEFAULT_IMAGE" 
                                :alt="post.title" 
                                @click="viewPost(post.id)"
                                @error="handleImageError"
                                loading="lazy" />
                            <div class="post-overlay">
                                <div class="post-stats">
                                    <span @click.stop="viewPost(post.id)">
                                        <el-icon><Star /></el-icon> {{ post.likesCount || 0 }}
                                    </span>
                                    <span @click.stop="viewPost(post.id)">
                                        <el-icon><ChatLineRound /></el-icon> {{ post.commentsCount || 0 }}
                                    </span>
                                </div>
                                <el-button 
                                    type="danger" 
                                    :icon="Delete" 
                                    circle 
                                    size="small"
                                    class="delete-post-btn"
                                    @click.stop="handleDeletePost(post.id)"
                                    :loading="deletingPostId === post.id">
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 我的点赞 -->
                <div v-if="activeTab === 'likes'" class="tab-content">
                    <div v-if="myLikes.length === 0" class="empty-state">
                        <el-icon :size="64" class="empty-icon">
                            <Star />
                        </el-icon>
                        <p class="empty-text">还没有点赞过任何攻略</p>
                    </div>
                    <div v-else class="posts-grid">
                        <div 
                            v-for="post in myLikes" 
                            :key="post.id" 
                            class="post-item">
                            <img 
                                :src="post.image || DEFAULT_IMAGE" 
                                :alt="post.title" 
                                @click="viewPost(post.id)"
                                @error="handleImageError"
                                loading="lazy" />
                            <div class="post-overlay">
                                <div class="post-stats">
                                    <span @click.stop="viewPost(post.id)">
                                        <el-icon><Star /></el-icon> {{ post.likesCount || 0 }}
                                    </span>
                                    <span @click.stop="viewPost(post.id)">
                                        <el-icon><ChatLineRound /></el-icon> {{ post.commentsCount || 0 }}
                                    </span>
                                </div>
                                <el-button 
                                    type="warning" 
                                    :icon="StarFilled" 
                                    circle 
                                    size="small"
                                    class="unlike-btn"
                                    @click.stop="handleUnlike(post.id)"
                                    :loading="unlikingPostId === post.id"
                                    title="取消点赞">
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 我的评论 -->
                <div v-if="activeTab === 'comments'" class="tab-content">
                    <div v-if="myComments.length === 0" class="empty-state">
                        <el-icon :size="64" class="empty-icon">
                            <ChatLineRound />
                        </el-icon>
                        <p class="empty-text">还没有发表过评论</p>
                    </div>
                    <div v-else class="comments-list">
                        <div 
                            v-for="comment in myComments" 
                            :key="comment.id" 
                            class="comment-item">
                            <div class="comment-post-info" @click="viewPost(comment.postId)">
                                <img 
                                    :src="comment.post?.image || DEFAULT_IMAGE" 
                                    :alt="comment.post?.title"
                                    @error="handleImageError"
                                    loading="lazy" />
                                <div class="comment-post-title">{{ comment.post?.title }}</div>
                            </div>
                            <div class="comment-content">
                                <p class="comment-text" @click="viewPost(comment.postId)">{{ comment.content }}</p>
                                <div class="comment-footer">
                                    <div class="comment-time">{{ formatTime(comment.createdAt) }}</div>
                                    <el-button 
                                        type="danger" 
                                        :icon="Delete" 
                                        size="small" 
                                        text
                                        @click="handleDeleteComment(comment.id)"
                                        :loading="deletingCommentId === comment.id">
                                        删除
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 编辑头像对话框 -->
        <el-dialog v-model="showEditAvatar" title="编辑头像" width="90%" class="edit-dialog">
            <div class="avatar-edit-content">
                <el-upload
                    :action="`${API_BASE}/api/upload`"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                    :on-success="handleAvatarSuccess"
                    :on-error="handleAvatarError"
                    accept="image/*"
                    class="avatar-uploader">
                    <el-avatar :size="120" :src="avatarPreview || userInfo?.avatar || DEFAULT_AVATAR" class="preview-avatar">
                        {{ userInfo?.name?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="upload-tip">点击上传头像</div>
                </el-upload>
                <el-input
                    v-model="avatarUrl"
                    placeholder="或输入图片URL"
                    class="avatar-url-input"
                    clearable>
                    <template #prepend>URL</template>
                </el-input>
            </div>
            <template #footer>
                <el-button @click="showEditAvatar = false">取消</el-button>
                <el-button type="primary" @click="saveAvatar" :loading="savingAvatar">保存</el-button>
            </template>
        </el-dialog>

        <!-- 编辑个性签名对话框 -->
        <el-dialog v-model="showEditBio" title="编辑个性签名" width="90%" class="edit-dialog">
            <el-input
                v-model="bioText"
                type="textarea"
                :rows="4"
                placeholder="输入你的个性签名..."
                maxlength="200"
                show-word-limit
                class="bio-input">
            </el-input>
            <template #footer>
                <el-button @click="showEditBio = false">取消</el-button>
                <el-button type="primary" @click="saveBio" :loading="savingBio">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
    Setting, 
    Loading, 
    Male, 
    Female, 
    Document, 
    Star, 
    StarFilled,
    ChatLineRound,
    Camera,
    Edit,
    Delete,
    House
} from '@element-plus/icons-vue'

// ==================== 类型定义 ====================
interface UserInfo {
    id: number
    name: string
    avatar: string
    gender: string
    bio: string
    backgroundImage: string
    stats?: {
        postsCount: number
        likesCount: number
        commentsCount: number
    }
}

interface Post {
    id: number
    title: string
    content: string
    image: string
    images: string[]
    likesCount: number
    commentsCount: number
    createdAt: string
}

interface Comment {
    id: number
    postId: number
    content: string
    createdAt: string
    post?: {
        id: number
        title: string
        image: string
    }
}

type TabType = 'posts' | 'likes' | 'comments'
type StatKey = 'postsCount' | 'likesCount' | 'commentsCount'

// ==================== 常量定义 ====================
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const DEFAULT_AVATAR = '/id.jpeg'
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x500/ffc7d1/ffffff?text=No+Image'
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const GENDER_MAP: Record<string, string> = {
    'male': '男',
    'female': '女',
    'other': '其他'
}

const TAB_CONFIG: Record<TabType, { endpoint: string; dataKey: string }> = {
    posts: { endpoint: '/api/user/my-posts', dataKey: 'posts' },
    likes: { endpoint: '/api/user/my-likes', dataKey: 'posts' },
    comments: { endpoint: '/api/user/my-comments', dataKey: 'comments' }
}

// ==================== 路由和状态管理 ====================
const router = useRouter()

// 用户相关状态
const loading = ref(true)
const userInfo = ref<UserInfo | null>(null)

// 标签页和内容状态
const activeTab = ref<TabType>('posts')
const myPosts = ref<Post[]>([])
const myLikes = ref<Post[]>([])
const myComments = ref<Comment[]>([])

// UI 状态
const showSettings = ref(false)
const showEditAvatar = ref(false)
const showEditBio = ref(false)

// 编辑相关状态
const avatarPreview = ref('')
const avatarUrl = ref('')
const bioText = ref('')
const savingAvatar = ref(false)
const savingBio = ref(false)

// 操作加载状态
const deletingPostId = ref<number | null>(null)
const deletingCommentId = ref<number | null>(null)
const unlikingPostId = ref<number | null>(null)

// ==================== 计算属性 ====================
const backgroundImageStyle = computed(() => {
    if (!userInfo.value) return {}
    return {
        backgroundImage: userInfo.value.backgroundImage 
            ? `url(${userInfo.value.backgroundImage})` 
            : 'linear-gradient(135deg, #e75480 0%, #ff6b9d 100%)'
    }
})

const genderText = computed(() => {
    if (!userInfo.value?.gender) return ''
    return GENDER_MAP[userInfo.value.gender] || '其他'
})

const genderIcon = computed(() => {
    if (!userInfo.value?.gender) return null
    return userInfo.value.gender === 'male' ? Male : Female
})

// ==================== 工具函数 ====================
/**
 * 格式化时间显示
 */
const formatTime = (timeStr: string): string => {
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

/**
 * 获取认证请求头
 */
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token')
    if (!token) {
        throw new Error('未登录')
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    }
}

/**
 * 处理认证错误
 */
const handleAuthError = (): void => {
    ElMessage.warning('登录已过期，请重新登录')
    router.push('/login')
}

/**
 * 统一处理 API 错误
 */
const handleApiError = (error: unknown, defaultMessage: string): void => {
    console.error(defaultMessage, error)
    const message = error instanceof Error ? error.message : defaultMessage
    ElMessage.error(message)
}

/**
 * 检查是否为取消操作
 */
const isCancelError = (error: unknown): boolean => {
    return error === 'cancel' || (error instanceof Error && error.message === 'cancel')
}

/**
 * 统一处理 API 响应
 */
const handleApiResponse = async <T>(response: Response, errorMessage: string): Promise<T> => {
    if (!response.ok) {
        if (response.status === 401) {
            handleAuthError()
            throw new Error('未登录')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorMessage)
    }
    return response.json()
}

// ==================== API 调用函数 ====================
/**
 * 获取用户信息
 */
const fetchUserInfo = async (): Promise<void> => {
    try {
        const token = localStorage.getItem('token')
        if (!token) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        const response = await fetch(`${API_BASE}/api/user/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })

        const data = await handleApiResponse<UserInfo>(response, '获取用户信息失败')
        userInfo.value = data

        // 加载默认标签页数据
        await loadTabData()
    } catch (error) {
        if (error instanceof Error && error.message !== '未登录') {
            handleApiError(error, '加载失败，请稍后再试')
        }
    } finally {
        loading.value = false
    }
}

/**
 * 通用数据获取函数
 */
const fetchTabData = async (endpoint: string, dataKey: string): Promise<any[]> => {
    try {
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}${endpoint}`, { headers })
        const data = await handleApiResponse<Record<string, any>>(response, '获取数据失败')
        return data[dataKey] || []
    } catch (error) {
        if (error instanceof Error && error.message !== '未登录') {
            handleApiError(error, '获取数据失败')
        }
        return []
    }
}

/**
 * 加载当前标签页数据
 */
const loadTabData = async (): Promise<void> => {
    const config = TAB_CONFIG[activeTab.value]
    if (!config) return

    const data = await fetchTabData(config.endpoint, config.dataKey)
    
    switch (activeTab.value) {
        case 'posts':
            myPosts.value = data
            break
        case 'likes':
            myLikes.value = data
            break
        case 'comments':
            myComments.value = data
            break
    }
}

/**
 * 监听标签页切换，懒加载数据
 */
const watchTab = async (newTab: TabType): Promise<void> => {
    const config = TAB_CONFIG[newTab]
    if (!config) return

    // 检查数据是否已加载
    const isDataLoaded = 
        (newTab === 'posts' && myPosts.value.length > 0) ||
        (newTab === 'likes' && myLikes.value.length > 0) ||
        (newTab === 'comments' && myComments.value.length > 0)

    if (!isDataLoaded) {
        await loadTabData()
    }
}

// ==================== 事件处理函数 ====================
/**
 * 图片加载错误处理
 */
const handleImageError = (event: Event): void => {
    const img = event.target as HTMLImageElement
    if (img.src !== DEFAULT_IMAGE) {
        img.src = DEFAULT_IMAGE
    }
}

/**
 * 查看帖子详情
 */
const viewPost = (postId: number): void => {
    router.push(`/post/${postId}`)
}

/**
 * 跳转到发布页面
 */
const goToAdd = (): void => {
    router.push('/add')
}

/**
 * 返回首页
 */
const goToHome = (): void => {
    router.push('/main')
}

// ==================== 头像编辑相关 ====================
/**
 * 头像上传前验证
 */
const beforeAvatarUpload = (file: File): boolean => {
    const isImage = file.type.startsWith('image/')
    const isLtMaxSize = file.size < MAX_AVATAR_SIZE

    if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
    }
    if (!isLtMaxSize) {
        ElMessage.error(`图片大小不能超过 ${MAX_AVATAR_SIZE / 1024 / 1024}MB!`)
        return false
    }

    // 创建预览并转换为base64
    const reader = new FileReader()
    reader.onload = (e) => {
        const result = e.target?.result as string
        avatarPreview.value = result
        // 如果URL输入框为空，自动填充预览URL
        if (!avatarUrl.value.trim()) {
            avatarUrl.value = result
        }
    }
    reader.onerror = () => {
        ElMessage.error('图片读取失败')
    }
    reader.readAsDataURL(file)
    return false // 阻止自动上传，我们手动处理
}

const handleAvatarSuccess = (): void => {
    // 上传成功处理（当前不使用自动上传）
}

const handleAvatarError = (): void => {
    ElMessage.error('头像上传失败')
}

/**
 * 重置头像编辑对话框
 */
const resetAvatarDialog = (): void => {
    avatarPreview.value = ''
    avatarUrl.value = ''
}

/**
 * 保存头像
 */
const saveAvatar = async (): Promise<void> => {
    const avatar = avatarUrl.value.trim() || avatarPreview.value
    if (!avatar) {
        ElMessage.warning('请选择或输入头像')
        return
    }

    savingAvatar.value = true
    try {
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}/api/user/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ avatar }),
        })

        const data = await handleApiResponse<{ user: UserInfo }>(response, '更新失败')
        if (userInfo.value) {
            userInfo.value.avatar = data.user.avatar
        }
        ElMessage.success('头像更新成功')
        showEditAvatar.value = false
        resetAvatarDialog()
    } catch (error) {
        if (error instanceof Error && error.message === '未登录') {
            handleAuthError()
        } else {
            handleApiError(error, '更新失败，请稍后再试')
        }
    } finally {
        savingAvatar.value = false
    }
}

// ==================== 个性签名编辑相关 ====================
/**
 * 保存个性签名
 */
const saveBio = async (): Promise<void> => {
    const bio = bioText.value.trim()

    savingBio.value = true
    try {
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}/api/user/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ bio }),
        })

        const data = await handleApiResponse<{ user: UserInfo }>(response, '更新失败')
        if (userInfo.value) {
            userInfo.value.bio = data.user.bio
        }
        ElMessage.success('个性签名更新成功')
        showEditBio.value = false
        bioText.value = ''
    } catch (error) {
        if (error instanceof Error && error.message === '未登录') {
            handleAuthError()
        } else {
            handleApiError(error, '更新失败，请稍后再试')
        }
    } finally {
        savingBio.value = false
    }
}

// ==================== 监听器 ====================
/**
 * 监听个性签名编辑对话框状态
 */
watch(showEditBio, (show) => {
    if (show && userInfo.value) {
        bioText.value = userInfo.value.bio || ''
    } else if (!show) {
        bioText.value = ''
    }
})

/**
 * 监听头像编辑对话框状态
 */
watch(showEditAvatar, (show) => {
    if (!show) {
        resetAvatarDialog()
    }
})

/**
 * 监听标签页变化，懒加载数据
 */
watch(activeTab, watchTab, { immediate: false })

// ==================== 生命周期 ====================
onMounted(() => {
    fetchUserInfo()
})

// ==================== 删除和操作相关 ====================
/**
 * 通用删除确认函数
 */
const confirmDelete = (message: string, title = '确认删除'): Promise<void> => {
    return ElMessageBox.confirm(message, title, {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
    })
}

/**
 * 更新统计数据
 */
const updateStats = (key: StatKey, delta: number): void => {
    if (userInfo.value?.stats) {
        userInfo.value.stats[key] = Math.max((userInfo.value.stats[key] || 0) + delta, 0)
    }
}

/**
 * 删除攻略
 */
const handleDeletePost = async (postId: number): Promise<void> => {
    try {
        await confirmDelete('确定要删除这条攻略吗？删除后无法恢复。')

        deletingPostId.value = postId
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
            method: 'DELETE',
            headers,
        })

        await handleApiResponse(response, '删除失败')
        ElMessage.success('删除成功')
        myPosts.value = myPosts.value.filter(p => p.id !== postId)
        updateStats('postsCount', -1)
    } catch (error: unknown) {
        if (isCancelError(error)) {
            return
        }
        if (error instanceof Error && error.message === '未登录') {
            handleAuthError()
        } else {
            handleApiError(error, '删除失败，请稍后再试')
        }
    } finally {
        deletingPostId.value = null
    }
}

/**
 * 取消点赞
 */
const handleUnlike = async (postId: number): Promise<void> => {
    unlikingPostId.value = postId
    try {
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
            method: 'POST',
            headers,
        })

        const data = await handleApiResponse<{ liked: boolean }>(response, '操作失败')
        if (!data.liked) {
            ElMessage.success('已取消点赞')
            myLikes.value = myLikes.value.filter(p => p.id !== postId)
            updateStats('likesCount', -1)
        }
    } catch (error) {
        if (error instanceof Error && error.message === '未登录') {
            handleAuthError()
        } else {
            handleApiError(error, '操作失败，请稍后再试')
        }
    } finally {
        unlikingPostId.value = null
    }
}

/**
 * 删除评论
 */
const handleDeleteComment = async (commentId: number): Promise<void> => {
    try {
        await confirmDelete('确定要删除这条评论吗？')

        deletingCommentId.value = commentId
        const headers = getAuthHeaders()
        const response = await fetch(`${API_BASE}/api/comments/${commentId}`, {
            method: 'DELETE',
            headers,
        })

        await handleApiResponse(response, '删除失败')
        ElMessage.success('删除成功')
        myComments.value = myComments.value.filter(c => c.id !== commentId)
        updateStats('commentsCount', -1)
    } catch (error: unknown) {
        if (isCancelError(error)) {
            return
        }
        if (error instanceof Error && error.message === '未登录') {
            handleAuthError()
        } else {
            handleApiError(error, '删除失败，请稍后再试')
        }
    } finally {
        deletingCommentId.value = null
    }
}

// 监听标签页变化，懒加载数据
watch(activeTab, watchTab, { immediate: false })

// 组件挂载
onMounted(() => {
    fetchUserInfo()
})
</script>

<style scoped>
.mine-page {
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
    display: flex;
    align-items: center;
    flex: 0 0 auto;
}

.nav-right {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    flex: 1;
    text-align: center;
}

.home-icon,
.settings-icon {
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
}

.home-icon:hover,
.settings-icon:hover {
    color: #e75480;
    transform: scale(1.1);
}

.home-icon:active,
.settings-icon:active {
    transform: scale(0.95);
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
.mine-content {
    flex: 1;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 20px;
    z-index: 1;
    position: relative;
}

/* 用户卡片 */
.user-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
    margin-bottom: 24px;
    position: relative;
}

.background-image {
    width: 100%;
    height: 200px;
    background-size: cover;
    background-position: center;
    position: relative;
}

.background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
}

.user-info {
    padding: 20px;
    text-align: center;
    margin-top: -60px;
    position: relative;
    z-index: 2;
}

    .avatar-wrapper {
        position: relative;
        display: inline-block;
        cursor: pointer;
        margin-bottom: 12px;
        -webkit-tap-highlight-color: transparent;
        transition: transform 0.2s;
    }

    .avatar-wrapper:active {
        transform: scale(0.95);
    }

.user-avatar {
    border: 4px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-edit-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    background: #e75480;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-name {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin: 0 0 8px 0;
}

.user-meta {
    margin-bottom: 8px;
}

.gender-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    background: rgba(231, 84, 128, 0.1);
    color: #e75480;
}

    .bio-wrapper {
        position: relative;
        cursor: pointer;
        margin-top: 12px;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
        -webkit-tap-highlight-color: transparent;
    }

    .bio-wrapper:hover {
        background: rgba(231, 84, 128, 0.05);
    }

    .bio-wrapper:active {
        background: rgba(231, 84, 128, 0.1);
    }

.user-bio {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
    padding-right: 24px;
}

.user-bio.placeholder {
    color: #999;
    font-style: italic;
}

.bio-edit-icon {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    color: #999;
    opacity: 0.6;
    transition: all 0.2s;
}

.bio-wrapper:hover .bio-edit-icon {
    opacity: 1;
    color: #e75480;
}

/* 统计数据 */
.stats-section {
    display: flex;
    justify-content: space-around;
    padding: 20px;
    border-top: 1px solid rgba(231, 84, 128, 0.1);
}

    .stat-item {
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        padding: 8px;
        border-radius: 8px;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
    }

    .stat-item:hover {
        background: rgba(231, 84, 128, 0.05);
    }

    .stat-item:active {
        transform: scale(0.95);
    }

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #e75480;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #666;
}

/* 标签页 */
.tabs-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
}

.tabs-header {
    display: flex;
    border-bottom: 2px solid rgba(231, 84, 128, 0.1);
    margin-bottom: 20px;
}

    .tab-item {
        flex: 1;
        text-align: center;
        padding: 12px;
        font-size: 16px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
    }

    .tab-item:hover {
        color: #e75480;
    }

    .tab-item:active {
        transform: scale(0.95);
    }

.tab-item.active {
    color: #e75480;
    font-weight: 600;
}

.tab-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e75480;
}

.tab-content {
    min-height: 200px;
}

/* 空状态 */
.empty-state {
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

.empty-text {
    color: #999;
    font-size: 16px;
    margin-bottom: 20px;
}

/* 帖子网格 */
.posts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.post-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
}

.post-item:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.2);
}

.post-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: linear-gradient(135deg, #ffeaea 0%, #fff5f5 100%);
    transition: opacity 0.3s;
}

.post-item img[loading="lazy"] {
    opacity: 0;
    animation: fadeIn 0.3s ease-in forwards;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

.post-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    padding: 12px;
    color: white;
}

.post-stats {
    display: flex;
    gap: 16px;
    font-size: 14px;
}

.post-stats span {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.delete-post-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
}

.unlike-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
}

/* 评论列表 */
.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-item {
    padding: 16px;
    background: rgba(231, 84, 128, 0.03);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.comment-item:hover {
    background: rgba(231, 84, 128, 0.08);
}

.comment-post-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.comment-post-info img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    background: linear-gradient(135deg, #ffeaea 0%, #fff5f5 100%);
    flex-shrink: 0;
}

.comment-post-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.comment-content {
    padding-left: 72px;
}

.comment-text {
    font-size: 15px;
    color: #555;
    line-height: 1.6;
    margin: 0 0 8px 0;
}

.comment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}

.comment-time {
    font-size: 12px;
    color: #999;
}

/* 编辑对话框样式 */
.edit-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.avatar-edit-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.avatar-uploader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.preview-avatar {
    border: 4px solid #e75480;
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.2);
}

.upload-tip {
    font-size: 14px;
    color: #666;
    text-align: center;
}

.avatar-url-input {
    width: 100%;
}

.bio-input {
    width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .mine-page {
        padding-bottom: 0;
    }

    .mine-content {
        padding: 10px 8px;
    }

    .top-nav {
        padding: 12px 16px;
    }

    .page-title {
        padding: 0 8px;
    }

    .nav-left,
    .nav-right {
        padding: 0 8px;
    }

    .user-card {
        border-radius: 16px;
        margin-bottom: 16px;
    }

    .background-image {
        height: 150px;
    }

    .user-info {
        margin-top: -50px;
        padding: 16px 12px;
    }

    .avatar-wrapper {
        margin-bottom: 10px;
    }

    .user-avatar {
        width: 70px !important;
        height: 70px !important;
    }

    .avatar-edit-icon {
        width: 24px;
        height: 24px;
    }

    .avatar-edit-icon .el-icon {
        font-size: 14px !important;
    }

    .user-name {
        font-size: 18px;
        margin-bottom: 6px;
    }

    .user-meta {
        margin-bottom: 6px;
    }

    .gender-badge {
        font-size: 11px;
        padding: 3px 10px;
    }

    .bio-wrapper {
        margin-top: 8px;
        padding: 6px;
    }

    .user-bio {
        font-size: 13px;
        padding-right: 20px;
    }

    .bio-edit-icon {
        right: 6px;
        font-size: 14px !important;
    }

    .stats-section {
        padding: 16px 12px;
    }

    .stat-value {
        font-size: 20px;
    }

    .stat-label {
        font-size: 12px;
    }

    .posts-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .post-item {
        border-radius: 10px;
        -webkit-tap-highlight-color: transparent;
    }

    .post-item:active {
        transform: scale(0.98);
    }

    .post-overlay {
        padding: 8px;
    }

    .post-stats {
        font-size: 12px;
        gap: 12px;
    }

    .delete-post-btn,
    .unlike-btn {
        width: 28px;
        height: 28px;
        padding: 0;
    }

    .tabs-section {
        padding: 16px 12px;
        border-radius: 16px;
    }

    .tabs-header {
        margin-bottom: 16px;
    }

    .tab-item {
        font-size: 13px;
        padding: 10px 8px;
    }

    .comments-list {
        gap: 12px;
    }

    .comment-item {
        padding: 12px;
        border-radius: 10px;
        -webkit-tap-highlight-color: transparent;
    }

    .comment-item:active {
        transform: scale(0.98);
    }

    .comment-post-info {
        gap: 10px;
        margin-bottom: 10px;
    }

    .comment-post-info img {
        width: 50px;
        height: 50px;
    }

    .comment-post-title {
        font-size: 13px;
    }

    .comment-content {
        padding-left: 60px;
    }

    .comment-text {
        font-size: 14px;
        margin-bottom: 6px;
    }

    .comment-footer {
        margin-top: 6px;
    }

    .comment-time {
        font-size: 11px;
    }

    .edit-dialog {
        max-width: 95%;
    }

    .avatar-edit-content {
        gap: 16px;
    }

    .preview-avatar {
        width: 100px !important;
        height: 100px !important;
    }

    .upload-tip {
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .top-nav {
        padding: 10px 12px;
        min-height: 52px;
    }

    .page-title {
        font-size: 16px;
        padding: 0 4px;
    }

    .nav-left,
    .nav-right {
        padding: 0 4px;
    }

    .home-icon,
    .settings-icon {
        font-size: 20px !important;
    }

    .mine-content {
        padding: 8px 6px;
    }

    .user-card {
        margin-bottom: 12px;
    }

    .background-image {
        height: 120px;
    }

    .user-info {
        margin-top: -45px;
        padding: 12px 8px;
    }

    .user-avatar {
        width: 60px !important;
        height: 60px !important;
    }

    .avatar-edit-icon {
        width: 20px;
        height: 20px;
    }

    .avatar-edit-icon .el-icon {
        font-size: 12px !important;
    }

    .user-name {
        font-size: 16px;
    }

    .user-bio {
        font-size: 12px;
    }

    .stats-section {
        padding: 12px 8px;
    }

    .stat-value {
        font-size: 18px;
    }

    .stat-label {
        font-size: 11px;
    }

    .posts-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .post-overlay {
        padding: 6px;
    }

    .post-stats {
        font-size: 11px;
        gap: 8px;
    }

    .delete-post-btn,
    .unlike-btn {
        width: 24px;
        height: 24px;
    }

    .tabs-section {
        padding: 12px 8px;
    }

    .tab-item {
        font-size: 12px;
        padding: 8px 6px;
    }

    .comment-post-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .comment-post-info img {
        width: 100%;
        height: 120px;
        border-radius: 8px;
    }

    .comment-content {
        padding-left: 0;
        width: 100%;
    }

    .comment-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .preview-avatar {
        width: 80px !important;
        height: 80px !important;
    }
}
</style>
