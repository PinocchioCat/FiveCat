<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { api } from '../api/client'
import PostCard from '../components/PostCard.vue'
import SectionHeader from '../components/SectionHeader.vue'
import type { PostItem } from '../types/app'

const posts = ref<PostItem[]>([])
const content = ref('')
const tagInput = ref('晒宠, 接单日记')
const publishing = ref(false)

async function loadPosts() {
  posts.value = await api.fetchPosts()
}

async function publishPost() {
  if (!content.value.trim()) {
    ElMessage.warning('先写点内容再发布吧。')
    return
  }
  publishing.value = true
  await api.createPost(
    content.value,
    tagInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  )
  content.value = ''
  publishing.value = false
  ElMessage.success('动态已发布，社区列表已刷新。')
  await loadPosts()
}

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="page-grid">
    <section>
      <SectionHeader eyebrow="Community" title="宠物社区动态" description="围绕宠物日常、服务记录、照护经验三类内容沉淀信任感。" />
      <div class="composer-card">
        <el-form label-position="top">
          <el-form-item label="说点什么">
            <el-input v-model="content" type="textarea" :rows="4" placeholder="分享宠物日常、服务见闻或照护心得" />
          </el-form-item>
          <el-form-item label="标签">
            <el-input v-model="tagInput" placeholder="用英文逗号分隔，例如：晒宠, 喂猫, 接单日记" />
          </el-form-item>
          <el-button type="primary" round :loading="publishing" @click="publishPost">发布动态</el-button>
        </el-form>
      </div>
    </section>

    <section>
      <div class="community-waterfall">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
    </section>
  </div>
</template>
