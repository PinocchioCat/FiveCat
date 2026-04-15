<script setup lang="ts">
import { ChatLineRound, Star } from '@element-plus/icons-vue'

import type { PostItem } from '../types/app'

const props = defineProps<{
  post: PostItem
}>()
</script>

<template>
  <article class="post-card">
    <img class="post-cover" :src="props.post.media_urls[0]" :alt="props.post.content" />
    <div class="post-body">
      <div class="post-author">
        <img :src="props.post.author.avatar" :alt="props.post.author.username" />
        <div>
          <strong>{{ props.post.author.username }}</strong>
          <span>{{ props.post.author.role === 'owner' ? '宠主' : '兼职铲屎官' }}</span>
        </div>
      </div>
      <p>{{ props.post.content }}</p>
      <div class="post-tags">
        <el-tag v-for="tag in props.post.tags" :key="tag" round effect="plain">#{{ tag }}</el-tag>
      </div>
      <div class="post-footer">
        <span><el-icon><Star /></el-icon>{{ props.post.like_count }}</span>
        <span><el-icon><ChatLineRound /></el-icon>即时互动</span>
      </div>
    </div>
  </article>
</template>
