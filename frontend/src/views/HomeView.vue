<script setup lang="ts">
import { ChatDotRound, Clock, MapLocation, Opportunity, Position, Search, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '../api/client'
import { openAuthDialog } from '../store/auth-dialog'
import { isAuthenticated } from '../store/session'
import type { HomeOverview, PostItem } from '../types/app'

interface ShortcutItem {
  icon?: Component
  iconImage?: string
  title: string
  subtitle: string
}

interface AssuranceItem {
  icon?: Component
  iconImage?: string
  title: string
  description: string
}

interface NearbyPreviewItem {
  id: number
  serviceTag: string
  title: string
  time: string
  location: string
  publisher: string
  price: string
  avatar: string
}

const router = useRouter()
const overview = ref<HomeOverview | null>(null)
const loading = ref(true)
const roleDialogVisible = ref(false)
const keyword = ref('')

const heroImage = '/images/hero-pet.jpg'
const fallbackImage = '/images/brand-cats.jpg'

const shortcutItems: ShortcutItem[] = [
  { iconImage: '/dog1.png', title: '代遛狗', subtitle: '按时遛放' },
  { iconImage: '/images/上门喂养.png', title: '上门喂养', subtitle: '添粮换水' },
  { iconImage: '/images/房子2.png', title: '家庭寄养', subtitle: '短住陪伴' },
  { iconImage: '/images/创建临时表.png', title: '临时照护', subtitle: '协助看护' },
  { iconImage: '/images/小轿车小汽车.png', title: '接送服务', subtitle: '就近接送' },
  { iconImage: '/images/救护车.png', title: '应急陪护', subtitle: '临时照护' }
]

const assuranceItems: AssuranceItem[] = [
  { iconImage: '/images/我的_实名认证_48.png', title: '实名认证', description: '平台实名审核与服务记录可查' },
  { icon: Clock, title: '就近响应', description: '3-5 公里附近优先推荐' },
  { iconImage: '/images/全程陪伴.png', title: '平台陪伴', description: '下单到服务全程可咨询客服' },
  { icon: MapLocation, title: '同城服务', description: '基于位置匹配更合适的宠护达人' }
]

const guestNearbyPreview: NearbyPreviewItem[] = [
  {
    id: 1,
    serviceTag: '代遛狗',
    title: '需要遛一只金毛 (距您 800m)',
    time: '今天 18:00-19:00',
    location: '朝阳区阳光小区',
    publisher: '张女士 发布',
    price: '¥ 35.00',
    avatar: '/images/testimonial-avatar-woman.jpg'
  },
  {
    id: 2,
    serviceTag: '代遛狗',
    title: '需要遛一只金毛 (距您 800m)',
    time: '今天 18:00-19:00',
    location: '朝阳区阳光小区',
    publisher: '张女士 发布',
    price: '¥ 35.00',
    avatar: '/images/testimonial-avatar-woman.jpg'
  },
  {
    id: 3,
    serviceTag: '代遛狗',
    title: '需要遛一只金毛 (距您 800m)',
    time: '今天 18:00-19:00',
    location: '朝阳区阳光小区',
    publisher: '张女士 发布',
    price: '¥ 35.00',
    avatar: '/images/testimonial-avatar-woman.jpg'
  },
  {
    id: 4,
    serviceTag: '代遛狗',
    title: '需要遛一只金毛 (距您 800m)',
    time: '今天 18:00-19:00',
    location: '朝阳区阳光小区',
    publisher: '张女士 发布',
    price: '¥ 35.00',
    avatar: '/images/testimonial-avatar-woman.jpg'
  }
]

const stats = computed(() => {
  const value = overview.value?.stats
  return [
    { label: '在线宠护达人', value: formatCompact(value?.active_sitters ?? 0) },
    { label: '附近待接服务', value: formatCompact(value?.pending_orders ?? 0) },
    { label: '社区动态', value: formatCompact(value?.community_posts ?? 0) },
    { label: '累计完成服务', value: formatCompact(value?.completed_orders ?? 0) }
  ]
})

const communityPosts = computed(() => (overview.value?.posts ?? []).slice(0, 3))

const heroTitle = '放心托付毛孩子'
const heroAccent = '让爱从不缺席'
const heroDescription = '宠友邻连接附近可信赖的宠护达人，支持上门喂养、代遛、寄养和临时照护，让你外出、上班和出差时都更安心。'

async function loadOverview() {
  loading.value = true
  try {
    overview.value = await api.fetchHomeOverview()
  } finally {
    loading.value = false
  }
}

function formatCompact(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`
  if (value >= 1000) return value.toLocaleString('zh-CN')
  return String(value)
}

function formatPostDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

function postCover(post: PostItem) {
  return post.media_urls[0] || fallbackImage
}

function onSearch() {
  if (!keyword.value.trim()) {
    ElMessage.info('可以搜索小区、服务类型、服务时段或附近达人。')
    return
  }
  ElMessage.success(`已为你准备“${keyword.value}”相关服务入口。`)
  void router.push('/orders?entry=publish')
}

async function goPrimary() {
  if (!isAuthenticated.value) {
    roleDialogVisible.value = true
    return
  }

  await router.push('/orders?entry=publish')
}

async function goProfile() {
  if (!isAuthenticated.value) {
    roleDialogVisible.value = true
    return
  }
  await router.push('/profile')
}

async function goCommunity() {
  await router.push('/community')
}

async function chooseRole(role: 'owner' | 'sitter') {
  roleDialogVisible.value = false
  openAuthDialog({
    role,
    redirect: role === 'owner' ? '/orders?entry=publish' : '/orders?entry=take'
  })
}

onMounted(() => {
  void loadOverview()
})
</script>

<template>
  <div id="top" class="pet-home" v-loading="loading">
    <section class="pet-home-hero">
      <div class="pet-home-hero-copy">
        <span class="pet-home-badge">宠友邻 Pet Neighbor</span>

        <div class="pet-home-title-block">
          <h1>{{ heroTitle }}</h1>
          <h1 class="is-accent">{{ heroAccent }}</h1>
          <p>{{ heroDescription }}</p>
        </div>

        <div class="pet-home-actions">
          <button type="button" class="pet-home-primary-button" @click="goPrimary">
            立即预约服务
          </button>
          <button type="button" class="pet-home-secondary-button" @click="goProfile">
            成为铲屎官
          </button>
        </div>

        <div class="pet-home-search">
          <div class="pet-home-search-field">
            <el-icon><Search /></el-icon>
            <input v-model="keyword" type="text" placeholder="输入小区、宠物类型、服务内容..." />
          </div>
          <div class="pet-home-search-chip">
            <el-icon><Position /></el-icon>
            <span>附近推荐</span>
          </div>
          <button type="button" class="pet-home-search-button" @click="onSearch">搜索</button>
        </div>
      </div>

      <div class="pet-home-hero-visual">
        <div class="pet-home-visual-card">
          <img :src="heroImage" alt="宠友邻首页主视觉" class="pet-home-visual-image" />
          <div class="pet-home-visual-badge top">
            <img src="/images/verified-shield.png" alt="实名认证保障" class="pet-home-verified-badge-icon" />
            <div>
              <strong>实名认证保障</strong>
              <span>服务记录与评价可追踪</span>
            </div>
          </div>
          <div class="pet-home-visual-badge bottom">
            <span class="price-badge">宠</span>
            <div>
              <strong>附近 3-5 km 服务中</strong>
              <span>上门喂养 / 遛狗 / 寄养</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="pet-home-stats">
      <article v-for="item in stats" :key="item.label" class="pet-home-stat-card">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </article>
    </section>

    <section id="services" class="pet-home-section">
      <div class="pet-home-section-heading center">
        <h2>全方位宠物服务</h2>
        <p>根据你的场景选择服务类型，快速找到附近可靠的照护支持。</p>
      </div>

      <div class="pet-home-service-grid">
        <article v-for="item in shortcutItems" :key="item.title" class="pet-home-service-card">
          <span class="pet-home-service-icon">
            <img v-if="item.iconImage" :src="item.iconImage" :alt="item.title" class="pet-home-service-icon-image" />
            <el-icon v-else><component :is="item.icon" /></el-icon>
          </span>
          <strong>{{ item.title }}</strong>
          <span>{{ item.subtitle }}</span>
        </article>
      </div>
    </section>

    <section id="assurance" class="pet-home-section pet-home-assurance">
      <article v-for="item in assuranceItems" :key="item.title" class="pet-home-assurance-item">
        <span class="pet-home-assurance-icon">
          <img v-if="item.iconImage" :src="item.iconImage" :alt="item.title" class="pet-home-assurance-icon-image" />
          <el-icon v-else><component :is="item.icon" /></el-icon>
        </span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
        </div>
      </article>
    </section>

    <section id="nearby" class="pet-home-section pet-home-nearby">
      <div class="pet-home-section-heading">
        <div>
          <h2>附近待接任务</h2>
          <p>附近的邻居毛孩子需要你的帮助</p>
        </div>
        <button type="button" class="pet-home-text-button" @click="goPrimary">
          查看更多
        </button>
      </div>

      <div class="pet-home-nearby-guest-layout">
        <div class="pet-home-nearby-guest-list">
          <article v-for="item in guestNearbyPreview" :key="item.id" class="pet-home-nearby-preview-card">
            <div class="pet-home-nearby-preview-badge">
              <span>{{ item.serviceTag }}</span>
              <span class="pet-home-nearby-preview-badge-icon">
                <el-icon><Opportunity /></el-icon>
              </span>
            </div>

            <div class="pet-home-nearby-preview-main">
              <div class="pet-home-nearby-preview-copy">
                <div class="pet-home-nearby-preview-head">
                  <h3>{{ item.title }}</h3>
                  <strong>{{ item.price }}</strong>
                </div>

                <div class="pet-home-nearby-preview-meta">
                  <span>
                    <el-icon><Clock /></el-icon>
                    {{ item.time }}
                  </span>
                  <span>
                    <el-icon><MapLocation /></el-icon>
                    {{ item.location }}
                  </span>
                </div>

                <div class="pet-home-nearby-preview-foot">
                  <div class="pet-home-nearby-preview-publisher">
                    <img :src="item.avatar" :alt="item.publisher" />
                    <span>{{ item.publisher }}</span>
                  </div>

                  <button type="button" class="pet-home-nearby-preview-button" @click="goPrimary">查看详情</button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="pet-home-nearby-demo-card">
          <div class="pet-home-nearby-demo-stage">
            <span class="pet-home-nearby-demo-marker pet-home-nearby-demo-marker-warm">
              <el-icon><Opportunity /></el-icon>
            </span>
            <span class="pet-home-nearby-demo-marker pet-home-nearby-demo-marker-cool">
              <el-icon><Position /></el-icon>
            </span>
            <span class="pet-home-nearby-demo-marker pet-home-nearby-demo-marker-accent">
              <el-icon><ChatDotRound /></el-icon>
            </span>

            <div class="pet-home-nearby-demo-copy">
              <strong>地图视图演示</strong>
              <p>附近有 12 个可接任务</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="stories" class="pet-home-section">
      <div class="pet-home-section-heading">
        <div>
          <h2>社区精选</h2>
          <p>把原来的宠主评价换成真实社区内容，沉淀养宠经验与同城动态。</p>
        </div>
        <button type="button" class="pet-home-text-button" @click="goCommunity">进入社区</button>
      </div>

      <div class="pet-home-community-grid">
        <article v-for="post in communityPosts" :key="post.id" class="pet-home-community-card">
          <img :src="postCover(post)" :alt="post.author.username" class="pet-home-community-cover" />
          <div class="pet-home-community-body">
            <div class="pet-home-community-author">
              <img :src="post.author.avatar" :alt="post.author.username" />
              <div>
                <strong>{{ post.author.username }}</strong>
                <span>{{ formatPostDate(post.created_at) }}</span>
              </div>
            </div>
            <p>{{ post.content }}</p>
            <div class="pet-home-community-tags">
              <span v-for="tag in post.tags.slice(0, 3)" :key="tag">#{{ tag }}</span>
            </div>
          </div>
        </article>
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
