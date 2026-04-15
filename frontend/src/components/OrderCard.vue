<script setup lang="ts">
import { Location, Timer } from '@element-plus/icons-vue'

import type { OrderItem } from '../types/app'
import { formatDateTime, speciesLabel, statusLabel, statusTagType } from '../utils/order'

const props = defineProps<{
  order: OrderItem
  actionText?: string
}>()

defineEmits<{
  action: [order: OrderItem]
}>()
</script>

<template>
  <el-card class="pet-card order-card" shadow="hover">
    <div class="card-chip-row">
      <el-tag effect="dark" round>{{ props.order.service_type }}</el-tag>
      <el-tag :type="statusTagType(props.order.status)" round>{{ statusLabel(props.order.status) }}</el-tag>
    </div>
    <h3>{{ props.order.title }}</h3>
    <p>{{ props.order.description }}</p>
    <div class="card-tag-row">
      <el-tag round effect="plain">{{ props.order.pet_count }} 只</el-tag>
      <el-tag round effect="plain">{{ speciesLabel(props.order) }}</el-tag>
    </div>
    <div class="card-meta-row">
      <span><el-icon><Timer /></el-icon>{{ formatDateTime(props.order.service_start_time) }}</span>
      <span><el-icon><Location /></el-icon>{{ props.order.distance_km.toFixed(1) }} km</span>
    </div>
    <div class="order-card-window">
      <span>服务截止：{{ formatDateTime(props.order.service_end_time) }}</span>
      <span>单次时长：{{ props.order.duration_minutes }} 分钟</span>
    </div>
    <div class="card-footer-row">
      <strong>¥{{ props.order.price }}</strong>
      <el-button type="primary" round @click="$emit('action', props.order)">{{ actionText ?? '立即查看' }}</el-button>
    </div>
  </el-card>
</template>
