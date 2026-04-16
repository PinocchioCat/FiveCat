<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import SectionHeader from '../components/SectionHeader.vue'
import { clearSession, currentRole, currentUser, isAuthenticated, pets } from '../store/session'

const router = useRouter()

const isSitter = computed(() => currentRole.value === 'sitter')
const stats = computed(() =>
  isSitter.value
    ? [
        { label: '当前身份', value: '铲屎官' },
        { label: '评分', value: currentUser.value?.rating.toFixed(1) ?? '5.0' },
        { label: '完成服务', value: currentUser.value?.completed_orders ?? 0 },
        { label: '宠物档案', value: pets.value.length }
      ]
    : [
        { label: '当前身份', value: '宠物主人' },
        { label: '完成服务', value: currentUser.value?.completed_orders ?? 0 },
        { label: '宠物档案', value: pets.value.length }
      ]
)

const sitterDetails = computed(() => {
  if (!currentUser.value) return []
  return [
    { label: '注册时间', value: new Date(currentUser.value.registered_at).toLocaleDateString('zh-CN') },
    { label: '性别', value: genderLabel(currentUser.value.gender) },
    { label: '实名认证', value: currentUser.value.is_verified ? '已实名认证' : '未实名认证' },
    { label: '昵称', value: currentUser.value.nickname },
    { label: '个人简介', value: currentUser.value.bio }
  ]
})

function genderLabel(gender?: string) {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未设置'
}

function petGenderLabel(gender?: string) {
  if (gender === 'male') return '公'
  if (gender === 'female') return '母'
  return '未知'
}

async function goOrders() {
  await router.push(isSitter.value ? '/orders?entry=take' : '/my-orders')
}

async function logout() {
  clearSession()
  ElMessage.success('已退出登录')
  await router.push('/')
}
</script>

<template>
  <div v-if="!isAuthenticated || !currentUser" class="empty-state-card">
    <h2>你还没有登录</h2>
    <p>登录后可以查看身份资料、服务记录和宠物档案。</p>
    <el-button type="primary" round @click="$router.push('/auth')">前往登录</el-button>
  </div>

  <div v-else class="profile-grid profile-grid-expanded">
    <section class="profile-main-column">
      <SectionHeader
        eyebrow="Profile"
        title="个人中心"
        :description="isSitter ? '这里集中展示当前铲屎官账号的认证资料、宠物档案和服务表现。' : '这里集中展示你的账号资料、宠物档案和服务信用。'"
      />

      <div class="profile-block profile-hero-card">
        <div class="profile-user-card">
          <img :src="currentUser.avatar" :alt="currentUser.username" />
          <div class="profile-user-copy">
            <h3>{{ currentUser.username }}</h3>
            <p class="profile-note">{{ currentUser.bio }}</p>
            <div class="profile-tag-row">
              <el-tag round effect="dark">{{ currentRole === 'owner' ? '宠物主人' : '铲屎官' }}</el-tag>
              <el-tag v-for="tag in currentUser.tags" :key="tag" round>{{ tag }}</el-tag>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <el-button round @click="goOrders">{{ isSitter ? '查看订单大厅' : '我的订单' }}</el-button>
          <el-button type="danger" plain round @click="logout">退出登录</el-button>
        </div>
      </div>

      <div v-if="isSitter" class="profile-block">
        <h3>铲屎官详细信息</h3>
        <div class="profile-detail-grid">
          <div v-for="item in sitterDetails" :key="item.label" class="profile-detail-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
          <div class="profile-detail-item profile-detail-item-wide">
            <span>标签</span>
            <div class="profile-tag-row">
              <el-tag v-for="tag in currentUser.tags" :key="tag" round>{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-block">
        <h3>{{ isSitter ? '宠物档案' : '我的宠物档案' }}</h3>
        <div class="profile-pet-grid">
          <article v-for="pet in pets" :key="pet.id" class="profile-pet-card">
            <img class="profile-pet-cover" :src="pet.photos[0]" :alt="pet.name" />
            <div class="profile-pet-body">
              <div class="profile-pet-head">
                <strong>{{ pet.name }}</strong>
                <span>{{ pet.species }}</span>
              </div>
              <div class="profile-pet-meta-grid">
                <span>所属物种：{{ pet.species }}</span>
                <span>性别：{{ petGenderLabel(pet.gender) }}</span>
                <span>年龄：{{ pet.age }} 岁</span>
                <span>品种：{{ pet.breed }}</span>
              </div>
              <p>特长：{{ pet.specialty }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="profile-side-column">
      <div class="profile-stats">
        <div v-for="item in stats" :key="item.label" class="stat-card">
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
