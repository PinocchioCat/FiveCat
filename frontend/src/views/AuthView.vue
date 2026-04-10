<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { api } from '../api/client'
import { setAuthToken, setCurrentUser, setPets } from '../store/session'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const sendingCode = ref(false)
const agreed = ref(false)
const codeCountdown = ref(0)
const selectedRole = ref<'owner' | 'sitter'>(route.query.role === 'sitter' ? 'sitter' : 'owner')
const qrVersion = ref(1)
const qrStage = ref<'initial' | 'refreshed' | 'expired' | 'scanned'>('initial')
const qrBusy = ref(false)

const phoneForm = reactive({
  phone: '15216899711',
  code: ''
})

let codeTimer: number | null = null
let qrRefreshTimer: number | null = null
let qrExpireTimer: number | null = null

const brandImage = '/images/brand-cats.jpg'
const roleTitle = computed(() => (selectedRole.value === 'owner' ? '宠物主人' : '铲屎官'))
const roleDescription = computed(() =>
  selectedRole.value === 'owner'
    ? '发布订单、查看照护反馈，把毛孩子安心托付给附近靠谱的人。'
    : '查看附近真实订单、积累服务记录，把陪伴变成稳定的接单机会。'
)

const qrImage = computed(() => createQrDataUrl(qrVersion.value))
const codeButtonText = computed(() => {
  if (sendingCode.value) return '发送中'
  if (codeCountdown.value > 0) return `${codeCountdown.value}s后重发`
  return '获取验证码'
})

const qrHint = computed(() => {
  if (qrStage.value === 'initial') return '二维码将在 30 秒后自动刷新一次，演示环境可直接点击下方按钮完成扫码。'
  if (qrStage.value === 'refreshed') return '二维码已自动刷新，请在 30 秒内完成扫码登录。'
  if (qrStage.value === 'expired') return '扫描失败   请重试，立即刷新'
  return '扫码成功，正在为你进入平台。'
})

watch(
  () => route.query.role,
  (role) => {
    selectedRole.value = role === 'sitter' ? 'sitter' : 'owner'
  }
)

function createQrDataUrl(version: number) {
  const accent = version % 2 === 0 ? '#ff8b2d' : '#99a4b8'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="28" fill="#f4f6fb"/>
      <g fill="#9ea8bb">
        <rect x="44" y="44" width="54" height="54" rx="10"/>
        <rect x="58" y="58" width="26" height="26" rx="4" fill="#f4f6fb"/>
        <rect x="142" y="44" width="54" height="54" rx="10"/>
        <rect x="156" y="58" width="26" height="26" rx="4" fill="#f4f6fb"/>
        <rect x="44" y="142" width="54" height="54" rx="10"/>
        <rect x="58" y="156" width="26" height="26" rx="4" fill="#f4f6fb"/>
        <rect x="143" y="143" width="16" height="16" rx="4"/>
        <rect x="165" y="143" width="31" height="16" rx="5"/>
        <rect x="143" y="165" width="16" height="31" rx="5"/>
        <rect x="171" y="171" width="25" height="25" rx="7"/>
        <rect x="109" y="36" width="18" height="18" rx="9"/>
        <rect x="34" y="109" width="18" height="18" rx="9"/>
        <rect x="109" y="109" width="18" height="18" rx="9"/>
        <rect x="187" y="109" width="18" height="18" rx="9"/>
        <rect x="109" y="187" width="18" height="18" rx="9"/>
        <path d="M78 118h27c8 0 14 6 14 14v17c0 8-6 14-14 14H87" fill="none" stroke="#9ea8bb" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <circle cx="192" cy="50" r="8" fill="${accent}"/>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function clearCodeTimer() {
  if (codeTimer !== null) {
    window.clearInterval(codeTimer)
    codeTimer = null
  }
}

function clearQrTimers() {
  if (qrRefreshTimer !== null) {
    window.clearTimeout(qrRefreshTimer)
    qrRefreshTimer = null
  }
  if (qrExpireTimer !== null) {
    window.clearTimeout(qrExpireTimer)
    qrExpireTimer = null
  }
}

function resolveRedirect(role: 'owner' | 'sitter') {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect) return redirect
  return role === 'owner' ? '/orders?entry=publish' : '/orders?entry=take'
}

async function switchRole(role: 'owner' | 'sitter') {
  selectedRole.value = role
  const nextQuery: Record<string, string> = { role }
  if (typeof route.query.redirect === 'string') nextQuery.redirect = route.query.redirect
  if (typeof route.query.mode === 'string') nextQuery.mode = route.query.mode
  await router.replace({ path: '/auth', query: nextQuery })
}

function beginCodeCountdown() {
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

async function dispatchCode() {
  if (sendingCode.value || codeCountdown.value > 0) return
  if (!/^\d{11}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号。')
    return
  }

  sendingCode.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    beginCodeCountdown()
    ElMessage.success('演示环境验证码已发送：2468')
  } finally {
    sendingCode.value = false
  }
}

async function sendCode() {
  if (agreed.value) {
    await dispatchCode()
    return
  }

  try {
    await ElMessageBox.confirm('确认登录：已阅读并同意 用户协议、隐私协议', '获取验证码', {
      confirmButtonText: '同意',
      cancelButtonText: '不同意',
      type: 'warning',
      distinguishCancelAndClose: true
    })
    agreed.value = true
    await dispatchCode()
  } catch {
    ElMessage.info('勾选协议后即可发送验证码。')
  }
}

function startQrCycle() {
  clearQrTimers()
  qrStage.value = 'initial'

  qrRefreshTimer = window.setTimeout(() => {
    if (qrStage.value === 'scanned') return
    qrVersion.value += 1
    qrStage.value = 'refreshed'
  }, 30000)

  qrExpireTimer = window.setTimeout(() => {
    if (qrStage.value === 'scanned') return
    qrStage.value = 'expired'
    ElMessage.warning('扫描失败，请重试，立即刷新。')
  }, 60000)
}

function refreshQrCode() {
  qrVersion.value += 1
  startQrCycle()
}

function openAgreementDoc(name: 'user' | 'privacy') {
  ElMessage.info(name === 'user' ? '用户协议内容待补充。' : '隐私政策内容待补充。')
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
      ? await api.loginPhone(phoneForm.phone, phoneForm.code, selectedRole.value)
      : await api.loginWechat(selectedRole.value)

    setCurrentUser(result.user)
    setAuthToken(result.access_token)
    setPets(await api.fetchPets().catch(() => []))
    ElMessage.success(mode === 'phone' ? '手机号登录成功。' : '微信登录成功。')
    await router.push(resolveRedirect(result.user.role))
  } catch (error) {
    ElMessage.error(loginErrorMessage(error))
    if (mode === 'wechat' && qrStage.value === 'scanned') {
      refreshQrCode()
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
  if (!agreed.value) {
    ElMessage.warning('请先阅读并勾选用户协议、隐私政策。')
    return
  }

  await completeLogin('phone')
}

async function loginWechat() {
  if (qrStage.value === 'expired') {
    ElMessage.warning('二维码已失效，请先刷新。')
    return
  }

  qrBusy.value = true
  qrStage.value = 'scanned'
  clearQrTimers()
  await completeLogin('wechat')
}

onMounted(() => {
  startQrCycle()
})

onBeforeUnmount(() => {
  clearCodeTimer()
  clearQrTimers()
})
</script>

<template>
  <div class="auth-shell auth-shell-refined">
    <div class="auth-panel auth-panel-refined">
      <section class="auth-form-column">
        <div class="auth-brand-row">
          <div class="auth-brand-lockup">
            <img :src="brandImage" alt="宠友邻 logo" class="auth-brand-logo" />
            <div>
              <h1>宠友邻</h1>
              <p>邻里养宠互助社区</p>
            </div>
          </div>
          <div class="auth-role-switch">
            <button type="button" :class="['auth-role-switch-item', { active: selectedRole === 'owner' }]" @click="switchRole('owner')">
              宠物主人
            </button>
            <button type="button" :class="['auth-role-switch-item', { active: selectedRole === 'sitter' }]" @click="switchRole('sitter')">
              铲屎官
            </button>
          </div>
        </div>

        <div class="auth-heading-block">
          <span class="auth-identity-pill">当前身份：{{ roleTitle }}</span>
          <h2>手机号验证码登录</h2>
          <p>{{ roleDescription }}</p>
        </div>

        <div class="auth-field-stack">
          <label class="auth-field-label" for="login-phone">手机号</label>
          <input id="login-phone" v-model="phoneForm.phone" class="auth-input" maxlength="11" inputmode="numeric" placeholder="请输入手机号" />

          <label class="auth-field-label" for="login-code">验证码</label>
          <div class="auth-code-field">
            <input id="login-code" v-model="phoneForm.code" class="auth-code-input" maxlength="6" inputmode="numeric" placeholder="请输入验证码" />
            <span class="auth-code-divider"></span>
            <button type="button" class="auth-code-button" :disabled="sendingCode || codeCountdown > 0" @click="sendCode">
              {{ codeButtonText }}
            </button>
          </div>
        </div>

        <label class="auth-agreement-row">
          <input v-model="agreed" type="checkbox" class="auth-checkbox" />
          <span>
            我已阅读并同意
            <button type="button" class="auth-text-link" @click.prevent="openAgreementDoc('user')">用户协议</button>
            、
            <button type="button" class="auth-text-link" @click.prevent="openAgreementDoc('privacy')">隐私政策</button>
          </span>
        </label>

        <button type="button" class="auth-submit-button" :disabled="loading" @click="loginPhone">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </section>

      <section class="auth-qr-column">
        <div class="auth-qr-frame" :class="[`stage-${qrStage}`]">
          <img :src="qrImage" alt="微信扫码二维码" class="auth-qr-image" />
        </div>
        <h3>微信扫码登录</h3>
        <p class="auth-qr-copy">{{ qrHint }}</p>
        <div class="auth-qr-action-row">
          <button
            type="button"
            class="auth-qr-button"
            :class="{ secondary: qrStage === 'expired' }"
            :disabled="qrBusy"
            @click="qrStage === 'expired' ? refreshQrCode() : loginWechat()"
          >
            {{ qrStage === 'expired' ? '立即刷新' : qrBusy ? '处理中...' : '模拟扫码登录' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
