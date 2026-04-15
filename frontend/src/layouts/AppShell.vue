<script setup lang="ts">
import { Bell, ChatDotRound, Close, House, Location, Position, Promotion, SwitchButton, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { api } from '../api/client'
import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME, SUPPORT_TITLE, SUPPORT_WELCOME_TEXT } from '../constants/support'
import { clearSession, currentRole, currentUser, isAuthenticated, pets, restoreSession, setPets } from '../store/session'
import type { SupportMessage } from '../types/app'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const roleDialogVisible = ref(false)
const roleDialogIntent = ref<'auth' | 'support' | null>(null)
const supportVisible = ref(false)
const supportLoading = ref(false)
const sendingSupport = ref(false)
const supportMessages = ref<SupportMessage[]>([])
const guestSupportSessionId = ref('')
const supportBodyRef = ref<HTMLElement | null>(null)
const supportForm = reactive({
  content: ''
})
const brandImage = '/images/brand-cats.jpg'

const modeLabel = computed(() => {
  if (!isAuthenticated.value) return '未登录'
  return currentRole.value === 'owner' ? '宠主模式' : '铲屎官模式'
})

const authButtonLabel = computed(() => (isAuthenticated.value ? '进入我的主页' : '请登录'))
const showSupportEntry = computed(() => route.path !== '/auth')
const roleDialogTitle = computed(() => (roleDialogIntent.value === 'support' ? '选择身份或先临时咨询' : '请选择登录身份'))
const supportStatusText = computed(() =>
  isAuthenticated.value ? '聊天记录会跟随当前登录账号保存，方便继续跟进问题。' : '未登录也能临时咨询，关闭窗口后前端不会保留本次聊天内容。'
)
const supportWelcomeCopy = computed(() =>
  isAuthenticated.value ? '当前账号的历史咨询会自动同步，已为你接入专属人工服务。' : '先临时咨询也没问题，如需同步历史记录，稍后再选择身份登录即可。'
)

const desktopSections = [
  { label: '首页', id: 'top' },
  { label: '找服务', id: 'services' },
  { label: '服务保障', id: 'assurance' },
  { label: '宠主评价', id: 'stories' }
]

const mobileNavItems = [
  { path: '/', label: '首页', icon: House },
  { path: '/orders', label: '订单大厅', icon: Location },
  { path: '/community', label: '宠物社区', icon: Bell },
  { path: '/profile', label: '我的', icon: User }
]

async function hydrate() {
  restoreSession()

  if (isAuthenticated.value && pets.value.length === 0) {
    try {
      setPets(await api.fetchPets())
    } catch (error) {
      console.warn('Failed to hydrate pets.', error)
    }
  }

  if (isAuthenticated.value) {
    await loadSupportMessages()
  }

  loading.value = false
}

async function jumpToSection(id: string) {
  if (route.path !== '/') {
    await router.push('/')
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return
  }

  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openAuth() {
  if (isAuthenticated.value) {
    void router.push('/profile')
    return
  }

  roleDialogIntent.value = 'auth'
  roleDialogVisible.value = true
}

async function chooseRole(role: 'owner' | 'sitter') {
  roleDialogIntent.value = null
  roleDialogVisible.value = false
  const redirect = role === 'owner' ? '/orders?entry=publish' : '/orders?entry=take'
  await router.push(`/auth?role=${role}&redirect=${encodeURIComponent(redirect)}`)
}

function supportTime(message: SupportMessage) {
  return new Date(message.created_at).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function scrollSupportToBottom() {
  await nextTick()
  supportBodyRef.value?.scrollTo({ top: supportBodyRef.value.scrollHeight, behavior: 'smooth' })
}

async function loadSupportMessages() {
  if (!isAuthenticated.value || !currentUser.value) {
    supportMessages.value = []
    return
  }

  supportLoading.value = true
  try {
    supportMessages.value = await api.fetchSupportMessages()
    await scrollSupportToBottom()
  } finally {
    supportLoading.value = false
  }
}

function resetTransientSupportState() {
  guestSupportSessionId.value = ''
  supportMessages.value = []
  supportForm.content = ''
}

async function openTemporarySupportConversation() {
  supportLoading.value = true
  try {
    const session = await api.createTemporarySupportSession()
    guestSupportSessionId.value = session.session_id
    supportMessages.value = session.messages
    supportVisible.value = true
    await scrollSupportToBottom()
  } finally {
    supportLoading.value = false
  }
}

function closeSupportPanel() {
  supportVisible.value = false
  if (!isAuthenticated.value) {
    resetTransientSupportState()
  }
}

async function toggleSupport() {
  if (supportVisible.value) {
    closeSupportPanel()
    return
  }

  if (!isAuthenticated.value) {
    roleDialogIntent.value = 'support'
    roleDialogVisible.value = true
    return
  }

  supportVisible.value = true
  await loadSupportMessages()
}

async function sendSupportMessage() {
  const content = supportForm.content.trim()
  if (!content) {
    ElMessage.info('请输入想咨询客服的问题。')
    return
  }

  sendingSupport.value = true
  try {
    supportMessages.value = await api.sendSupportMessage(content, guestSupportSessionId.value || undefined)
    supportForm.content = ''
    await scrollSupportToBottom()
    ElMessage.success('消息已发送。')
  } finally {
    sendingSupport.value = false
  }
}

async function handleRoleDialogClosed() {
  const intent = roleDialogIntent.value
  roleDialogIntent.value = null

  if (intent === 'support' && !isAuthenticated.value) {
    await openTemporarySupportConversation()
  }
}

async function logout() {
  clearSession()
  supportVisible.value = false
  resetTransientSupportState()
  ElMessage.success('已退出登录')
  await router.push('/')
}

watch(
  () => currentUser.value?.id,
  async (userId, previousUserId) => {
    if (userId) {
      guestSupportSessionId.value = ''
      if (userId !== previousUserId) {
        await loadSupportMessages()
      }
      return
    }

    resetTransientSupportState()
    supportVisible.value = false
  }
)

onMounted(() => {
  void hydrate()
})
</script>

<template>
  <div class="app-shell">
    <header class="shell-header shell-header-landing">
      <RouterLink to="/" class="shell-brand shell-brand-link">
        <span class="brand-mark brand-mark-image">
          <img :src="brandImage" alt="宠友邻品牌图标" />
        </span>
        <div>
          <h1>宠友邻</h1>
          <p class="brand-subtitle">邻里养宠互助社区</p>
        </div>
      </RouterLink>

      <nav class="shell-nav-inline">
        <button v-for="item in desktopSections" :key="item.id" class="nav-inline-item" type="button" @click="jumpToSection(item.id)">
          {{ item.label }}
        </button>
      </nav>

      <div class="header-actions landing-actions">
        <div class="header-utility-pill">
          <el-icon><Position /></el-icon>
          <span>上海</span>
        </div>
        <div class="header-mode-pill">{{ modeLabel }}</div>
        <RouterLink v-if="isAuthenticated && currentUser" to="/profile" class="header-profile-link">
          <span>{{ currentUser.username }}</span>
        </RouterLink>
        <el-button v-if="isAuthenticated" round class="header-ghost-button" @click="logout">
          <el-icon><SwitchButton /></el-icon>
          退出
        </el-button>
        <el-button type="primary" round @click="openAuth">{{ authButtonLabel }}</el-button>
      </div>
    </header>

    <main class="shell-main" v-loading="loading">
      <RouterView />
    </main>

    <footer class="mobile-bottom-nav">
      <RouterLink v-for="item in mobileNavItems" :key="item.path" :to="item.path" class="mobile-nav-item" :class="{ active: route.path === item.path }">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </RouterLink>
    </footer>

    <div v-if="showSupportEntry" class="floating-support-shell">
      <transition name="support-float">
        <section v-if="supportVisible" class="floating-support-panel" v-loading="supportLoading">
          <div class="floating-support-head">
            <div class="floating-support-head-main">
              <div class="floating-support-head-copy">
                <strong>{{ SUPPORT_TITLE }}</strong>
                <p>{{ supportStatusText }}</p>
              </div>
              <button type="button" class="floating-support-close" @click="closeSupportPanel" aria-label="关闭客服窗口">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>

          <div ref="supportBodyRef" class="floating-support-body">
            <div class="floating-support-welcome">
              <strong>{{ SUPPORT_WELCOME_TEXT }}</strong>
              <p>{{ supportWelcomeCopy }}</p>
            </div>

            <div
              v-for="message in supportMessages"
              :key="message.id"
              class="floating-support-message"
              :class="message.sender === 'user' ? 'is-user' : 'is-support'"
            >
              <div v-if="message.sender === 'support'" class="support-message-author is-floating">
                <span class="support-agent-avatar is-message">
                  <img :src="SUPPORT_AGENT_AVATAR" :alt="SUPPORT_AGENT_NAME" />
                </span>
                <strong>{{ SUPPORT_AGENT_NAME }}</strong>
              </div>
              <p>{{ message.content }}</p>
              <span>{{ supportTime(message) }}</span>
            </div>

            <div v-if="supportMessages.length === 0" class="floating-support-empty">
              <strong>{{ SUPPORT_AGENT_NAME }} 已接入</strong>
              <p>请输入你的问题，我会继续为你安排毛孩子相关服务。</p>
            </div>
          </div>

          <div class="floating-support-composer">
            <el-input
              v-model="supportForm.content"
              class="floating-support-input"
              type="textarea"
              :rows="2"
              placeholder="请输入想咨询客服的问题，或直接描述毛孩子需要的服务。"
            />
            <el-button class="floating-support-send" type="primary" circle :loading="sendingSupport" @click="sendSupportMessage">
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </section>
      </transition>

      <button type="button" class="floating-support-trigger" @click="toggleSupport">
        <el-icon><ChatDotRound /></el-icon>
        <span>{{ supportVisible ? '收起客服' : '联系客服' }}</span>
      </button>
    </div>

    <el-dialog v-model="roleDialogVisible" width="520px" :title="roleDialogTitle" align-center @closed="handleRoleDialogClosed">
      <p v-if="roleDialogIntent === 'support'" class="role-dialog-hint">选择身份后可同步保存历史记录，直接关闭弹窗也能先临时咨询。</p>
      <div class="role-choice-grid">
        <button type="button" class="role-choice-card" @click="chooseRole('owner')">
          <strong>我是宠物主人</strong>
          <span>进入发单大厅，查看历史订单并快速发布照护需求。</span>
        </button>
        <button type="button" class="role-choice-card" @click="chooseRole('sitter')">
          <strong>我是铲屎官</strong>
          <span>进入接单大厅，查看附近订单并积累真实服务口碑。</span>
        </button>
      </div>
    </el-dialog>
  </div>
</template>
