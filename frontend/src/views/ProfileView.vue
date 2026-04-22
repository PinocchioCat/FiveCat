<script setup lang="ts">
import {
  ArrowRight,
  Calendar,
  ChatLineSquare,
  CircleCheckFilled,
  DataAnalysis,
  Document,
  EditPen,
  List,
  Location,
  Plus,
  Setting,
  Star,
  StarFilled,
  Tickets,
  Wallet
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { openAuthDialog } from '../store/auth-dialog'
import { currentRole, currentUser, isAuthenticated, pets } from '../store/session'

const router = useRouter()

const isSitter = computed(() => currentRole.value === 'sitter')

const sitterProfile = computed(() => ({
  name: '李钰展',
  avatar: currentUser.value?.avatar ?? '',
  rating: '4.9',
  summary: '提供代遛狗、上门喂养服务',
  district: '朝阳区'
}))

const sitterHeroStats = [
  { label: '完成单量', value: '86' },
  { label: '累计收入', value: '¥ 4,520', accent: true },
  { label: '评价数', value: '45' }
]

const sitterPerformanceItems = [
  { label: '接单响应率', value: '98%', progress: 98, tone: 'orange' },
  { label: '按时到达率', value: '100%', progress: 100, tone: 'green' },
  { label: '好评率', value: '99%', progress: 99, tone: 'orange' }
] as const

const sitterWorkItems = [
  { key: 'schedule', label: '排期管理', description: '设置接单时间', icon: Calendar, tone: 'blue' },
  { key: 'history', label: '历史订单', description: '查看服务记录', icon: List, tone: 'orange' },
  { key: 'income', label: '收入明细', description: '提现与账单', icon: Wallet, tone: 'green' },
  { key: 'reviews', label: '评价管理', description: '查看用户反馈', icon: ChatLineSquare, tone: 'purple' }
] as const

const sitterReviews = [
  {
    name: '王女士',
    initial: '王',
    content: '非常负责任的小伙子，准时到达，遛狗的时候发了很多照片和视频，很放心。',
    date: '2026-04-12',
    service: '代遛狗',
    rating: 5
  },
  {
    name: '李先生',
    initial: '李',
    content: '给猫咪喂饭加铲屎，还帮忙过了一会猫，打扫得很干净，满分好评！',
    date: '2026-04-05',
    service: '上门喂养',
    rating: 5
  }
]

const sitterIdentityImage = computed(() => pets.value[0]?.photos[0] ?? currentUser.value?.avatar ?? '')

const ownerSummaryStats = computed(() => [
  { label: '收藏宠物', value: Math.max(12, pets.value.length * 6) },
  { label: '关注铲屎官', value: Math.max(5, Math.min(9, currentUser.value?.completed_orders ?? 0)) },
  { label: '账户余额', value: '¥ 0.00' }
])

const ownerTools = [
  { key: 'address', label: '服务地址管理', icon: Location },
  { key: 'coupon', label: '优惠券', icon: Tickets },
  { key: 'favorite', label: '我的收藏', icon: Star },
  { key: 'setting', label: '设置与隐私', icon: Setting }
] as const

const ownerPetCards = computed(() =>
  pets.value.map((pet) => ({
    ...pet,
    genderLabel: petGenderLabel(pet.gender),
    ageLabel: pet.age >= 1 ? `${pet.age}岁` : `${Math.max(3, pet.age * 12)}个月`,
    weightLabel: pet.weight_kg ? `${pet.weight_kg}kg` : pet.species.includes('犬') || pet.type.includes('dog') ? `${18 + pet.age * 2}kg` : `${3.5 + pet.age * 0.4}kg`,
    vaccineLabel: '已齐全',
    adoptionLabel: pet.habits || pet.specialty || '亲人、稳定、适应家庭照护'
  }))
)

const joinedAtLabel = computed(() => {
  if (!currentUser.value) return ''
  const joined = new Date(currentUser.value.registered_at)
  return `${joined.getFullYear()}-${String(joined.getMonth() + 1).padStart(2, '0')}`
})

const maskedPhone = computed(() => maskPhone(currentUser.value?.phone))

function maskPhone(phone?: string | null) {
  if (!phone) return '138****5678'
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function petGenderLabel(gender?: string) {
  if (gender === 'male') return '男孩'
  if (gender === 'female') return '女孩'
  return '未知'
}

async function goOrders() {
  await router.push(isSitter.value ? '/orders?entry=take' : '/my-orders')
}

async function goPublishHall() {
  await router.push('/orders?entry=publish')
}

function openLoginDialog() {
  openAuthDialog({
    role: 'owner',
    redirect: '/profile'
  })
}

function editProfile() {
  ElMessage.info('个人资料编辑功能正在整理中。')
}

async function addPetProfile() {
  await router.push('/pets/new')
}

function editPetProfile(name: string) {
  ElMessage.info(`“${name}”的资料编辑功能即将开放。`)
}

function handleToolClick(label: string) {
  ElMessage.info(`${label}功能正在完善中。`)
}

function inviteFriends() {
  ElMessage.success('分享邀请功能演示中。')
}

async function handleSitterWorkClick(key: (typeof sitterWorkItems)[number]['key'], label: string) {
  if (key === 'history') {
    await goOrders()
    return
  }

  ElMessage.info(`${label}功能正在完善中。`)
}
</script>

<template>
  <div v-if="!isAuthenticated || !currentUser" class="empty-state-card">
    <h2>你还没有登录</h2>
    <p>登录后可以查看身份资料、服务记录和宠物档案。</p>
    <el-button type="primary" round @click="openLoginDialog">前往登录</el-button>
  </div>

  <div v-else-if="!isSitter" class="owner-profile-page">
    <section class="owner-profile-hero">
      <div class="owner-profile-user">
        <div class="owner-profile-avatar-wrap">
          <img :src="currentUser.avatar" :alt="currentUser.username" class="owner-profile-avatar" />
          <button type="button" class="owner-profile-edit-avatar" @click="editProfile">
            <el-icon><EditPen /></el-icon>
          </button>
        </div>

        <div class="owner-profile-user-copy">
          <div class="owner-profile-user-head">
            <h1>{{ currentUser.username }}</h1>
            <span class="owner-profile-verified">
              <el-icon><CircleCheckFilled /></el-icon>
              已实名认证
            </span>
          </div>
          <p>手机号: {{ maskedPhone }} · 加入于 {{ joinedAtLabel }}</p>

          <div class="owner-profile-summary">
            <div v-for="item in ownerSummaryStats" :key="item.label" class="owner-profile-summary-item">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="owner-profile-actions">
        <button type="button" class="owner-profile-primary-action" @click="goPublishHall">
          <el-icon><Document /></el-icon>
          <span>前往发单大厅</span>
        </button>
        <button type="button" class="owner-profile-secondary-action" @click="goOrders">查看我的订单</button>
      </div>
    </section>

    <section class="owner-profile-layout">
      <div class="owner-profile-main">
        <article class="owner-profile-panel owner-profile-pets-panel">
          <div class="owner-profile-panel-head">
            <div class="owner-profile-panel-title">
              <span class="owner-profile-panel-icon">♡</span>
              <h2>我的宠物档案</h2>
            </div>
            <button type="button" class="owner-profile-add-link" @click="addPetProfile">
              <el-icon><Plus /></el-icon>
              <span>添加新宠物</span>
            </button>
          </div>

          <div class="owner-profile-pet-grid">
            <article v-for="pet in ownerPetCards" :key="pet.id" class="owner-profile-pet-card">
              <div class="owner-profile-pet-head">
                <img :src="pet.photos[0]" :alt="pet.name" class="owner-profile-pet-thumb" />
                <div>
                  <strong>{{ pet.name }}</strong>
                  <span>{{ pet.breed }} · {{ pet.genderLabel }}</span>
                </div>
              </div>

              <div class="owner-profile-pet-meta">
                <span>年龄</span>
                <strong>{{ pet.ageLabel }}</strong>
                <span>体重</span>
                <strong>{{ pet.weightLabel }}</strong>
                <span>疫苗状态</span>
                <strong>{{ pet.vaccineLabel }}</strong>
                <span>宠物情况</span>
                <strong>{{ pet.adoptionLabel }}</strong>
              </div>

              <button type="button" class="owner-profile-pet-edit" @click="editPetProfile(pet.name)">编辑资料</button>
            </article>

            <button type="button" class="owner-profile-add-card" @click="addPetProfile">
              <span class="owner-profile-add-card-circle">+</span>
              <strong>添加毛孩子档案</strong>
              <p>完善年龄、体型与健康信息，让接单人更了解它的习惯。</p>
            </button>
          </div>
        </article>
      </div>

      <aside class="owner-profile-side">
        <article class="owner-profile-panel owner-profile-tools-panel">
          <div class="owner-profile-panel-head simple">
            <h2>常用工具</h2>
          </div>

          <div class="owner-profile-tool-list">
            <button
              v-for="item in ownerTools"
              :key="item.key"
              type="button"
              class="owner-profile-tool-item"
              @click="handleToolClick(item.label)"
            >
              <span class="owner-profile-tool-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <span>{{ item.label }}</span>
              <el-icon class="owner-profile-tool-arrow"><ArrowRight /></el-icon>
            </button>
          </div>
        </article>

        <article class="owner-profile-invite-card">
          <h3>邀请好友加入</h3>
          <p>双方各得 50 元无门槛互助金，宠物传递，好邻居同行。</p>
          <button type="button" @click="inviteFriends">立即分享</button>
        </article>
      </aside>
    </section>
  </div>

  <div v-else class="sitter-profile-page">
    <section class="sitter-profile-hero">
      <div class="sitter-profile-hero-main">
        <div class="sitter-profile-avatar-wrap">
          <img :src="sitterProfile.avatar" :alt="sitterProfile.name" class="sitter-profile-avatar" />
          <span class="sitter-profile-verified-badge">
            <el-icon><CircleCheckFilled /></el-icon>
          </span>
        </div>

        <div class="sitter-profile-copy">
          <div class="sitter-profile-title-row">
            <h1>{{ sitterProfile.name }}</h1>
            <span class="sitter-profile-rating">
              <el-icon><StarFilled /></el-icon>
              {{ sitterProfile.rating }} 高分铲屎官
            </span>
          </div>
          <p>{{ sitterProfile.summary }} <span></span> 活跃区域: {{ sitterProfile.district }}</p>

          <div class="sitter-profile-hero-stats">
            <div v-for="item in sitterHeroStats" :key="item.label" class="sitter-profile-hero-stat">
              <strong :class="{ accent: item.accent }">{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <button type="button" class="sitter-profile-hall-button" @click="goOrders">
        <span>进入接单大厅</span>
        <el-icon><ArrowRight /></el-icon>
      </button>
    </section>

    <section class="sitter-profile-content">
      <article class="sitter-profile-card sitter-profile-performance-card">
        <div class="sitter-profile-card-head">
          <div class="sitter-profile-card-title">
            <el-icon class="orange"><DataAnalysis /></el-icon>
            <h2>核心表现数据</h2>
          </div>
          <span>近30天</span>
        </div>

        <div class="sitter-profile-performance-list">
          <div v-for="item in sitterPerformanceItems" :key="item.label" class="sitter-profile-performance-item">
            <div class="sitter-profile-performance-row">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="sitter-profile-progress-track">
              <span class="sitter-profile-progress-bar" :class="item.tone" :style="{ width: `${item.progress}%` }"></span>
            </div>
          </div>
        </div>
      </article>

      <article class="sitter-profile-card sitter-profile-identity-card">
        <img v-if="sitterIdentityImage" :src="sitterIdentityImage" alt="" class="sitter-profile-identity-watermark" />
        <div class="sitter-profile-card-head">
          <div class="sitter-profile-card-title">
            <el-icon class="green"><CircleCheckFilled /></el-icon>
            <h2>身份资料</h2>
          </div>
          <button type="button" class="sitter-profile-text-button" @click="editProfile">编辑</button>
        </div>

        <div class="sitter-profile-identity-list">
          <div class="sitter-profile-identity-row">
            <span>养宠经验</span>
            <strong>3年养狗经验，熟悉金毛、拉布拉多习性</strong>
          </div>
          <div class="sitter-profile-identity-row">
            <span>可接类型</span>
            <div class="sitter-profile-chip-row">
              <em>代遛狗</em>
              <em>上门喂养</em>
            </div>
          </div>
          <div class="sitter-profile-identity-row">
            <span>个人简介</span>
            <p>本人非常有耐心，极度热爱小动物。平时周末全天有空，工作日晚19:00后可接单。自己养了一只小土狗，对狗狗行为有一定了解。自带拾便袋，绝不暴力拽绳。</p>
          </div>
        </div>
      </article>

      <article class="sitter-profile-card sitter-profile-workbench-card">
        <div class="sitter-profile-card-head">
          <div class="sitter-profile-card-title">
            <h2>工作台</h2>
          </div>
        </div>

        <div class="sitter-profile-work-grid">
          <button
            v-for="item in sitterWorkItems"
            :key="item.key"
            type="button"
            class="sitter-profile-work-item"
            @click="handleSitterWorkClick(item.key, item.label)"
          >
            <span class="sitter-profile-work-icon" :class="item.tone">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </button>
        </div>
      </article>

      <article class="sitter-profile-card sitter-profile-reviews-card">
        <div class="sitter-profile-card-head">
          <div class="sitter-profile-card-title">
            <el-icon class="blue"><ChatLineSquare /></el-icon>
            <h2>最近评价</h2>
          </div>
          <button type="button" class="sitter-profile-all-reviews" @click="handleToolClick('全部评价')">
            全部45条
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>

        <div class="sitter-profile-review-list">
          <article v-for="review in sitterReviews" :key="`${review.name}-${review.date}`" class="sitter-profile-review-item">
            <div class="sitter-profile-review-head">
              <span class="sitter-profile-review-avatar">{{ review.initial }}</span>
              <strong>{{ review.name }}</strong>
              <span class="sitter-profile-review-stars">
                <el-icon v-for="index in review.rating" :key="index"><StarFilled /></el-icon>
              </span>
            </div>
            <p>{{ review.content }}</p>
            <small>{{ review.date }} · {{ review.service }}</small>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>
