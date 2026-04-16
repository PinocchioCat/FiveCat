<script setup lang="ts">
import { ArrowLeft, Calendar, Document, Location, Plus, Search, User } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

import { api } from '../api/client'
import { currentUser, isAuthenticated } from '../store/session'
import type { OrderItem } from '../types/app'
import { formatCountDown, formatDateTime, speciesLabel, statusLabel, statusTagType } from '../utils/order'

const router = useRouter()
const orders = ref<OrderItem[]>([])
const nowTick = ref(Date.now())
const timer = ref<number | null>(null)
const searchKeyword = ref('')
const ownerOrderFilter = ref<'all' | 'pending_payment' | 'pending_confirmation' | 'pending_review' | 'completed' | 'cancelled' | 'after_sale'>('all')

const ownerOrderFilterOptions = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'pending_confirmation', label: '待确认' },
  { key: 'pending_review', label: '待评价' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'after_sale', label: '售后' }
] as const

const ownerHistoryOrders = computed(() => {
  if (!currentUser.value) return []
  return orders.value.filter((order) => order.owner_id === currentUser.value?.id)
})

function matchesOwnerOrderFilter(order: OrderItem, filter: (typeof ownerOrderFilterOptions)[number]['key']) {
  if (filter === 'all') return true
  if (filter === 'pending_payment') return order.status === 'pending_payment'
  if (filter === 'pending_confirmation') return order.status === 'pending_confirmation'
  if (filter === 'pending_review') return !order.review && ['pending_confirmation', 'completed'].includes(order.status)
  if (filter === 'completed') return order.status === 'completed'
  if (filter === 'cancelled') return order.status === 'cancelled'
  return order.status === 'appealing' || order.status === 'refunding'
}

function orderCode(order: OrderItem) {
  const created = new Date(order.created_at)
  const datePart = `${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}`
  return `DD${datePart}${String(order.id).padStart(5, '0')}`
}

function matchesSearch(order: OrderItem) {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return true
  return [order.title, order.service_type, order.detailed_address, orderCode(order)].some((item) => item.toLowerCase().includes(keyword))
}

const ownerFilteredOrders = computed(() =>
  ownerHistoryOrders.value.filter((order) => matchesOwnerOrderFilter(order, ownerOrderFilter.value) && matchesSearch(order))
)

function countOrdersByFilter(filter: (typeof ownerOrderFilterOptions)[number]['key']) {
  return ownerHistoryOrders.value.filter((order) => matchesOwnerOrderFilter(order, filter)).length
}

const ownerFilterCounts = computed(() =>
  Object.fromEntries(ownerOrderFilterOptions.map((item) => [item.key, countOrdersByFilter(item.key)])) as Record<
    (typeof ownerOrderFilterOptions)[number]['key'],
    number
  >
)

const pageMetrics = computed(() => [
  { label: '全部订单', value: ownerFilterCounts.value.all },
  { label: '待处理', value: ownerFilterCounts.value.pending_payment + ownerFilterCounts.value.pending_confirmation + ownerFilterCounts.value.pending_review },
  { label: '售后中', value: ownerFilterCounts.value.after_sale },
  { label: '已完成', value: ownerFilterCounts.value.completed }
])

const ownerFilterSummary = computed(() => ownerOrderFilterOptions.find((item) => item.key === ownerOrderFilter.value)?.label ?? '全部')
const ownerEmptyTitle = computed(() => (ownerOrderFilter.value === 'all' ? '还没有订单记录' : `暂无${ownerFilterSummary.value}订单`))
const ownerEmptyDescription = computed(() =>
  ownerOrderFilter.value === 'all'
    ? '发布第一条照护需求后，这里会自动汇总当前账号下的全部订单。'
    : `当前正在查看“${ownerFilterSummary.value}”分类，可以切换到其他状态继续查看不同阶段的订单。`
)

function countdownText(order: OrderItem) {
  return formatCountDown(order.payment_deadline_at, nowTick.value)
}

function reviewStars(rating?: number | null) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating ?? 0)))
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating)
}

function syncExpiredPendingPayments(currentTime = Date.now()) {
  orders.value = orders.value.map((order) => {
    if (order.status !== 'pending_payment' || !order.payment_deadline_at) {
      return order
    }

    if (new Date(order.payment_deadline_at).getTime() > currentTime) {
      return order
    }

    return {
      ...order,
      status: 'cancelled',
      cancelled_at: new Date(currentTime).toISOString(),
      cancelled_by: 'system',
      cancel_reason: '支付超时自动取消'
    }
  })
}

function cancelledByLabel(value?: OrderItem['cancelled_by']) {
  if (value === 'owner') return '宠物主人'
  if (value === 'sitter') return '铲屎官'
  if (value === 'system') return '系统'
  return '未记录'
}

function statusMeta(order: OrderItem) {
  if (order.status === 'pending_payment') return `支付倒计时：${countdownText(order)}`
  if (order.status === 'pending') return '已支付成功，订单正在等待合适的铲屎官接单。'
  if (order.status === 'pending_service') return '已有人接单，双方联系方式已开放，可继续沟通上门细节。'
  if (order.status === 'in_service') return '铲屎官已开始服务，当前服务正在进行中。'
  if (order.status === 'pending_confirmation') return '服务已完成，等待你确认结果并留下评价。'
  if (order.status === 'appealing' || order.status === 'refunding') return '订单已进入售后流程，平台会继续跟进处理。'
  if (order.status === 'cancelled') return `取消责任方：${cancelledByLabel(order.cancelled_by)}`
  return '订单已完成。'
}

function ownerStatusMeta(order: OrderItem) {
  if (order.status === 'completed') return ''
  return statusMeta(order)
}

function shouldShowOwnerStatusNote(order: OrderItem) {
  return Boolean(ownerStatusMeta(order) || order.owner_cancel_penalty || order.cancel_reason)
}

function canOwnerCancel(order: OrderItem) {
  return ['pending_payment', 'pending', 'pending_service'].includes(order.status)
}

function orderProviderLabel(order: OrderItem) {
  if (!order.sitter_id) return '平台待分配'
  return `铲屎官 #${order.sitter_id}`
}

function orderPetLabel(order: OrderItem) {
  return `${speciesLabel(order)} · ${order.pet_count}只`
}

function orderCover(order: OrderItem) {
  const species = speciesLabel(order)
  if (species.includes('犬') || order.service_type.includes('遛')) {
    return 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80'
  }
  return 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80'
}

async function loadOrders() {
  orders.value = await api.fetchOrders()
  syncExpiredPendingPayments(nowTick.value)
}

async function pay(orderId: number) {
  await api.payOrder(orderId)
  ElMessage.success('支付成功，订单已进入待接单。')
  await loadOrders()
}

async function confirmCompletion(orderId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请填写这次服务的评价，确认后订单会归档到已完成。', '确认完成', {
      inputPlaceholder: '例如：按时上门、反馈及时，毛孩子状态很稳定。',
      inputValue: '服务完成，过程反馈及时。',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消'
    })
    await api.confirmOrder(orderId, value || '服务完成，过程反馈及时。')
    ElMessage.success('订单已完成，评价已提交。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

async function appeal(orderId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请填写申诉原因，提交后订单会进入售后处理。', '发起申诉', {
      inputPlaceholder: '例如：服务过程与约定不符，需要平台协助处理。',
      confirmButtonText: '发起申诉',
      cancelButtonText: '取消'
    })
    await api.appealOrder(orderId, value || '需要平台介入处理')
    ElMessage.success('订单已进入申诉中。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

async function refund(orderId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请填写退款原因，提交后订单会进入退款处理。', '申请退款', {
      inputPlaceholder: '例如：服务结果不符合要求，希望申请退款。',
      confirmButtonText: '申请退款',
      cancelButtonText: '取消'
    })
    await api.refundOrder(orderId, value || '申请退款')
    ElMessage.success('订单已进入退款中。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

async function cancelOrder(order: OrderItem) {
  try {
    const { value } = await ElMessageBox.prompt('可以补充取消原因，提交后订单会变更为已取消。', '取消订单', {
      inputPlaceholder: '例如：行程有变，今天不再需要上门照护。',
      confirmButtonText: '确认取消',
      cancelButtonText: '返回'
    })
    await api.cancelOrder(order.id, 'owner', value || undefined)
    ElMessage.success('订单已取消。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

onMounted(() => {
  void loadOrders()
  timer.value = window.setInterval(() => {
    const currentTime = Date.now()
    nowTick.value = currentTime
    syncExpiredPendingPayments(currentTime)
  }, 1000)
})

onUnmounted(() => {
  if (timer.value) {
    window.clearInterval(timer.value)
  }
})
</script>

<template>
  <div v-if="!isAuthenticated" class="empty-state-card">
    <h2>请先登录后再查看我的订单</h2>
    <p>登录后可以查看宠物主人账号下的全部订单状态，并继续完成支付、确认、评价和售后处理。</p>
    <el-button type="primary" round @click="$router.push('/auth')">前往登录</el-button>
  </div>

  <div v-else class="owner-orders-dashboard">
    <aside class="owner-orders-sidebar">
      <div class="owner-orders-sidebar-brand">
        <span>账户中心</span>
        <strong>订单管理</strong>
        <p>集中查看照护进度、支付状态和售后处理。</p>
      </div>

      <nav class="owner-orders-sidebar-nav">
        <button type="button" class="owner-orders-side-link active">
          <el-icon><Document /></el-icon>
          <span>我的订单</span>
          <strong>{{ ownerFilterCounts.all }}</strong>
        </button>
        <button type="button" class="owner-orders-side-link" @click="router.push('/orders?entry=publish')">
          <el-icon><Plus /></el-icon>
          <span>发单大厅</span>
        </button>
        <button type="button" class="owner-orders-side-link" @click="router.push('/profile')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回个人中心</span>
        </button>
      </nav>
    </aside>

    <section class="owner-orders-content">
      <header class="owner-orders-topbar">
        <div class="owner-orders-topbar-copy">
          <span class="owner-orders-breadcrumb">个人中心 / 我的订单</span>
          <h1>我的订单</h1>
          <p>查看和管理当前账号下的所有宠物照护服务记录。</p>
        </div>

        <label class="owner-orders-search">
          <el-icon><Search /></el-icon>
          <input v-model="searchKeyword" type="text" placeholder="请输入订单编号、服务标题或地址关键词" />
        </label>
      </header>

      <section class="owner-orders-metrics">
        <article v-for="item in pageMetrics" :key="item.label" class="owner-orders-metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </section>

      <section class="owner-orders-panel">
        <div class="owner-orders-panel-head">
          <div>
            <h2>订单列表</h2>
            <p>按状态筛选后，系统会只展示当前宠物主人账号下对应阶段的订单。</p>
          </div>
        </div>

        <div class="owner-orders-tabs">
          <button
            v-for="item in ownerOrderFilterOptions"
            :key="item.key"
            type="button"
            class="owner-orders-tab"
            :class="{ active: ownerOrderFilter === item.key }"
            @click="ownerOrderFilter = item.key"
          >
            <span>{{ item.label }}</span>
            <strong>{{ ownerFilterCounts[item.key] }}</strong>
          </button>
        </div>

        <div v-if="ownerFilteredOrders.length" class="owner-orders-list">
          <article v-for="order in ownerFilteredOrders" :key="order.id" class="owner-order-card">
            <div class="owner-order-card-head">
              <div class="owner-order-card-meta">
                <span>{{ formatDateTime(order.created_at) }}</span>
                <span>订单号：{{ orderCode(order) }}</span>
              </div>
              <el-tag round :type="statusTagType(order.status)">{{ statusLabel(order.status) }}</el-tag>
            </div>

            <div class="owner-order-card-body">
              <div class="owner-order-card-main">
                <div class="owner-order-card-thumb" :style="{ backgroundImage: `url(${orderCover(order)})` }"></div>

                <div class="owner-order-card-copy">
                  <h3>{{ order.title }}</h3>

                  <div class="owner-order-meta-line">
                    <el-icon><User /></el-icon>
                    <span>接单人：{{ orderProviderLabel(order) }}</span>
                  </div>
                  <div class="owner-order-meta-line">
                    <el-icon><Calendar /></el-icon>
                    <span>服务时间：{{ formatDateTime(order.service_start_time) }} - {{ formatDateTime(order.service_end_time) }}</span>
                  </div>
                  <div class="owner-order-meta-line">
                    <el-icon><Location /></el-icon>
                    <span>位置：{{ order.detailed_address }}</span>
                  </div>

                  <div class="owner-order-pill-row">
                    <span class="owner-order-pill">宠物：{{ orderPetLabel(order) }}</span>
                    <span class="owner-order-pill subtle">服务：{{ order.service_type }}</span>
                  </div>

                  <div v-if="shouldShowOwnerStatusNote(order)" class="owner-order-status-box">
                    <strong v-if="ownerStatusMeta(order)">{{ ownerStatusMeta(order) }}</strong>
                    <span v-if="order.owner_cancel_penalty">主人取消违约金：¥{{ order.owner_cancel_penalty }}</span>
                    <span v-if="order.cancel_reason">备注：{{ order.cancel_reason }}</span>
                  </div>

                  <div v-if="order.review" class="history-review history-review-owner">
                    <div class="history-review-head">
                      <strong>我的评价</strong>
                      <span>{{ reviewStars(order.review.rating) }}</span>
                    </div>
                    <p>{{ order.review.content }}</p>
                  </div>
                </div>
              </div>

              <div class="owner-order-card-side">
                <div class="owner-order-price-block">
                  <span>实付款</span>
                  <strong>¥{{ order.price.toFixed(2) }}</strong>
                </div>

                <div class="owner-order-actions">
                  <el-button
                    v-if="order.status === 'pending_payment'"
                    class="payment-countdown-button"
                    round
                    @click="pay(order.id)"
                  >
                    支付 {{ countdownText(order) }}
                  </el-button>
                  <el-button v-if="canOwnerCancel(order)" round @click="cancelOrder(order)">取消订单</el-button>
                  <el-button v-if="order.status === 'pending_confirmation'" round @click="router.push('/profile')">联系接单人</el-button>
                  <el-button v-if="order.status === 'pending_confirmation'" type="primary" round @click="confirmCompletion(order.id)">确认完成</el-button>
                  <el-button v-if="order.status === 'pending_confirmation'" type="warning" round @click="appeal(order.id)">发起申诉</el-button>
                  <el-button v-if="order.status === 'pending_confirmation'" type="danger" plain round @click="refund(order.id)">申请退款</el-button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state-card compact">
          <h3>{{ ownerEmptyTitle }}</h3>
          <p>{{ ownerEmptyDescription }}</p>
          <el-button type="primary" round @click="router.push('/orders?entry=publish')">去发布新订单</el-button>
        </div>
      </section>
    </section>
  </div>
</template>
