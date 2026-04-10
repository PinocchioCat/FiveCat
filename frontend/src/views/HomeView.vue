<script setup lang="ts">
import { ChatDotRound, Clock, HomeFilled, Opportunity, Position, Search, StarFilled } from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { api } from '../api/client'
import { currentRole, isAuthenticated } from '../store/session'
import type { HomeOverview } from '../types/app'

interface MarketingCard {
  icon?: Component
  iconClass: string
  iconImage?: string
  title: string
  description: string
}

interface TestimonialCard {
  avatar: string
  name: string
  identity: string
  quote: string
}

const router = useRouter()
const overview = ref<HomeOverview | null>(null)
const loading = ref(true)
const keyword = ref('')
const roleDialogVisible = ref(false)
const verificationIcon = '/images/verified-shield.png'
const heroImage = '/images/hero-pet.jpg'

const viewerRole = computed<'owner' | 'sitter'>(() => (isAuthenticated.value ? currentRole.value : 'owner'))
const isOwner = computed(() => viewerRole.value === 'owner')

const heroBadge = computed(() =>
  isOwner.value ? '12,500+ 位实名认证宠护达人随时待命' : '附近订单实时刷新，空闲时间也能稳稳变现'
)

const heroTitleLine1 = computed(() => (isOwner.value ? '放心托付毛孩子' : '用陪伴和照护'))
const heroTitleLine2 = computed(() => (isOwner.value ? '让爱从不缺席' : '把零散时间变成靠谱收入'))

const heroDescription = computed(() =>
  isOwner.value
    ? '宠友邻连接同城宠主和经过认证的铲屎官，支持上门喂养、遛狗、临时寄养和应急照护，让你忙的时候也能放心。'
    : '平台把附近真实的照护需求整理成清晰的任务流，接单、服务记录、口碑积累都可以在这里完成。'
)

const primaryButtonText = computed(() => {
  if (!isAuthenticated.value) return '立即开始'
  return isOwner.value ? '去发布订单' : '去接附近订单'
})

const trustTitle = computed(() => (isOwner.value ? '用户口碑' : '待接订单金额'))
const trustValue = computed(() => {
  const amount = overview.value?.nearby_orders.reduce((sum, item) => sum + item.price, 0) ?? 0
  return isOwner.value ? '4.9 / 5 平台好评' : `¥${amount} 可抢订单`
})

const serviceCards = computed<MarketingCard[]>(() => [
  {
    icon: Clock,
    iconClass: 'soft-blue',
    title: '代遛狗',
    description: '每天按时上门遛狗散步，消耗精力，解决您的时间空缺和体力顾虑。'
  },
  {
    icon: Opportunity,
    iconClass: 'soft-orange',
    title: '上门喂养',
    description: '节假日或出差时，宠护官上门添加粮水、护理粪尿、陪玩互动。'
  },
  {
    icon: HomeFilled,
    iconClass: 'soft-pink',
    title: '家庭寄养',
    description: '将宠物寄养在认证宠护官的家中，享受如家般的温暖和个性化照顾。'
  }
])

const assuranceCards = computed<MarketingCard[]>(() => [
  {
    iconImage: verificationIcon,
    iconClass: 'soft-green',
    title: '实名认证保障',
    description: '所有宠护官均经过身份认证和背景审查，确保您的宠物安全。'
  },
  {
    icon: Clock,
    iconClass: 'soft-blue',
    title: '即时更新',
    description: '实时照片和视频更新，让您随时了解宠物的状态，安心无忧。'
  },
  {
    icon: ChatDotRound,
    iconClass: 'soft-orange',
    title: '24/7 客服支持',
    description: '全天候客服团队随时为您解答问题，处理突发情况。'
  }
])

const testimonialCards = computed<TestimonialCard[]>(() => [
  {
    avatar: '/images/testimonial-avatar-man.jpeg',
    name: '满月',
    identity: '两猫一狗的宠主',
    quote: '出差前在宠友邻上找到附近的宠护达人，每天都有喂养反馈和照片，心里踏实很多。'
  },
  {
    avatar: '/images/testimonial-avatar-woman.jpg',
    name: '阿黎',
    identity: '新手养宠家庭',
    quote: '不只是解决寄养问题，社区里还能看到很多真实照护经验，像邻里互助一样自然。'
  }
])

const stats = computed(() => {
  const value = overview.value?.stats
  return [
    { label: '在线铲屎官', value: value?.active_sitters ?? 0 },
    { label: '待接附近订单', value: value?.pending_orders ?? 0 },
    { label: '社区内容数', value: value?.community_posts ?? 0 },
    { label: '累计完成服务', value: value?.completed_orders ?? 0 }
  ]
})

async function loadOverview() {
  loading.value = true
  try {
    overview.value = await api.fetchHomeOverview()
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (!keyword.value.trim()) {
    ElMessage.info('可以搜索小区、服务类型、服务时段或附近宠护达人。')
    return
  }

  ElMessage.success(`已为你准备“${keyword.value}”的相关入口。`)
}

async function goPrimary() {
  if (!isAuthenticated.value) {
    roleDialogVisible.value = true
    return
  }

  await router.push(isOwner.value ? '/orders?entry=publish' : '/orders?entry=take')
}

async function goSecondary() {
  await router.push('/auth?role=sitter&redirect=%2Forders%3Fentry%3Dtake')
}

async function chooseRole(role: 'owner' | 'sitter') {
  roleDialogVisible.value = false
  const redirect = role === 'owner' ? '/orders?entry=publish' : '/orders?entry=take'
  await router.push(`/auth?role=${role}&redirect=${encodeURIComponent(redirect)}`)
}

onMounted(() => {
  void loadOverview()
})
</script>

<template>
  <div id="top" class="marketing-home" v-loading="loading">
    <section class="hero-section">
      <div class="hero-copy-panel">
        <div class="hero-copy-stack">
          <span class="hero-badge">
            <span class="hero-badge-dot"></span>
            {{ heroBadge }}
          </span>

          <h1 class="hero-title">
            <span>{{ heroTitleLine1 }}</span>
            <span class="hero-title-accent">{{ heroTitleLine2 }}</span>
          </h1>

          <p class="hero-description">{{ heroDescription }}</p>
        </div>

        <div class="hero-action-row">
          <el-button type="primary" round size="large" @click="goPrimary">{{ primaryButtonText }}</el-button>
          <el-button round size="large" @click="goSecondary">成为铲屎官</el-button>
        </div>

        <div class="hero-search-panel">
          <div class="hero-search-field">
            <el-icon><Position /></el-icon>
            <input
              v-model="keyword"
              type="text"
              :placeholder="isOwner ? '输入你所在小区、位置或服务类型' : '输入你想服务的小区、位置或接单关键词'"
            />
          </div>
          <div class="hero-search-divider"></div>
          <div class="hero-search-field secondary">
            <el-icon><Clock /></el-icon>
            <span>{{ isOwner ? '选择服务时间' : '选择可接单时间' }}</span>
          </div>
          <button class="hero-search-button" type="button" @click="onSearch">
            <el-icon><Search /></el-icon>
          </button>
        </div>

        <div class="stat-grid">
          <div v-for="item in stats" :key="item.label" class="stat-card">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <div class="hero-visual-panel">
        <div class="hero-visual-image" :style="{ backgroundImage: `url(${heroImage})` }"></div>
        <div class="floating-proof left">
          <div class="proof-icon green">保</div>
          <div>
            <span>平台保障</span>
            <strong>{{ isOwner ? '实名认证与服务记录' : '附近任务实时可见' }}</strong>
          </div>
        </div>
        <div class="floating-proof right">
          <div class="proof-icon pink">信</div>
          <div>
            <span>{{ trustTitle }}</span>
            <strong>{{ trustValue }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="marketing-section service-showcase-section">
      <div class="section-copy center">
        <h2>随时随地，满足毛孩子的需求</h2>
        <p>提供多种宠物照顾服务，您可以根据自己的时间和需求选择合适的服务安排。</p>
      </div>

      <div class="service-inline-grid">
        <article v-for="item in serviceCards" :key="item.title" class="service-inline-card">
          <div class="service-icon-shell" :class="item.iconClass">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section id="assurance" class="marketing-section assurance-showcase-section">
      <div class="section-copy center">
        <h2>为什么选择宠友邻</h2>
      </div>

      <div class="trust-grid trust-grid-wide">
        <article v-for="item in assuranceCards" :key="item.title" class="trust-card trust-card-wide">
          <div class="service-icon-shell" :class="[item.iconClass, { 'is-image': Boolean(item.iconImage) }]">
            <img v-if="item.iconImage" :src="item.iconImage" :alt="item.title" />
            <el-icon v-else><component :is="item.icon" /></el-icon>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section id="stories" class="marketing-section testimonial-section">
      <div class="section-copy center testimonial-copy">
        <h2>宠主怎么说</h2>
        <p>每位宠主都希望把毛孩子交给更可靠的人。</p>
      </div>

      <div class="testimonial-grid">
        <article v-for="item in testimonialCards" :key="item.name" class="testimonial-card">
          <div class="testimonial-card-head">
            <img :src="item.avatar" :alt="item.name" />
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.identity }}</span>
            </div>
          </div>

          <p class="testimonial-card-copy">{{ item.quote }}</p>

          <div class="testimonial-card-foot">
            <el-icon><StarFilled /></el-icon>
            <span>来自真实宠主反馈</span>
          </div>
        </article>
      </div>

      <div class="testimonial-cta">
        <div>
          <h3>现在就为毛孩子安排一次安心照护</h3>
          <p>发布喂养、遛狗、寄养或临时救助需求，让附近愿意帮忙的人更快看见。</p>
        </div>
        <el-button type="primary" round size="large" @click="goPrimary">立即开始</el-button>
      </div>
    </section>

    <el-dialog v-model="roleDialogVisible" width="520px" title="请选择登录身份" align-center>
      <div class="role-choice-grid">
        <button type="button" class="role-choice-card" @click="chooseRole('owner')">
          <strong>我是宠物主人</strong>
          <span>登录后进入发单大厅，快速发布照护需求并查看历史订单。</span>
        </button>
        <button type="button" class="role-choice-card" @click="chooseRole('sitter')">
          <strong>我是铲屎官</strong>
          <span>登录后进入接单大厅，查看附近订单并逐步沉淀你的接单口碑。</span>
        </button>
      </div>
    </el-dialog>
  </div>
</template>

