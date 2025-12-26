<template>
    <div class="ai-chat-page">
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
            <h1 class="page-title">AI旅游助手</h1>
            <div class="nav-right">
                <el-icon :size="20" class="clear-icon" @click="clearChat" title="清空对话">
                    <Delete />
                </el-icon>
            </div>
        </header>

        <!-- 聊天消息区域 -->
        <main class="chat-container" ref="chatContainerRef">
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-icon">
                    <el-icon :size="64">
                        <ChatDotRound />
                    </el-icon>
                </div>
                <h2>欢迎使用AI旅游助手</h2>
                <p>我可以帮您规划旅行路线、推荐景点、解答旅游问题</p>
                <div class="quick-questions">
                    <div 
                        v-for="question in quickQuestions" 
                        :key="question"
                        class="quick-question-item"
                        @click="sendQuickQuestion(question)">
                        {{ question }}
                    </div>
                </div>
            </div>

            <div v-else class="messages-list">
                <div 
                    v-for="(message, index) in messages" 
                    :key="index"
                    class="message-item"
                    :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }">
                    <div class="message-avatar">
                        <el-avatar 
                            v-if="message.role === 'user'"
                            :size="36"
                            style="background: linear-gradient(135deg, #e75480, #ff6b9d);">
                            <el-icon><User /></el-icon>
                        </el-avatar>
                        <el-avatar 
                            v-else
                            :size="36"
                            style="background: linear-gradient(135deg, #4a90e2, #5ba3f5);">
                            <el-icon><Service /></el-icon>
                        </el-avatar>
                    </div>
                    <div class="message-content">
                        <div class="message-text" v-html="formatMessage(message.content)"></div>
                        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                    </div>
                </div>

                <!-- 加载指示器 -->
                <div v-if="isLoading" class="message-item assistant-message">
                    <div class="message-avatar">
                        <el-avatar 
                            :size="36"
                            style="background: linear-gradient(135deg, #4a90e2, #5ba3f5);">
                            <el-icon><Service /></el-icon>
                        </el-avatar>
                    </div>
                    <div class="message-content">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 输入区域 -->
        <footer class="input-footer">
            <div class="input-container">
                <el-input
                    v-model="inputMessage"
                    type="textarea"
                    :rows="2"
                    placeholder="输入您的问题..."
                    class="chat-input"
                    @keydown.enter.exact.prevent="handleSendMessage"
                    @keydown.enter.shift.exact="inputMessage += '\n'"
                    :disabled="isLoading"
                    :maxlength="500"
                    show-word-limit>
                </el-input>
                <el-button 
                    type="primary" 
                    class="send-button"
                    :disabled="!inputMessage.trim() || isLoading"
                    @click="handleSendMessage"
                    :loading="isLoading">
                    <el-icon v-if="!isLoading"><Promotion /></el-icon>
                    <span v-if="!isLoading">发送</span>
                </el-button>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    ArrowLeft, 
    Delete, 
    ChatDotRound, 
    User, 
    Service, 
    Promotion 
} from '@element-plus/icons-vue'

const router = useRouter()
const chatContainerRef = ref(null)
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref([])

// Coze API 配置
const COZE_API_URL = 'https://api.coze.cn/v3/chat'
const COZE_API_TOKEN = 'cztei_lo6PnKMQwPmmaslzfhf6fzjZJ57LGksqcbY0ssY5XTCqf5TTZOVREeVnpQ0vfvECh'
const COZE_BOT_ID = '7542690032004874275'

// 快速问题
const quickQuestions = ref([
    '推荐一些热门旅游景点',
    '帮我规划3天的旅行路线',
    '有什么适合拍照的地方？',
    '当地有什么特色美食？'
])

// 生成用户ID（可以使用实际用户ID）
const getUserId = () => {
    // 可以从 localStorage 或用户信息中获取
    let userId = localStorage.getItem('coze_user_id')
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('coze_user_id', userId)
    }
    return userId
}

// 更新助手消息内容
const updateAssistantMessage = (index, content) => {
    if (messages.value[index] && messages.value[index].role === 'assistant') {
        messages.value[index].content = content
    }
}

// 发送消息到 Coze API
const sendMessageToCoze = async (content) => {
    const userId = getUserId()
    
    try {
        const response = await fetch(COZE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: COZE_BOT_ID,
                user_id: userId,
                stream: true,
                additional_messages: [
                    {
                        content: content,
                        content_type: 'text',
                        role: 'user',
                        type: 'question'
                    }
                ],
                parameters: {}
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('API 错误响应:', errorText)
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        // 检查响应类型
        const contentType = response.headers.get('content-type') || ''

        // 检查是否是流式响应
        const isStreaming = contentType.includes('text/event-stream') || contentType.includes('stream') || contentType.includes('application/x-ndjson')
        
        let assistantMessageIndex = messages.value.length - 1
        let fullContent = ''

        // 如果不是流式响应，直接读取完整响应
        if (!isStreaming) {
            try {
                const text = await response.text()
                
                if (text) {
                    try {
                        const jsonData = JSON.parse(text)
                        // 只提取消息内容，不显示 JSON 结构
                        if (jsonData.content && typeof jsonData.content === 'string') {
                            fullContent = jsonData.content
                        } else if (jsonData.data && jsonData.data.content) {
                            fullContent = typeof jsonData.data.content === 'string' ? jsonData.data.content : ''
                        } else if (jsonData.message && typeof jsonData.message === 'string') {
                            fullContent = jsonData.message
                        }
                        
                        if (fullContent) {
                            updateAssistantMessage(assistantMessageIndex, fullContent)
                        } else {
                            throw new Error('无法从响应中提取消息内容')
                        }
                    } catch (e) {
                        // 如果不是 JSON 或无法解析，尝试直接使用文本
                        if (text.trim() && !text.trim().startsWith('{')) {
                            fullContent = text.trim()
                            updateAssistantMessage(assistantMessageIndex, fullContent)
                        } else {
                            throw new Error('响应格式不正确')
                        }
                    }
                } else {
                    throw new Error('响应内容为空')
                }
                
                return
            } catch (error) {
                console.error('读取非流式响应失败:', error)
                throw error
            }
        }

        // 处理流式响应
        if (!response.body) {
            throw new Error('响应体为空')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let hasReceivedData = false
        let currentEvent = null // 跟踪当前事件类型

        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }

            hasReceivedData = true
            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            
            // 按行分割，但保留最后一个不完整的行
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                try {
                    // 处理 event: 行
                    if (line.startsWith('event:')) {
                        currentEvent = line.substring(6).trim()
                        continue
                    }
                    
                    // 处理 data: 行
                    if (line.startsWith('data:')) {
                        const jsonStr = line.substring(5).trim()
                        
                        // 检查是否是结束标记
                        if (jsonStr === '[DONE]' || jsonStr === '"[DONE]"') {
                            currentEvent = null
                            continue
                        }

                        let data = null
                        try {
                            data = JSON.parse(jsonStr)
                        } catch (e) {
                            // 解析失败，跳过这行
                            continue
                        }

                        // 根据事件类型处理数据，只提取并显示消息内容
                        if (currentEvent === 'conversation.message.delta') {
                            // 增量更新消息，只处理 type 为 'answer' 的消息
                            if (data.type === 'answer' && data.content && typeof data.content === 'string' && data.content !== '') {
                                fullContent += data.content
                                updateAssistantMessage(assistantMessageIndex, fullContent)
                                await nextTick()
                                scrollToBottom()
                            }
                        } 
                        else if (currentEvent === 'conversation.message.completed') {
                            // 消息完成，使用完整的 content
                            if (data.type === 'answer' && data.content && typeof data.content === 'string') {
                                fullContent = data.content
                                updateAssistantMessage(assistantMessageIndex, fullContent)
                                await nextTick()
                                scrollToBottom()
                            }
                        }
                        // 其他事件类型（created, in_progress, completed等）不做处理，避免显示 JSON
                    }
                } catch (e) {
                    // 静默处理错误，避免显示错误信息给用户
                    continue
                }
            }

            // 滚动到底部
            await nextTick()
            scrollToBottom()
        }

        // 处理剩余的 buffer
        if (buffer.trim()) {
            const trimmedBuffer = buffer.trim()
            if (trimmedBuffer.startsWith('data:')) {
                const jsonStr = trimmedBuffer.substring(5).trim()
                if (jsonStr !== '[DONE]' && jsonStr !== '"[DONE]"') {
                    try {
                        const data = JSON.parse(jsonStr)
                        if (data.type === 'answer' && data.content && typeof data.content === 'string') {
                            fullContent = data.content
                            updateAssistantMessage(assistantMessageIndex, fullContent)
                        }
                    } catch (e) {
                        // 静默处理错误
                    }
                }
            }
        }

        // 确保最终内容已保存
        if (messages.value[assistantMessageIndex]) {
            if (fullContent && fullContent.trim()) {
                messages.value[assistantMessageIndex].content = fullContent
            } else {
                // 如果最终内容为空，移除这条消息
                messages.value.splice(assistantMessageIndex, 1)
                if (hasReceivedData) {
                    ElMessage.warning('未收到有效回复，请重试')
                } else {
                    ElMessage.warning('未收到服务器响应数据')
                }
            }
        }

    } catch (error) {
        console.error('Error calling Coze API:', error)
        
        // 根据错误类型提供更详细的错误信息
        let errorMessage = '发送消息失败，请稍后重试'
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = '网络请求失败，请检查网络连接或API地址'
            console.error('网络错误详情:', error)
        } else if (error.message.includes('HTTP error')) {
            const statusMatch = error.message.match(/status: (\d+)/)
            if (statusMatch) {
                const status = statusMatch[1]
                if (status === '401') {
                    errorMessage = 'API认证失败，请检查Token是否正确'
                } else if (status === '403') {
                    errorMessage = 'API访问被拒绝，请检查权限'
                } else if (status === '404') {
                    errorMessage = 'API地址不存在，请检查URL配置'
                } else if (status === '429') {
                    errorMessage = '请求过于频繁，请稍后再试'
                } else if (status >= 500) {
                    errorMessage = '服务器错误，请稍后重试'
                } else {
                    errorMessage = `请求失败 (状态码: ${status})`
                }
            }
        } else if (error.message.includes('CORS')) {
            errorMessage = '跨域请求被阻止，可能需要配置代理服务器'
        }
        
        ElMessage.error(errorMessage)
        
        // 移除失败的助手消息
        if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant') {
            messages.value.pop()
        }
    } finally {
        isLoading.value = false
    }
}

// 发送消息
const handleSendMessage = async () => {
    const content = inputMessage.value.trim()
    if (!content || isLoading.value) return

    // 添加用户消息
    messages.value.push({
        role: 'user',
        content: content,
        timestamp: Date.now()
    })

    // 清空输入框
    inputMessage.value = ''

    // 添加空的助手消息占位符
    messages.value.push({
        role: 'assistant',
        content: '',
        timestamp: Date.now()
    })

    isLoading.value = true

    // 滚动到底部
    await nextTick()
    scrollToBottom()

    // 调用 Coze API
    await sendMessageToCoze(content)
}

// 发送快速问题
const sendQuickQuestion = (question) => {
    inputMessage.value = question
    handleSendMessage()
}

// 清空对话
const clearChat = () => {
    messages.value = []
    ElMessage.success('对话已清空')
}

// 返回上一页
const goBack = () => {
    router.back()
}

// 格式化消息内容（支持 Markdown 和换行）
const formatMessage = (content) => {
    if (!content) return ''
    
    // 转义 HTML
    let formatted = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    
    // 将换行符转换为 <br>
    formatted = formatted.replace(/\n/g, '<br>')
    
    // 简单的 Markdown 支持（可选）
    // 粗体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    return formatted
}

// 格式化时间
const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) {
        return '刚刚'
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`
    } else {
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (chatContainerRef.value) {
            chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
        }
    })
}

// 组件挂载时滚动到底部
onMounted(() => {
    scrollToBottom()
})
</script>

<style scoped>
.ai-chat-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
    overflow-x: hidden;
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
    display: flex;
    align-items: center;
    min-width: 36px;
    justify-content: flex-end;
}

.clear-icon {
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    padding: 6px;
    border-radius: 50%;
}

.clear-icon:hover {
    color: #e75480;
    background: rgba(231, 84, 128, 0.1);
}

/* 聊天容器 */
.chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    z-index: 1;
    position: relative;
    padding-bottom: 100px;
}

/* 欢迎消息 */
.welcome-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    padding: 40px 20px;
}

.welcome-icon {
    color: #e75480;
    margin-bottom: 24px;
    opacity: 0.8;
}

.welcome-message h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
}

.welcome-message p {
    font-size: 15px;
    color: #666;
    margin: 0 0 32px 0;
}

.quick-questions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 400px;
}

.quick-question-item {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid rgba(231, 84, 128, 0.1);
    text-align: left;
}

.quick-question-item:hover {
    background: rgba(231, 84, 128, 0.05);
    border-color: #e75480;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.15);
}

/* 消息列表 */
.messages-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
}

.message-item {
    display: flex;
    gap: 12px;
    animation: message-fade-in 0.3s ease;
}

@keyframes message-fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.user-message {
    flex-direction: row-reverse;
}

.user-message .message-content {
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    color: white;
    border-radius: 18px 18px 4px 18px;
}

.assistant-message .message-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    color: #333;
    border-radius: 18px 18px 18px 4px;
    border: 1px solid rgba(231, 84, 128, 0.1);
}

.message-avatar {
    flex-shrink: 0;
}

.message-content {
    max-width: 70%;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-text {
    font-size: 15px;
    line-height: 1.6;
    word-wrap: break-word;
    margin-bottom: 6px;
}

.message-time {
    font-size: 12px;
    opacity: 0.6;
    margin-top: 4px;
}

/* 打字指示器 */
.typing-indicator {
    display: flex;
    gap: 6px;
    padding: 8px 0;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing-bounce {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 输入区域 */
.input-footer {
    position: sticky;
    bottom: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 16px 20px;
    border-top: 1px solid rgba(231, 84, 128, 0.1);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.input-container {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    max-width: 800px;
    margin: 0 auto;
}

.chat-input {
    flex: 1;
}

:deep(.chat-input .el-textarea__inner) {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(231, 84, 128, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 15px;
    resize: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
}

:deep(.chat-input .el-textarea__inner:focus) {
    border-color: #e75480;
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.15);
}

.send-button {
    height: 48px;
    padding: 0 24px;
    background: linear-gradient(135deg, #e75480, #ff6b9d);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;
    min-width: 80px;
}

.send-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 84, 128, 0.3);
}

.send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .message-content {
        max-width: 85%;
    }

    .input-container {
        padding: 0;
    }

    .quick-questions {
        max-width: 100%;
    }
}
</style>

