<script setup lang="ts">
import { Close, Grid, Iphone } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { api } from '../api/client'
import { setAuthToken, setCurrentUser, setPets } from '../store/session'
import type { AuthDialogRole } from '../store/auth-dialog'

const props = defineProps<{
  role: AuthDialogRole
}>()

const emit = defineEmits<{
  close: []
  success: [role: AuthDialogRole]
}>()

const loading = ref(false)
const sendingCode = ref(false)
const codeCountdown = ref(0)
const loginMode = ref<'phone' | 'wechat'>('phone')
const agreed = ref(false)
const qrVersion = ref(1)
const qrStage = ref<'initial' | 'expired' | 'scanned'>('initial')
const qrBusy = ref(false)

const phoneForm = reactive({
  phone: '15216899711',
  code: ''
})

const brandImage = '/images/login.jpg'

let codeTimer: number | null = null
let qrExpireTimer: number | null = null

const roleLabel = computed(() => (props.role === 'owner' ? '宠物主人' : '铲屎官'))
const codeButtonText = computed(() => {
  if (sendingCode.value) return '发送中'
  if (codeCountdown.value > 0) return `${codeCountdown.value}s`
  return '获取验证码'
})

function createQrDataUrl(version: number) {
  const accent = version % 2 === 0 ? '#ff8a34' : '#c8cfdb'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="32" fill="#f7f8fb"/>
      <g fill="#c9d0dc">
        <rect x="34" y="34" width="58" height="58" rx="12"/>
        <rect x="50" y="50" width="26" height="26" rx="6" fill="#f7f8fb"/>
        <rect x="148" y="34" width="58" height="58" rx="12"/>
        <rect x="164" y="50" width="26" height="26" rx="6" fill="#f7f8fb"/>
        <rect x="34" y="148" width="58" height="58" rx="12"/>
        <rect x="50" y="164" width="26" height="26" rx="6" fill="#f7f8fb"/>
        <rect x="116" y="42" width="18" height="18" rx="6"/>
        <rect x="116" y="76" width="18" height="36" rx="6"/>
        <rect x="116" y="128" width="18" height="18" rx="6"/>
        <rect x="148" y="116" width="22" height="22" rx="7"/>
        <rect x="178" y="116" width="28" height="18" rx="6"/>
        <rect x="148" y="148" width="18" height="28" rx="6"/>
        <rect x="176" y="148" width="30" height="58" rx="8"/>
      </g>
      <circle cx="190" cy="54" r="9" fill="${accent}"/>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const qrImage = computed(() => createQrDataUrl(qrVersion.value))

function clearCodeTimer() {
  if (codeTimer !== null) {
    window.clearInterval(codeTimer)
    codeTimer = null
  }
}

function clearQrTimer() {
  if (qrExpireTimer !== null) {
    window.clearTimeout(qrExpireTimer)
    qrExpireTimer = null
  }
}

function startCodeCountdown() {
  clearCodeTimer()
  codeCountdown.value = 60
  codeTimer = window.setInterval(() => {
    if (codeCountdown.value <= 1) {
      codeCountdown.value = 0
      clearCodeTimer()
      return
    }
    codeCountdown.value -= 1
  }, 1000)
}

function startQrLifecycle() {
  clearQrTimer()
  qrStage.value = 'initial'
  qrExpireTimer = window.setTimeout(() => {
    if (qrStage.value === 'scanned') return
    qrStage.value = 'expired'
  }, 60000)
}

async function confirmAgreement() {
  if (agreed.value) return true

  try {
    await ElMessageBox.confirm('确认登录：已阅读并同意 用户服务协议 与 隐私政策', '继续登录', {
      confirmButtonText: '同意',
      cancelButtonText: '取消',
      type: 'warning'
    })
    agreed.value = true
    return true
  } catch {
    return false
  }
}

async function sendCode() {
  if (sendingCode.value || codeCountdown.value > 0) return
  if (!/^\d{11}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号。')
    return
  }

  const confirmed = await confirmAgreement()
  if (!confirmed) {
    ElMessage.info('同意协议后即可获取验证码。')
    return
  }

  sendingCode.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    startCodeCountdown()
    ElMessage.success('演示环境验证码已发送：2468')
  } finally {
    sendingCode.value = false
  }
}

function loginErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return `登录失败：${error.message}`
  }
  return '登录失败，请稍后重试。'
}

async function completeLogin(mode: 'phone' | 'wechat') {
  loading.value = true
  try {
    const result = mode === 'phone'
      ? await api.loginPhone(phoneForm.phone, phoneForm.code, props.role)
      : await api.loginWechat(props.role)

    setCurrentUser(result.user)
    setAuthToken(result.access_token)
    setPets(await api.fetchPets().catch(() => []))

    ElMessage.success(mode === 'phone' ? '手机号登录成功。' : '微信登录成功。')
    emit('success', result.user.role)
  } catch (error) {
    ElMessage.error(loginErrorMessage(error))
    if (mode === 'wechat') {
      qrStage.value = 'initial'
      qrVersion.value += 1
      startQrLifecycle()
    }
  } finally {
    loading.value = false
    qrBusy.value = false
  }
}

async function loginPhone() {
  if (!/^\d{11}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号。')
    return
  }
  if (!phoneForm.code.trim()) {
    ElMessage.warning('请输入验证码。')
    return
  }

  const confirmed = await confirmAgreement()
  if (!confirmed) {
    ElMessage.info('同意协议后即可登录。')
    return
  }

  await completeLogin('phone')
}

async function loginWechat() {
  qrBusy.value = true
  qrStage.value = 'scanned'
  clearQrTimer()
  await completeLogin('wechat')
}

function refreshQrCode() {
  qrVersion.value += 1
  startQrLifecycle()
}

function openAgreementDoc(name: 'user' | 'privacy') {
  ElMessage.info(name === 'user' ? '用户服务协议内容待补充。' : '隐私政策内容待补充。')
}

onMounted(() => {
  startQrLifecycle()
})

onBeforeUnmount(() => {
  clearCodeTimer()
  clearQrTimer()
})
</script>

<template>
  <div class="auth-shot-shell" @click.self="emit('close')">
    <section class="auth-shot-card">
      <div class="auth-shot-cover">
        <img :src="brandImage" alt="宠友邻展示图" class="auth-shot-cover-image" />
        <div class="auth-shot-cover-overlay"></div>
        <div class="auth-shot-cover-copy">
          <h1>宠友邻</h1>
          <p>同城宠物服务与互助社区</p>
          <span class="auth-shot-cover-pill">平台严格审核 · 100% 实名认证</span>
        </div>
      </div>

      <div class="auth-shot-main">
        <button type="button" class="auth-shot-close" aria-label="关闭登录弹窗" @click="emit('close')">
          <el-icon><Close /></el-icon>
        </button>

        <div class="auth-shot-header">
          <span class="auth-shot-role-tag">当前身份：{{ roleLabel }}</span>
          <h2>欢迎回来</h2>
          <p>登录您的账号，继续探索宠友圈</p>
        </div>

        <div class="auth-shot-tabs">
          <button
            type="button"
            class="auth-shot-tab"
            :class="{ active: loginMode === 'phone' }"
            @click="loginMode = 'phone'"
          >
            <el-icon><Iphone /></el-icon>
            <span>手机号登录</span>
          </button>
          <button
            type="button"
            class="auth-shot-tab"
            :class="{ active: loginMode === 'wechat' }"
            @click="loginMode = 'wechat'"
          >
            <el-icon><Grid /></el-icon>
            <span>微信扫码</span>
          </button>
        </div>

        <div v-if="loginMode === 'phone'" class="auth-shot-form">
          <input
            v-model="phoneForm.phone"
            type="text"
            maxlength="11"
            inputmode="numeric"
            class="auth-shot-input"
            placeholder="请输入手机号"
          />

          <div class="auth-shot-code-row">
            <input
              v-model="phoneForm.code"
              type="text"
              maxlength="6"
              inputmode="numeric"
              class="auth-shot-input"
              placeholder="验证码"
            />
            <button type="button" class="auth-shot-code-button" :disabled="sendingCode || codeCountdown > 0" @click="sendCode">
              {{ codeButtonText }}
            </button>
          </div>

          <button type="button" class="auth-shot-submit" :disabled="loading" @click="loginPhone">
            {{ loading ? '登录中...' : '立即登录' }}
          </button>

          <p class="auth-shot-footnote">
            未注册手机号验证后自动注册，且代表您同意
            <button type="button" class="auth-shot-link" @click.prevent="openAgreementDoc('user')">《用户服务协议》</button>
            与
            <button type="button" class="auth-shot-link" @click.prevent="openAgreementDoc('privacy')">《隐私政策》</button>
          </p>
        </div>

        <div v-else class="auth-shot-wechat">
          <div class="auth-shot-qr-box" :class="{ expired: qrStage === 'expired' }">
            <img :src="qrImage" alt="微信扫码二维码" class="auth-shot-qr-image" />
          </div>
          <h3>请使用微信扫一扫</h3>
          <p>关注公众号即可快速登录</p>
          <button
            type="button"
            class="auth-shot-wechat-link"
            :disabled="qrBusy || loading"
            @click="qrStage === 'expired' ? refreshQrCode() : loginWechat()"
          >
            {{ qrStage === 'expired' ? '测试：点击此处刷新二维码' : qrBusy || loading ? '处理中...' : '测试：点击此处模拟扫码成功' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
