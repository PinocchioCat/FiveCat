<script setup lang="ts">
import { Bell, ChatDotRound, Close, House, Location, Position, Promotion, RefreshRight, SwitchButton, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { api } from '../api/client'
import AuthDialog from '../components/AuthDialog.vue'
import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME, SUPPORT_TITLE, SUPPORT_WELCOME_TEXT } from '../constants/support'
import { authDialogRedirect, authDialogRole, authDialogVisible, closeAuthDialog, openAuthDialog } from '../store/auth-dialog'
import { clearSession, currentRole, currentUser, isAuthenticated, pets, restoreSession, setCurrentUser, setPets } from '../store/session'
import type { SupportMessage } from '../types/app'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const roleDialogVisible = ref(false)
const roleDialogIntent = ref<'auth' | 'support' | null>(null)
const reopenSupportAfterLogin = ref(false)
const supportVisible = ref(false)
const unreadSupport = ref(false)
const profileMenuVisible = ref(false)
const supportLoading = ref(false)
const sendingSupport = ref(false)
const supportMessages = ref<SupportMessage[]>([])
const guestSupportSessionId = ref('')
const supportBodyRef = ref<HTMLElement | null>(null)
const supportForm = reactive({
  content: ''
})
const brandImage = '/images/brand-cats.jpg'

const authButtonLabel = computed(() => '登录 / 注册')
const showSupportEntry = computed(() => route.path !== '/auth')
const roleDialogTitle = computed(() => (roleDialogIntent.value === 'support' ? '选择身份或先临时咨询' : '请选择登录身份'))
const supportStatusText = computed(() =>
  isAuthenticated.value ? '聊天记录会跟随当前登录账号保存，方便继续跟进问题。' : '未登录也能临时咨询，关闭窗口后前端不会保留本次聊天内容。'
)
const supportWelcomeCopy = computed(() =>
  isAuthenticated.value ? '当前账号的历史咨询会自动同步，已为你接入专属人工服务。' : '先临时咨询也没问题，如需同步历史记录，稍后再选择身份登录即可。'
)
const headerRoleLabel = computed(() => (currentRole.value === 'owner' ? '宠物主人' : '兼职铲屎官'))
const switchRoleLabel = computed(() => (currentRole.value === 'owner' ? '切换为兼职铲屎官' : '切换为宠物主人'))

const desktopNavItems = computed(() => [
  { key: 'home', label: '首页' },
  { key: 'services', label: currentRole.value === 'sitter' ? '任务大厅' : '找服务' },
  { key: 'orders', label: currentRole.value === 'sitter' ? '接单记录' : '我的订单' },
  { key: 'community', label: '社区' }
] as const)

const footerGroups = [
  {
    key: 'brand',
    title: '宠友邻',
    description: '让爱从不缺席。同城宠物互助平台，随时随地连接身边热爱动物的善良邻里。'
  },
  {
    key: 'about',
    title: '关于平台',
    links: ['了解我们', '服务说明', '城市覆盖']
  },
  {
    key: 'guarantee',
    title: '服务保障',
    links: ['实名认证', '平台评价', '售后申诉']
  },
  {
    key: 'support',
    title: '联系客服',
    links: ['138-xxxx-xxxx', '常见问题', '在线反馈']
  }
]

const mobileNavItems = computed(() => [
  { path: '/', label: '首页', icon: House },
  { path: '/orders', label: currentRole.value === 'sitter' ? '接单记录' : '订单大厅', icon: Location },
  { path: '/community', label: '宠物社区', icon: Bell },
  { path: '/profile', label: '我的', icon: User }
] as const)

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

type DesktopNavKey = (typeof desktopNavItems.value)[number]['key']

async function handleDesktopNav(key: DesktopNavKey) {
  if (key === 'home') {
    if (route.path !== '/') {
      await router.push('/')
    } else {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  if (key === 'services') {
    await router.push('/services')
    return
  }

  if (key === 'orders') {
    if (!isAuthenticated.value) {
      openAuth()
      return
    }
    await router.push(currentRole.value === 'owner' ? '/my-orders' : '/orders?entry=take')
    return
  }

  await router.push('/community')
}

function navItemActive(key: DesktopNavKey) {
  if (key === 'home') return route.path === '/'
  if (key === 'services') return route.path === '/services'
  if (key === 'orders') return route.path === '/my-orders' || route.path === '/orders'
  return route.path === '/community'
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
  const intent = roleDialogIntent.value
  roleDialogIntent.value = null
  roleDialogVisible.value = false
  reopenSupportAfterLogin.value = intent === 'support'
  openAuthDialog({
    role,
    redirect: route.fullPath
  })
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
    unreadSupport.value = false
    return
  }

  supportLoading.value = true
  try {
    supportMessages.value = await api.fetchSupportMessages()
    unreadSupport.value = !supportVisible.value && supportMessages.value.some((item) => item.sender === 'support')
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
  unreadSupport.value = false
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
    unreadSupport.value = false
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
  unreadSupport.value = false
  profileMenuVisible.value = false
  resetTransientSupportState()
  ElMessage.success('已退出登录')
  await router.push('/')
}

function openCitySwitcher() {
  ElMessage.info('切换城市功能演示中，当前定位为上海。')
}

async function openProfileCenter() {
  profileMenuVisible.value = false
  await router.push('/profile')
}

async function switchUserRole() {
  if (!isAuthenticated.value || !currentUser.value) return

  try {
    const nextRole = currentRole.value === 'owner' ? 'sitter' : 'owner'
    const user = await api.switchRole(nextRole)
    setCurrentUser(user)
    profileMenuVisible.value = false
    ElMessage.success(nextRole === 'owner' ? '已切换为宠物主人' : '已切换为兼职铲屎官')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '切换身份失败，请稍后重试。')
  }
}

async function handleAuthSuccess() {
  closeAuthDialog()
  const redirect = authDialogRedirect.value

  if (redirect && redirect !== route.fullPath) {
    await router.push(redirect)
  }

  if (reopenSupportAfterLogin.value) {
    reopenSupportAfterLogin.value = false
    supportVisible.value = true
    await loadSupportMessages()
  }
}

function handleAuthClose() {
  reopenSupportAfterLogin.value = false
  closeAuthDialog()
}

async function openFooterLink(label: string) {
  if (label === '了解我们') {
    if (route.path !== '/about') {
      await router.push('/about')
    } else {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  if (label === '服务说明') {
    if (route.path !== '/service-guide') {
      await router.push('/service-guide')
    } else {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  if (label === '城市覆盖') {
    if (route.path !== '/city-coverage') {
      await router.push('/city-coverage')
    } else {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  if (label === '常见问题' || label === '在线反馈') {
    void toggleSupport()
    return
  }
  ElMessage.info(`${label}内容正在完善中。`)
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
    unreadSupport.value = false
  }
)

onMounted(() => {
  void hydrate()
})
</script>

<template>
  <div class="app-shell">
    <header class="shell-header shell-header-landing">
      <div class="shell-header-inner">
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
          <button
            v-for="item in desktopNavItems"
            :key="item.key"
            class="nav-inline-item"
            :class="{ active: navItemActive(item.key) }"
            type="button"
            @click="handleDesktopNav(item.key)"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="header-actions landing-actions">
          <button type="button" class="header-city-button" @click="openCitySwitcher">
            <el-icon><Position /></el-icon>
            <span>切换城市</span>
          </button>

          <button v-if="!isAuthenticated" type="button" class="header-login-button" @click="openAuth">{{ authButtonLabel }}</button>

          <template v-else>
            <button type="button" class="header-notice-button" @click="toggleSupport">
              <el-icon><Bell /></el-icon>
              <span v-if="unreadSupport" class="header-notice-dot"></span>
            </button>

            <el-popover
              v-model:visible="profileMenuVisible"
              trigger="click"
              placement="bottom-end"
              :width="236"
              popper-class="header-profile-popper"
            >
              <template #reference>
                <button type="button" class="header-avatar-button" aria-label="打开个人菜单">
                  <img :src="currentUser?.avatar" :alt="currentUser?.username ?? '用户头像'" />
                </button>
              </template>

              <div v-if="currentUser" class="header-profile-menu">
                <div class="header-profile-menu-head">
                  <img :src="currentUser.avatar" :alt="currentUser.username" />
                  <div>
                    <strong>{{ currentUser.username }}</strong>
                    <span>当前身份：{{ headerRoleLabel }}</span>
                  </div>
                </div>

                <button type="button" class="header-profile-menu-item accent" @click="switchUserRole">
                  <el-icon><RefreshRight /></el-icon>
                  <span>{{ switchRoleLabel }}</span>
                </button>
                <button type="button" class="header-profile-menu-item" @click="openProfileCenter">
                  <el-icon><User /></el-icon>
                  <span>个人中心</span>
                </button>
                <button type="button" class="header-profile-menu-item danger" @click="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </button>
              </div>
            </el-popover>
          </template>
        </div>
      </div>
    </header>

    <main class="shell-main" v-loading="loading">
      <div class="shell-main-inner">
        <RouterView />
      </div>
    </main>

    <footer v-if="route.path !== '/auth'" class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-panel">
          <section class="site-footer-brand">
            <div class="site-footer-brand-head">
              <span class="brand-mark brand-mark-image footer-brand-image">
                <img :src="brandImage" alt="宠友邻品牌图标" />
              </span>
              <div>
                <strong>宠友邻</strong>
                <span>邻里宠物互助社区</span>
              </div>
            </div>
            <p>让爱从不缺席。同城宠物互助平台，随时随地连接身边热爱动物的善良邻里。</p>
          </section>

          <section class="site-footer-links">
            <article v-for="group in footerGroups.slice(1)" :key="group.key" class="site-footer-group">
              <h3>{{ group.title }}</h3>
              <button
                v-for="link in group.links"
                :key="link"
                type="button"
                class="site-footer-link"
                @click="openFooterLink(link)"
              >
                {{ link }}
              </button>
            </article>
          </section>
        </div>

        <div class="site-footer-bottom">© 2026 PetNeighbor 宠友邻. All rights reserved.</div>
      </div>
    </footer>

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

    <AuthDialog
      v-if="authDialogVisible"
      :role="authDialogRole"
      @close="handleAuthClose"
      @success="handleAuthSuccess"
    />
  </div>
</template>
