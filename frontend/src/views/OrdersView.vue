<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { api } from '../api/client'
import AmapPicker from '../components/AmapPicker.vue'
import OrderCard from '../components/OrderCard.vue'
import SectionHeader from '../components/SectionHeader.vue'
import { currentRole, currentUser, isAuthenticated, pets } from '../store/session'
import type { GeoPoint, OrderItem } from '../types/app'
import {
  ORDER_SERVICE_OPTIONS,
  ORDER_VACCINATION_OPTIONS,
  addMinutes,
  calculateOrderPricing,
  formatCountDown,
  formatDateTime,
  formatDateTimeValue,
  haversineDistanceKm,
  nextHalfHour,
  normalizeHalfHourDateTime,
  speciesLabel,
  statusLabel,
  statusTagType,
  validateServiceWindow
} from '../utils/order'

const route = useRoute()
const router = useRouter()
const orders = ref<OrderItem[]>([])
const submitting = ref(false)
const nowTick = ref(Date.now())
const timer = ref<number | null>(null)
const petSpeciesOptions = ['外国猫', '中华田园猫', '大型犬', '小型犬', '茶杯犬', '中华田园犬', '鼠类', '兔子', '爬行类', '其他']

const defaultStart = nextHalfHour()
const defaultEnd = addMinutes(defaultStart, 60)
const pickerPoint = ref<GeoPoint>(currentUser.value?.location ?? { latitude: 31.2304, longitude: 121.4737 })

const form = reactive({
  service_type: '',
  title: '今晚需要上门喂猫',
  description: '两只猫，需要加粮、换水，并简单清理猫砂。',
  service_start_time: formatDateTimeValue(defaultStart),
  service_end_time: formatDateTimeValue(defaultEnd),
  duration_minutes: 30,
  pet_count: 1,
  pet_species: '外国猫',
  pet_species_other: '',
  detailed_address: '',
  key_handover_method: '待铲屎官接单后一对一联系对接',
  pet_temperament: '',
  vaccination_status: '已齐全' as '已齐全' | '未齐全',
  vaccination_notes: '',
  pet_ids: [1]
})

const preferredEntry = computed<'publish' | 'take'>(() => {
  if (route.query.entry === 'publish' || route.query.entry === 'take') {
    return route.query.entry
  }
  return currentRole.value === 'owner' ? 'publish' : 'take'
})

const entryCopy = computed(() =>
  preferredEntry.value === 'publish'
    ? {
        current: '发单大厅',
        description: '宠物主人可以在这里填写起止服务时间、自动计价并完成待支付到待接单的本地演示流程。'
      }
    : {
        current: '接单大厅',
        description: '铲屎官可以在这里浏览待接订单，并继续演示待服务、服务中、待确认等状态流转。'
      }
)

const ownerHistoryOrders = computed(() => {
  if (!currentUser.value) return []
  return orders.value.filter((order) => order.owner_id === currentUser.value?.id)
})

const sitterHistoryOrders = computed(() => {
  if (!currentUser.value) return []
  return orders.value.filter((order) => order.sitter_id === currentUser.value?.id)
})

const nearbyOrders = computed(() => orders.value.filter((order) => order.status === 'pending'))
const showSpeciesOther = computed(() => form.pet_species === '其他')
const showVaccinationNotes = computed(() => form.vaccination_status === '未齐全')

const estimatedDistanceKm = computed(() => {
  if (!currentUser.value) return 0
  return haversineDistanceKm(
    currentUser.value.location.latitude,
    currentUser.value.location.longitude,
    pickerPoint.value.latitude,
    pickerPoint.value.longitude
  )
})

const pricingPreview = computed(() =>
  calculateOrderPricing({
    serviceType: form.service_type || '喂猫',
    petCount: form.pet_count,
    distanceKm: estimatedDistanceKm.value,
    serviceStartTime: form.service_start_time
  })
)

watch(
  () => form.service_start_time,
  (value) => {
    if (!value) return
    const normalized = normalizeHalfHourDateTime(value)
    if (normalized !== value) {
      form.service_start_time = normalized
      return
    }
    if (new Date(form.service_end_time).getTime() <= new Date(form.service_start_time).getTime()) {
      form.service_end_time = formatDateTimeValue(addMinutes(form.service_start_time, 60))
    }
  }
)

watch(
  () => form.service_end_time,
  (value) => {
    if (!value) return
    const normalized = normalizeHalfHourDateTime(value)
    if (normalized !== value) {
      form.service_end_time = normalized
    }
  }
)

watch(
  () => form.vaccination_status,
  (value) => {
    if (value === '已齐全') {
      form.vaccination_notes = ''
    }
  }
)

function reviewStars(rating?: number | null) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating ?? 0)))
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating)
}

function countdownText(order: OrderItem) {
  return formatCountDown(order.payment_deadline_at, nowTick.value)
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

function statusMeta(order: OrderItem) {
  if (order.status === 'pending_payment') return `支付倒计时：${countdownText(order)}`
  if (order.status === 'pending') return '支付成功后已进入待接单，等待铲屎官接单。'
  if (order.status === 'pending_service') return '铲屎官已接单，双方联系方式已开放，可一对一联系。'
  if (order.status === 'in_service') return '铲屎官已按约开始服务。'
  if (order.status === 'pending_confirmation') return '服务已完成，等待宠物主人确认并评价。'
  if (order.status === 'appealing' || order.status === 'refunding') return '订单已冻结，平台可介入调取服务存证。'
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

function cancelledByLabel(value?: OrderItem['cancelled_by']) {
  if (value === 'owner') return '宠物主人'
  if (value === 'sitter') return '铲屎官'
  if (value === 'system') return '系统'
  return '未记录'
}

function canOwnerCancel(order: OrderItem) {
  return ['pending_payment', 'pending', 'pending_service'].includes(order.status)
}

function canSitterCancel(order: OrderItem) {
  return ['pending_service', 'in_service'].includes(order.status)
}

async function loadOrders() {
  orders.value = await api.fetchOrders()
  syncExpiredPendingPayments(nowTick.value)
}

function validateForm() {
  if (!currentUser.value) return '请先登录'
  if (!form.service_type) return '请选择服务类型'
  if (showSpeciesOther.value && !form.pet_species_other.trim()) return '选择“其他”时，请补充填写宠物物种'
  if (!form.detailed_address.trim()) return '请填写详细地址'
  if (!form.pet_temperament.trim()) return '请填写宠物性格描述'
  if (showVaccinationNotes.value && !form.vaccination_notes.trim()) return '选择疫苗未齐全时，请补充说明'
  if (form.pet_count < 1 || form.pet_count > 5) return '宠物数量当前限制为 1 到 5 只'
  if (form.duration_minutes < 0 || form.duration_minutes > 60) return '单次服务时长需要在 0 到 60 分钟之间'
  return validateServiceWindow(form.service_start_time, form.service_end_time)
}

async function submitOrder() {
  const validationMessage = validateForm()
  if (validationMessage) {
    ElMessage.warning(validationMessage)
    return
  }

  submitting.value = true
  try {
    await api.createOrder({
      owner_id: currentUser.value!.id,
      service_type: form.service_type,
      title: form.title,
      description: form.description,
      service_start_time: form.service_start_time,
      service_end_time: form.service_end_time,
      duration_minutes: form.duration_minutes,
      pet_count: form.pet_count,
      pet_species: form.pet_species,
      pet_species_other: showSpeciesOther.value ? form.pet_species_other.trim() : null,
      pet_ids: form.pet_ids,
      detailed_address: form.detailed_address.trim(),
      key_handover_method: form.key_handover_method.trim(),
      pet_temperament: form.pet_temperament.trim(),
      vaccination_status: form.vaccination_status,
      vaccination_notes: showVaccinationNotes.value ? form.vaccination_notes.trim() : null,
      location: pickerPoint.value
    })
    ElMessage.success('订单已发布，状态已进入待支付。')
    await loadOrders()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发单失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

async function pay(orderId: number) {
  await api.payOrder(orderId)
  ElMessage.success('支付成功，订单已变更为待接单。')
  await loadOrders()
}

async function accept(orderId: number) {
  await api.acceptOrder(orderId)
  ElMessage.success('接单成功，订单已进入待服务。')
  await loadOrders()
}

async function startService(orderId: number) {
  await api.startOrderService(orderId)
  ElMessage.success('订单已进入服务中。')
  await loadOrders()
}

async function completeService(orderId: number) {
  await api.completeOrderService(orderId)
  ElMessage.success('订单已进入待确认。')
  await loadOrders()
}

async function confirmCompletion(orderId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请填写服务评价，确认后订单会变更为已完成。', '确认完成', {
      inputPlaceholder: '例如：按时到达，服务过程反馈很细致',
      inputValue: '服务完成，反馈及时。',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消'
    })
    await api.confirmOrder(orderId, value || '服务完成，反馈及时。')
    ElMessage.success('订单已完成，评价也已提交。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

async function appeal(orderId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请填写申诉原因，订单会进入申诉中。', '发起申诉', {
      inputPlaceholder: '例如：服务过程与约定不符，需要平台介入',
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
    const { value } = await ElMessageBox.prompt('请填写退款原因，订单会进入退款中。', '申请退款', {
      inputPlaceholder: '例如：服务结果不符合要求，申请退款',
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

async function cancelOrder(order: OrderItem, actor: 'owner' | 'sitter') {
  const title = actor === 'owner' ? '取消订单' : '取消接单'
  try {
    const { value } = await ElMessageBox.prompt('可以补充取消原因，提交后订单会变更为已取消。', title, {
      inputPlaceholder: actor === 'owner' ? '例如：临时改期，需要取消本次服务' : '例如：时间冲突，无法按时履约',
      confirmButtonText: '确认取消',
      cancelButtonText: '返回'
    })
    await api.cancelOrder(order.id, actor, value || undefined)
    ElMessage.success(actor === 'owner' ? '订单已取消。' : '接单已取消。')
    await loadOrders()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

function switchEntry(entry: 'publish' | 'take') {
  void router.replace({ path: '/orders', query: { entry } })
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
    <h2>请先登录后再进入订单大厅</h2>
    <p>登录后可以按身份进入发单或接单入口，继续完成本地体验闭环。</p>
    <el-button type="primary" round @click="$router.push('/auth')">前往登录</el-button>
  </div>

  <div v-else class="orders-shell">
    <section class="orders-entry-switch">
      <div>
        <h2>{{ entryCopy.current }}</h2>
        <p>{{ entryCopy.description }}</p>
      </div>
      <div class="orders-entry-actions">
        <button type="button" class="orders-entry-option" :class="{ active: preferredEntry === 'publish' }" @click="switchEntry('publish')">
          发单大厅
        </button>
        <button type="button" class="orders-entry-option" :class="{ active: preferredEntry === 'take' }" @click="switchEntry('take')">
          接单大厅
        </button>
      </div>
    </section>

    <div v-if="preferredEntry === 'publish'" class="orders-grid">
      <section>
        <SectionHeader
          eyebrow="Publish"
          title="发单大厅"
          description="支持服务起止时间、半小时时间槽、自动计价、待支付倒计时和订单状态流转演示。"
        />
        <div class="composer-card">
          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :md="12" :span="24">
                <el-form-item label="服务类型">
                  <el-select v-model="form.service_type" placeholder="请选择">
                    <el-option label="请选择" value="" />
                    <el-option v-for="item in ORDER_SERVICE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :md="12" :span="24">
                <el-form-item label="服务价格">
                  <el-input :model-value="`¥${pricingPreview.total_price}`" readonly />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="order-pricing-preview">
              <span>基础价 ¥{{ pricingPreview.base_price }}</span>
              <span>宠物加价 ¥{{ pricingPreview.pet_count_surcharge }}</span>
              <span>距离加价 ¥{{ pricingPreview.distance_surcharge }}</span>
              <span>附加服务 ¥{{ pricingPreview.service_surcharge }}</span>
              <span>春节加价 ¥{{ pricingPreview.holiday_surcharge }}</span>
              <span>预计距离 {{ estimatedDistanceKm.toFixed(1) }} km</span>
            </div>

            <el-row :gutter="16">
              <el-col :md="12" :span="24">
                <el-form-item label="宠物数量">
                  <el-input-number v-model="form.pet_count" :min="1" :max="5" />
                </el-form-item>
              </el-col>
              <el-col :md="12" :span="24">
                <el-form-item label="您的宠物是">
                  <el-select v-model="form.pet_species" placeholder="请选择宠物物种">
                    <el-option v-for="item in petSpeciesOptions" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item v-if="showSpeciesOther" label="其他物种说明">
              <el-input v-model="form.pet_species_other" placeholder="请输入具体物种或品类" />
            </el-form-item>
            <el-form-item label="订单标题">
              <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="照顾说明">
              <el-input v-model="form.description" type="textarea" :rows="4" />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :md="12" :span="24">
                <el-form-item label="开始时间">
                  <el-date-picker
                    v-model="form.service_start_time"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm"
                    :clearable="false"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :md="12" :span="24">
                <el-form-item label="结束时间">
                  <el-date-picker
                    v-model="form.service_end_time"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm"
                    :clearable="false"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="order-form-hint">
              开始时间必须晚于当前时间，起止时间只支持整点或半点。结束时间需晚于开始时间。
            </div>

            <el-row :gutter="16">
              <el-col :md="12" :span="24">
                <el-form-item label="单次服务时长（分钟）">
                  <el-input-number v-model="form.duration_minutes" :min="0" :max="60" :step="5" />
                </el-form-item>
              </el-col>
              <el-col :md="12" :span="24">
                <el-form-item label="钥匙获取方式">
                  <el-input v-model="form.key_handover_method" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="宠物性格描述">
              <el-input
                v-model="form.pet_temperament"
                type="textarea"
                :rows="3"
                placeholder="例如：亲人/慢热/怕生/喜欢逗猫棒/不喜欢陌生人突然靠近"
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :md="12" :span="24">
                <el-form-item label="疫苗情况">
                  <el-select v-model="form.vaccination_status">
                    <el-option v-for="item in ORDER_VACCINATION_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="showVaccinationNotes" :md="12" :span="24">
                <el-form-item label="疫苗情况补充说明">
                  <el-input v-model="form.vaccination_notes" placeholder="请说明未齐全的情况或注意事项" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="关联宠物档案（可选）">
              <el-checkbox-group v-model="form.pet_ids">
                <el-checkbox v-for="pet in pets" :key="pet.id" :label="pet.id">{{ pet.name }} / {{ pet.breed }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="详细地址">
              <el-input
                v-model="form.detailed_address"
                placeholder="请详细描述位置小区楼栋以及门牌号"
              />
            </el-form-item>
            <el-form-item label="地图取点">
              <AmapPicker v-model="pickerPoint" />
            </el-form-item>
            <el-button type="primary" size="large" round :loading="submitting" @click="submitOrder">发布订单</el-button>
          </el-form>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="History" title="我的历史订单" description="这里只显示当前登录账号已经发出的订单，并支持继续演示支付、取消、确认完成和申诉退款。" />
        <div v-if="ownerHistoryOrders.length" class="history-list">
          <article v-for="order in ownerHistoryOrders" :key="order.id" class="history-card">
            <div class="card-chip-row">
              <el-tag effect="dark" round>{{ order.service_type }}</el-tag>
              <el-tag round :type="statusTagType(order.status)">{{ statusLabel(order.status) }}</el-tag>
            </div>
            <h3>{{ order.title }}</h3>
            <p>{{ order.description }}</p>
            <div class="history-detail-grid">
              <span>宠物数量：{{ order.pet_count }} 只</span>
              <span>宠物物种：{{ speciesLabel(order) }}</span>
              <span>开始时间：{{ formatDateTime(order.service_start_time) }}</span>
              <span>结束时间：{{ formatDateTime(order.service_end_time) }}</span>
              <span>单次时长：{{ order.duration_minutes }} 分钟</span>
              <span>发布时间：{{ formatDateTime(order.created_at) }}</span>
            </div>
            <div class="order-detail-note">
              <strong>详细地址</strong>
              <p>{{ order.detailed_address }}</p>
            </div>
            <div class="order-detail-note">
              <strong>钥匙获取方式</strong>
              <p>{{ order.key_handover_method }}</p>
            </div>
            <div class="order-detail-note">
              <strong>宠物性格与疫苗情况</strong>
              <p>{{ order.pet_temperament }}</p>
              <p>疫苗：{{ order.vaccination_status }}<span v-if="order.vaccination_notes">，{{ order.vaccination_notes }}</span></p>
            </div>
            <div v-if="shouldShowOwnerStatusNote(order)" class="order-status-note">
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
            <div class="order-action-row">
              <el-button
                v-if="order.status === 'pending_payment'"
                class="payment-countdown-button"
                round
                @click="pay(order.id)"
              >
                支付 {{ countdownText(order) }}
              </el-button>
              <el-button v-if="canOwnerCancel(order)" round @click="cancelOrder(order, 'owner')">取消订单</el-button>
              <el-button v-if="order.status === 'pending_confirmation'" type="primary" round @click="confirmCompletion(order.id)">确认完成</el-button>
              <el-button v-if="order.status === 'pending_confirmation'" type="warning" round @click="appeal(order.id)">发起申诉</el-button>
              <el-button v-if="order.status === 'pending_confirmation'" type="danger" plain round @click="refund(order.id)">申请退款</el-button>
            </div>
            <div class="card-footer-row">
              <strong>¥{{ order.price }}</strong>
              <span class="history-order-id">订单号 #{{ order.id }}</span>
            </div>
          </article>
        </div>
        <div v-else class="empty-state-card compact">
          <h3>还没有历史订单</h3>
          <p>发布第一条照护需求后，这里会自动展示当前登录账号的订单记录。</p>
        </div>
      </section>
    </div>

    <div v-else class="orders-grid">
      <section>
        <SectionHeader eyebrow="Take" title="接单大厅" description="这里只展示已经支付完成、正等待铲屎官接单的订单。" />
        <div class="order-list">
          <OrderCard
            v-for="order in nearbyOrders"
            :key="order.id"
            :order="order"
            action-text="马上接单"
            @action="accept(order.id)"
          />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="History" title="我的历史接单" description="这里会展示当前登录铲屎官的历史接单信息，也可以继续演示开始服务和完成服务。" />
        <div v-if="sitterHistoryOrders.length" class="history-list">
          <article v-for="order in sitterHistoryOrders" :key="order.id" class="history-card history-card-sitter">
            <div class="card-chip-row">
              <el-tag effect="dark" round>{{ order.service_type }}</el-tag>
              <el-tag round :type="statusTagType(order.status)">{{ statusLabel(order.status) }}</el-tag>
            </div>
            <h3>{{ order.title }}</h3>
            <p>{{ order.description }}</p>
            <div class="history-detail-grid">
              <span>宠物数量：{{ order.pet_count }} 只</span>
              <span>宠物物种：{{ speciesLabel(order) }}</span>
              <span>开始时间：{{ formatDateTime(order.service_start_time) }}</span>
              <span>结束时间：{{ formatDateTime(order.service_end_time) }}</span>
              <span>详细地址：{{ order.detailed_address }}</span>
              <span>接单状态：{{ statusLabel(order.status) }}</span>
            </div>
            <div class="order-status-note">
              <strong>{{ statusMeta(order) }}</strong>
              <span v-if="order.contacts_unlocked_at">联系方式开放时间：{{ formatDateTime(order.contacts_unlocked_at) }}</span>
              <span v-if="order.cancel_reason">备注：{{ order.cancel_reason }}</span>
            </div>
            <div v-if="order.review" class="history-review">
              <div class="history-review-head">
                <strong>宠主评价</strong>
                <span>{{ reviewStars(order.review.rating) }}</span>
              </div>
              <p>{{ order.review.content }}</p>
              <span class="history-review-meta">{{ order.review.reviewer_name }} · {{ formatDateTime(order.review.created_at) }}</span>
            </div>
            <div v-else class="history-review history-review-pending">
              <div class="history-review-head">
                <strong>宠主评价</strong>
                <span>待评价</span>
              </div>
              <p>当前订单尚未收到宠主评价，完成服务并经宠主确认后这里会自动展示。</p>
            </div>
            <div class="order-action-row">
              <el-button v-if="order.status === 'pending_service'" type="primary" round @click="startService(order.id)">开始服务</el-button>
              <el-button v-if="order.status === 'in_service'" type="primary" round @click="completeService(order.id)">完成服务</el-button>
              <el-button v-if="canSitterCancel(order)" round @click="cancelOrder(order, 'sitter')">取消订单</el-button>
            </div>
            <div class="card-footer-row">
              <strong>¥{{ order.price }}</strong>
              <span class="history-order-id">订单号 #{{ order.id }}</span>
            </div>
          </article>
        </div>
        <div v-else class="empty-state-card compact">
          <h3>还没有历史接单</h3>
          <p>成功接单后，这里会自动展示当前登录账号的历史接单信息和宠主评价。</p>
        </div>
      </section>
    </div>
  </div>
</template>
