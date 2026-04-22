<script setup lang="ts">
import { Aim, ChatDotRound, CircleCheck, Connection, Medal, Star, TrophyBase, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'

import { openAuthDialog } from '../store/auth-dialog'
import { isAuthenticated } from '../store/session'

interface IconCard {
  icon: Component
  title: string
  description: string
  tone: 'green' | 'pink' | 'blue' | 'gold'
}

interface TeamMember {
  name: string
  role: string
  avatar: string
}

const router = useRouter()

const heroImages = [
  {
    src: '/images/about-hero-family.jpg',
    alt: '宠物主人和宠物在家中相处'
  },
  {
    src: '/images/about-hero-care.jpg',
    alt: '宠护达人陪伴宠物'
  }
]

const valueItems: IconCard[] = [
  {
    icon: CircleCheck,
    title: '安全可靠',
    description: '严格实名认证，服务全程可追溯',
    tone: 'green'
  },
  {
    icon: Star,
    title: '用心服务',
    description: '每一位铲屎官都经过严格筛选',
    tone: 'pink'
  },
  {
    icon: Connection,
    title: '社区互助',
    description: '邻里守望相助，让爱宠不孤单',
    tone: 'blue'
  },
  {
    icon: Medal,
    title: '品质保障',
    description: '平台担保交易，售后无忧',
    tone: 'gold'
  }
]

const teamMembers: TeamMember[] = [
  {
    name: '张敏',
    role: '创始人 & CEO',
    avatar: '/images/about-team-zhang.jpg'
  },
  {
    name: '李浩',
    role: '产品总监',
    avatar: '/images/about-team-li.jpg'
  },
  {
    name: '王静',
    role: '运营负责人',
    avatar: '/images/about-team-wang.jpg'
  },
  {
    name: '刘强',
    role: '技术总监',
    avatar: '/images/about-team-liu.jpg'
  }
]

const growthStats = [
  { value: '50,000+', label: '注册用户' },
  { value: '12个', label: '覆盖城市' },
  { value: '89,400+', label: '完成订单' },
  { value: '4.9/5.0', label: '平台评分' }
]

async function openRegister() {
  if (isAuthenticated.value) {
    await router.push('/profile')
    return
  }

  openAuthDialog({
    role: 'owner',
    redirect: '/profile'
  })
}

function contactSupport() {
  ElMessage.info('请点击右下角“联系客服”，我们会尽快为你解答。')
}
</script>

<template>
  <div id="top" class="about-page">
    <section class="about-hero">
      <span class="about-kicker">
        <el-icon><Star /></el-icon>
        关于宠友邻
      </span>

      <div class="about-hero-copy">
        <h1>让爱宠生活更安心</h1>
        <p>
          宠友邻是一个温暖的同城宠物互助社区，连接有爱心的宠物主人和可靠的铲屎官，
          让每一只毛孩子都能得到细致周到的照顾。
        </p>
      </div>

      <div class="about-hero-media">
        <img v-for="image in heroImages" :key="image.src" :src="image.src" :alt="image.alt" />
      </div>
    </section>

    <section class="about-mission-grid">
      <article class="about-mission-card">
        <span class="about-mission-icon">
          <el-icon><Aim /></el-icon>
        </span>
        <h2>我们的使命</h2>
        <p>
          打造一个真实、可信、温暖的同城宠物服务社区，让每一位宠物主人都能放心托付自己的毛孩子，
          让每一位有爱心的铲屎官都能通过帮助他人获得价值和认可。
        </p>
      </article>

      <article class="about-mission-card dark">
        <span class="about-mission-icon">
          <el-icon><TrophyBase /></el-icon>
        </span>
        <h2>我们的愿景</h2>
        <p>
          成为中国最受信赖的宠物互助平台，让养宠生活更轻松，让爱心传递更便捷，构建一个人宠和谐共处的美好社区。
        </p>
      </article>
    </section>

    <section class="about-section about-values-section">
      <div class="about-section-heading">
        <h2>我们的核心价值</h2>
        <p>以信任为基础，用爱心连接每一个人</p>
      </div>

      <div class="about-value-grid">
        <article v-for="item in valueItems" :key="item.title" class="about-value-card">
          <span class="about-value-icon" :class="item.tone">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="about-section">
      <div class="about-section-heading">
        <h2>我们的团队</h2>
        <p>一群热爱宠物、充满激情的年轻人</p>
      </div>

      <div class="about-team-grid">
        <article v-for="member in teamMembers" :key="member.name" class="about-team-card">
          <img :src="member.avatar" :alt="member.name" />
          <h3>{{ member.name }}</h3>
          <p>{{ member.role }}</p>
        </article>
      </div>
    </section>

    <section class="about-growth-band">
      <div class="about-growth-inner">
        <div class="about-section-heading light">
          <h2>我们的成长</h2>
          <p>感谢每一位用户的信任与支持</p>
        </div>

        <div class="about-growth-grid">
          <article v-for="item in growthStats" :key="item.label" class="about-growth-item">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </div>
    </section>

    <section class="about-community">
      <span class="about-community-icon">
        <el-icon><User /></el-icon>
      </span>
      <h2>加入我们的社区</h2>
      <p>无论你是宠物主人还是爱心铲屎官，宠友邻都欢迎你的到来。</p>
      <div class="about-community-actions">
        <button type="button" class="about-primary-button" @click="openRegister">立即注册</button>
        <button type="button" class="about-secondary-button" @click="contactSupport">
          <el-icon><ChatDotRound /></el-icon>
          联系我们
        </button>
      </div>
    </section>
  </div>
</template>
