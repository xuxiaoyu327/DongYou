<template>
    <div class="add-page">
        <!-- 极简背景 -->
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
            <h1 class="page-title">发布攻略</h1>
            <el-button class="publish-btn" type="primary" :loading="loading" :disabled="!canPublish"
                @click="handlePublish">
                发布
            </el-button>
        </header>

        <!-- 主要内容 -->
        <main class="add-content">
            <div class="editor-container">
                <!-- 标题输入 -->
                <div class="editor-section">
                    <el-input v-model="form.title" placeholder="添加标题..." class="title-input" maxlength="50"
                        show-word-limit :prefix-icon="EditPen" />
                </div>

                <!-- 图片上传 -->
                <div class="editor-section">
                    <div class="section-label">添加图片</div>
                    <el-upload v-model:file-list="imageList" action="#" list-type="picture-card" :auto-upload="false"
                        :limit="9" :on-preview="handlePictureCardPreview" :on-remove="handleRemove"
                        :on-change="handleImageChange" :before-upload="beforeUpload" accept="image/*"
                        class="image-uploader">
                        <el-icon>
                            <Plus />
                        </el-icon>
                    </el-upload>
                </div>

                <!-- 图片预览对话框 -->
                <el-dialog v-model="dialogVisible" width="90%" class="image-preview-dialog">
                    <img :src="dialogImageUrl" alt="预览" class="preview-image" />
                </el-dialog>

                <!-- 详细内容编辑 -->
                <div class="editor-section">
                    <div class="section-label">详细内容</div>
                    <el-input v-model="form.content" type="textarea" :rows="10" placeholder="分享你的旅行经历、美食体验、景点推荐..."
                        maxlength="2000" show-word-limit class="content-textarea" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus/es'
import { ArrowLeft, EditPen, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogImageUrl = ref('')
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

// 表单数据
const form = ref({
    title: '',
    content: '',
})

// 图片列表
const imageList = ref<UploadFile[]>([])

// 是否可以发布
const canPublish = computed(() => {
    return form.value.title.trim().length > 0 &&
        form.value.content.trim().length > 0 &&
        imageList.value.length > 0
})

// 检查登录状态
const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录后再发布攻略')
        router.push('/login')
        return false
    }
    return true
}

// 返回上一页
const goBack = () => {
    router.back()
}

// 图片预览
const handlePictureCardPreview = (file: UploadFile) => {
    dialogImageUrl.value = file.url || ''
    dialogVisible.value = true
}

// 移除图片
const handleRemove = (file: UploadFile) => {
    const index = imageList.value.findIndex(item => item.uid === file.uid)
    if (index > -1) {
        imageList.value.splice(index, 1)
    }
}

// 图片变化处理
const handleImageChange = (file: UploadFile, fileList: UploadFiles) => {
    // 限制最多9张图片
    if (fileList.length > 9) {
        ElMessage.warning('最多只能上传9张图片')
        imageList.value = fileList.slice(0, 9)
        return
    }

    // 如果是新上传的图片，创建预览URL
    if (file.raw) {
        const reader = new FileReader()
        reader.onload = (e) => {
            file.url = e.target?.result as string
        }
        reader.readAsDataURL(file.raw)
    }
}

// 上传前验证
const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5

    if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
    }
    if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB!')
        return false
    }
    return true
}

// 将文件转换为base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            // 移除data URL前缀，只保留base64字符串
            const base64 = result.split(',')[1] || result
            resolve(base64)
        }
        reader.onerror = (error) => {
            reject(error)
        }
        reader.readAsDataURL(file)
    })
}

// 发布攻略
const handlePublish = async () => {
    // 检查登录状态
    if (!checkAuth()) {
        return
    }

    // 验证表单
    if (!form.value.title.trim()) {
        ElMessage.warning('请输入标题')
        return
    }

    if (!form.value.content.trim()) {
        ElMessage.warning('请输入详细内容')
        return
    }

    if (imageList.value.length === 0) {
        ElMessage.warning('请至少上传一张图片')
        return
    }

    loading.value = true

    try {
        // 先上传图片
        const imageUrls: string[] = []

        // 将图片转换为base64格式，直接保存到数据库
        for (const file of imageList.value) {
            if (file.raw) {
                try {
                    // 将文件转换为base64
                    const base64 = await fileToBase64(file.raw)
                    // 添加data URL前缀
                    const dataUrl = `data:${file.raw.type || 'image/jpeg'};base64,${base64}`
                    imageUrls.push(dataUrl)
                } catch (error) {
                    console.warn('图片转换失败，使用预览URL:', error)
                    // 如果转换失败，使用预览URL
                    if (file.url) {
                        imageUrls.push(file.url)
                    }
                }
            } else if (file.url) {
                imageUrls.push(file.url)
            }
        }

        // 获取用户信息
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : {}

        // 提交攻略数据
        console.log('准备提交数据到:', `${API_BASE}/api/posts`)
        console.log('提交的数据:', {
            title: form.value.title.trim(),
            content: form.value.content.trim(),
            imagesCount: imageUrls.length,
            author: user.name || '匿名用户',
        })

        const response = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                title: form.value.title.trim(),
                content: form.value.content.trim(),
                images: imageUrls,
                author: {
                    name: user.name || '匿名用户',
                    avatar: user.avatar || '',
                },
            }),
        }).catch((fetchError) => {
            console.error('网络请求失败:', fetchError)
            throw new Error(`无法连接到服务器，请检查服务器是否运行在 ${API_BASE}`)
        })

        // 检查响应状态
        console.log('响应状态:', response.status, response.statusText)
        
        if (!response.ok) {
            // 尝试解析错误信息
            let errorMessage = '发布失败'
            try {
                const contentType = response.headers.get('content-type') || ''
                console.log('响应Content-Type:', contentType)
                
                if (contentType.includes('application/json')) {
                    const error = await response.json()
                    errorMessage = error.error || error.message || errorMessage
                    console.error('服务器返回错误:', error)
                } else {
                    const text = await response.text()
                    console.error('服务器返回非JSON错误响应 (状态码:', response.status, '):', text.substring(0, 500))
                    
                    // 如果是404，提供更友好的错误信息
                    if (response.status === 404) {
                        errorMessage = `API接口不存在 (404)。请确保服务器运行在 ${API_BASE}，并且路由 /api/posts 已配置。`
                    } else {
                        errorMessage = `服务器错误 (${response.status}): ${text.substring(0, 100)}`
                    }
                }
            } catch (parseError) {
                console.error('解析错误响应失败:', parseError)
                if (response.status === 404) {
                    errorMessage = `API接口不存在 (404)。请检查服务器配置。`
                } else {
                    errorMessage = `请求失败 (状态码: ${response.status})`
                }
            }
            throw new Error(errorMessage)
        }

        // 解析成功响应
        let result
        try {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                result = await response.json()
            } else {
                // 如果不是JSON，尝试解析文本
                const text = await response.text()
                console.warn('服务器返回非JSON响应，但状态码为200:', text.substring(0, 200))
                result = { message: '发布成功' }
            }
        } catch (parseError) {
            console.error('解析响应失败:', parseError)
            // 即使解析失败，如果状态码是200，也认为成功
            result = { message: '发布成功' }
        }
        
        console.log('发布成功:', result)

        ElMessage.success('发布成功！')

        // 清空表单
        form.value = {
            title: '',
            content: '',
        }
        imageList.value = []

        // 返回首页
        setTimeout(() => {
            router.push('/main')
        }, 1000)
    } catch (error) {
        console.error('发布失败:', error)
        ElMessage.error(error instanceof Error ? error.message : '发布失败，请稍后再试')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    // 页面加载时检查登录状态
    if (!checkAuth()) {
        return
    }
})
</script>

<style scoped>
.add-page {
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

.nav-left:active {
    transform: scale(0.95);
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    flex: 1;
    text-align: center;
}

.publish-btn {
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border: none;
    border-radius: 20px;
    padding: 8px 20px;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.publish-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
}

.publish-btn:active:not(:disabled) {
    transform: translateY(0);
}

.publish-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* 主要内容 */
.add-content {
    flex: 1;
    padding: 20px;
    z-index: 1;
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding-bottom: 100px; /* 为底部留出空间，避免内容被遮挡 */
}

.editor-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(231, 84, 128, 0.1);
}

.editor-section {
    margin-bottom: 32px;
}

.editor-section:last-child {
    margin-bottom: 0;
}

.section-label {
    font-size: 15px;
    color: #333;
    margin-bottom: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-label::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border-radius: 2px;
}

/* 标题输入 */
.title-input {
    font-size: 20px;
    font-weight: 600;
}

:deep(.title-input .el-input__wrapper) {
    background: transparent;
    box-shadow: none;
    border-bottom: 2px solid #e0e0e0;
    border-radius: 0;
    padding: 12px 0;
}

:deep(.title-input .el-input__wrapper:hover),
:deep(.title-input .el-input__wrapper.is-focus) {
    border-bottom-color: #e75480;
}

:deep(.title-input .el-input__inner) {
    font-size: 20px;
    font-weight: 600;
    color: #333;
}

:deep(.title-input .el-input__inner::placeholder) {
    color: #999;
    font-weight: 400;
}

/* 图片上传 */
.image-uploader {
    width: 100%;
}

:deep(.image-uploader .el-upload-list) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 0;
}

:deep(.image-uploader .el-upload) {
    border: 2px dashed #e75480;
    border-radius: 16px;
    background: rgba(231, 84, 128, 0.05);
    transition: all 0.3s ease;
    width: 120px;
    height: 120px;
    margin: 0;
}

:deep(.image-uploader .el-upload:hover) {
    border-color: #ff6b9d;
    background: rgba(231, 84, 128, 0.1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.2);
}

:deep(.image-uploader .el-icon) {
    color: #e75480;
    font-size: 28px;
}

:deep(.image-uploader .el-upload-list__item) {
    border-radius: 12px;
    overflow: hidden;
    margin: 0;
    width: 120px;
    height: 120px;
}

:deep(.image-uploader .el-upload-list__item-thumbnail) {
    object-fit: cover;
    width: 100%;
    height: 100%;
}

:deep(.image-uploader .el-upload-list__item-actions) {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

:deep(.image-uploader .el-upload-list__item-actions .el-icon) {
    color: white;
    font-size: 18px;
}

:deep(.image-uploader .el-upload-list__item-actions span) {
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s;
}

:deep(.image-uploader .el-upload-list__item-actions span:hover) {
    background: rgba(255, 255, 255, 0.2);
}

/* 内容文本域 */
.content-textarea {
    font-size: 15px;
    line-height: 1.6;
}

:deep(.content-textarea .el-textarea__inner) {
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid #e0e0e0;
    border-radius: 16px;
    padding: 20px;
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    resize: vertical;
    transition: all 0.3s ease;
    min-height: 200px;
}

:deep(.content-textarea .el-textarea__inner:hover) {
    border-color: #e75480;
}

:deep(.content-textarea .el-textarea__inner:focus) {
    border-color: #e75480;
    box-shadow: 0 0 0 2px rgba(231, 84, 128, 0.1);
}

:deep(.content-textarea .el-textarea__inner::placeholder) {
    color: #999;
}

/* 图片预览对话框 */
:deep(.image-preview-dialog .el-dialog__body) {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.preview-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .add-content {
        padding: 16px 12px;
    }

    .editor-container {
        width:380px;
        margin-left:-3px;
        padding: 16px;
        border-radius: 16px;
    }

    .page-title {
        font-size: 16px;
    }

    .publish-btn {
        padding: 6px 16px;
        font-size: 14px;
        border-radius: 18px;
    }

    .nav-left {
        padding: 4px;
    }

    .nav-left .el-icon {
        font-size: 20px !important;
    }

    :deep(.title-input .el-input__inner) {
        font-size: 18px;
    }

    :deep(.title-input .el-input__wrapper) {
        padding: 10px 0;
    }

    .editor-section {
        margin-bottom: 28px;
    }

    .section-label {
        font-size: 14px;
        margin-bottom: 12px;
    }

    :deep(.image-uploader .el-upload) {
        width: calc(50% - 8px);
        height: 120px;
        margin-right: 8px;
        margin-bottom: 8px;
    }

    :deep(.image-uploader .el-upload-list) {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    :deep(.image-uploader .el-upload-list__item) {
        width: calc(50% - 4px);
        margin: 0;
    }

    :deep(.content-textarea .el-textarea__inner) {
        padding: 16px;
        font-size: 15px;
        min-height: 180px;
        line-height: 1.7;
    }

    .top-nav {
        padding: 10px 16px;
    }
}

@media (max-width: 480px) {
    .top-nav {
        padding: 10px 12px;
    }

    .page-title {
        font-size: 15px;
        padding: 0 8px;
    }

    .publish-btn {
        padding: 6px 14px;
        font-size: 13px;
        border-radius: 16px;
        min-width: 60px;
    }

    .nav-left {
        padding: 2px;
    }

    .nav-left .el-icon {
        font-size: 22px !important;
    }

    .add-content {
        padding: 12px 8px;
    }

    .editor-container {
        padding: 20px 12px;
        border-radius: 12px;
    }

    .editor-section {
        margin-bottom: 24px;
    }

    .section-label {
        font-size: 13px;
        margin-bottom: 10px;
    }

    .section-label::before {
        width: 3px;
        height: 14px;
    }

    :deep(.title-input .el-input__inner) {
        font-size: 17px;
    }

    :deep(.title-input .el-input__wrapper) {
        padding: 8px 0;
    }

    :deep(.image-uploader .el-upload) {
        width: calc(50% - 6px);
        height: 100px;
        margin-right: 6px;
        margin-bottom: 6px;
    }

    :deep(.image-uploader .el-icon) {
        font-size: 24px;
    }

    :deep(.image-uploader .el-upload-list__item) {
        width: calc(50% - 3px);
    }

    :deep(.content-textarea .el-textarea__inner) {
        padding: 14px;
        font-size: 14px;
        min-height: 160px;
        line-height: 1.6;
        border-radius: 12px;
    }

    :deep(.content-textarea .el-input__count) {
        font-size: 12px;
    }

    :deep(.title-input .el-input__count) {
        font-size: 12px;
    }

    /* 图片预览对话框优化 */
    :deep(.image-preview-dialog) {
        width: 95% !important;
        margin: 0 auto;
    }

    .preview-image {
        max-height: 60vh;
    }
}
</style>
