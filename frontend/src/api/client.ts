import type {
  CreateOrderPayload,
  HomeOverview,
  LoginResponse,
  OrderItem,
  OrderPricing,
  OrderReview,
  PetItem,
  PostItem,
  SupportConversation,
  SupportMessage,
  UserProfile
} from '../types/app'
import { currentUser } from '../store/session'
import * as mock from './mock'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
const REQUEST_TIMEOUT_MS = 8000

class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function translateValidationMessage(field: string | undefined, message: string) {
  const fieldLabelMap: Record<string, string> = {
    service_type: '服务类型',
    title: '订单标题',
    description: '照顾说明',
    service_start_time: '开始时间',
    service_end_time: '结束时间',
    duration_minutes: '单次服务时长',
    pet_count: '宠物数量',
    pet_species: '宠物物种',
    pet_species_other: '其他物种说明',
    detailed_address: '详细地址',
    key_handover_method: '钥匙获取方式',
    pet_temperament: '宠物性格描述',
    vaccination_status: '疫苗情况',
    vaccination_notes: '疫苗情况补充说明'
  }

  if (field === 'vaccination_status') {
    return '疫苗情况有误，请重新选择“已齐全”或“未齐全”'
  }
  if (field === 'pet_species_other') {
    return '选择“其他”时，请补充填写宠物物种'
  }
  if (field === 'vaccination_notes') {
    return '选择“未齐全”时，请补充疫苗情况说明'
  }
  if (message.includes('开始时间必须晚于当前时间')) {
    return '开始时间必须晚于当前时间'
  }
  if (message.includes('结束时间必须晚于开始时间')) {
    return '结束时间必须晚于开始时间'
  }
  if (message.includes('服务时间只能选择整点或半点')) {
    return '服务时间只能选择整点或半点'
  }
  if (message.includes('String should match pattern')) {
    return `${fieldLabelMap[field ?? ''] ?? '表单信息'}格式不正确，请重新填写`
  }
  if (message.includes('at least')) {
    return `${fieldLabelMap[field ?? ''] ?? '表单信息'}填写不完整，请检查后重试`
  }
  return message
}

function parseApiError(response: Response, detail: unknown) {
  if (typeof detail === 'string') {
    return new ApiError(detail, response.status, detail)
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const message = detail
      .map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : undefined
        const rawMessage = item?.msg ?? item?.message ?? '提交信息有误'
        return translateValidationMessage(field, rawMessage)
      })
      .join('；')
    return new ApiError(message, response.status, detail)
  }

  return new ApiError(`请求失败：${response.status}`, response.status, detail)
}

function shouldUseMockFallback(error: unknown) {
  if (error instanceof ApiError) {
    return error.status >= 500
  }
  if (!(error instanceof Error)) {
    return false
  }
  return error.message.includes('请求超时') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = init?.signal ? null : new AbortController()
  const timeoutId = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
      signal: init?.signal ?? controller?.signal
    })
    if (!response.ok) {
      try {
        const errorPayload = await response.json()
        const apiError = parseApiError(response, errorPayload?.detail)
        throw apiError
      } catch (error) {
        if (error instanceof ApiError) {
          throw error
        }
        throw new ApiError(`请求失败：${response.status}`, response.status)
      }
    }
    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function withFallback<T>(runner: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await runner()
  } catch (error) {
    console.warn('PetNeighbor API fallback to mock data.', error)
    return fallback()
  }
}

function normalizeReview(raw?: Partial<OrderReview> | null, fallback?: Partial<OrderReview> | null): OrderReview | null {
  if (!raw && !fallback) return null
  return {
    rating: raw?.rating ?? fallback?.rating ?? 5,
    content: raw?.content ?? fallback?.content ?? '',
    reviewer_name: raw?.reviewer_name ?? fallback?.reviewer_name ?? '宠主',
    created_at: raw?.created_at ?? fallback?.created_at ?? new Date().toISOString()
  }
}

function normalizePricing(raw?: Partial<OrderPricing> | null, fallback?: Partial<OrderPricing> | null): OrderPricing | null {
  if (!raw && !fallback) return null
  return {
    base_price: raw?.base_price ?? fallback?.base_price ?? 40,
    pet_count_surcharge: raw?.pet_count_surcharge ?? fallback?.pet_count_surcharge ?? 0,
    distance_surcharge: raw?.distance_surcharge ?? fallback?.distance_surcharge ?? 0,
    service_surcharge: raw?.service_surcharge ?? fallback?.service_surcharge ?? 0,
    holiday_surcharge: raw?.holiday_surcharge ?? fallback?.holiday_surcharge ?? 0,
    total_price: raw?.total_price ?? fallback?.total_price ?? 40
  }
}

function normalizeOrder(raw: Partial<OrderItem>, fallback?: Partial<OrderItem>): OrderItem {
  const petIds = raw.pet_ids ?? fallback?.pet_ids ?? []
  const petCount = raw.pet_count ?? fallback?.pet_count ?? (petIds.length > 0 ? petIds.length : 1)
  const petSpecies = raw.pet_species ?? fallback?.pet_species ?? '其他'
  const petSpeciesOther = raw.pet_species_other ?? fallback?.pet_species_other ?? null
  const serviceStartTime = raw.service_start_time ?? fallback?.service_start_time ?? raw.service_time ?? fallback?.service_time ?? new Date().toISOString()
  const serviceEndTime = raw.service_end_time ?? fallback?.service_end_time ?? serviceStartTime

  return {
    id: raw.id ?? fallback?.id ?? Date.now(),
    owner_id: raw.owner_id ?? fallback?.owner_id ?? 1,
    sitter_id: raw.sitter_id ?? fallback?.sitter_id ?? null,
    status: raw.status ?? fallback?.status ?? 'pending_payment',
    service_type: raw.service_type ?? fallback?.service_type ?? '',
    title: raw.title ?? fallback?.title ?? '',
    description: raw.description ?? fallback?.description ?? '',
    price: raw.price ?? fallback?.price ?? 0,
    service_time: raw.service_time ?? fallback?.service_time ?? serviceStartTime,
    service_start_time: serviceStartTime,
    service_end_time: serviceEndTime,
    duration_minutes: raw.duration_minutes ?? fallback?.duration_minutes ?? 30,
    pet_count: petCount,
    pet_species: petSpecies,
    pet_species_other: petSpeciesOther,
    pet_ids: petIds,
    detailed_address: raw.detailed_address ?? fallback?.detailed_address ?? '',
    key_handover_method: raw.key_handover_method ?? fallback?.key_handover_method ?? '待铲屎官接单后一对一联系对接',
    pet_temperament: raw.pet_temperament ?? fallback?.pet_temperament ?? '',
    vaccination_status: raw.vaccination_status ?? fallback?.vaccination_status ?? '已齐全',
    vaccination_notes: raw.vaccination_notes ?? fallback?.vaccination_notes ?? null,
    distance_km: raw.distance_km ?? fallback?.distance_km ?? 0,
    created_at: raw.created_at ?? fallback?.created_at ?? new Date().toISOString(),
    payment_deadline_at: raw.payment_deadline_at ?? fallback?.payment_deadline_at ?? null,
    payment_paid_at: raw.payment_paid_at ?? fallback?.payment_paid_at ?? null,
    accepted_at: raw.accepted_at ?? fallback?.accepted_at ?? null,
    contacts_unlocked_at: raw.contacts_unlocked_at ?? fallback?.contacts_unlocked_at ?? null,
    service_started_at: raw.service_started_at ?? fallback?.service_started_at ?? null,
    service_completed_at: raw.service_completed_at ?? fallback?.service_completed_at ?? null,
    completed_at: raw.completed_at ?? fallback?.completed_at ?? null,
    cancelled_at: raw.cancelled_at ?? fallback?.cancelled_at ?? null,
    cancelled_by: raw.cancelled_by ?? fallback?.cancelled_by ?? null,
    cancel_reason: raw.cancel_reason ?? fallback?.cancel_reason ?? null,
    owner_cancel_penalty: raw.owner_cancel_penalty ?? fallback?.owner_cancel_penalty ?? 0,
    pricing: normalizePricing(raw.pricing, fallback?.pricing),
    location: raw.location ?? fallback?.location ?? { latitude: 0, longitude: 0 },
    review: normalizeReview(raw.review, fallback?.review)
  }
}

function currentUserId(defaultId = 1) {
  return currentUser.value?.id ?? defaultId
}

function supportQuery(guestSessionId?: string) {
  if (guestSessionId) {
    return `guest_session_id=${encodeURIComponent(guestSessionId)}`
  }

  return `user_id=${currentUserId()}`
}

export const api = {
  fetchHomeOverview: (): Promise<HomeOverview> => withFallback(() => requestJson('/home/overview'), mock.fetchHomeOverview),
  fetchMe: (): Promise<UserProfile> =>
    withFallback(() => requestJson(`/users/me?user_id=${currentUserId()}`), mock.fetchMe),
  fetchPets: (): Promise<PetItem[]> =>
    withFallback(() => requestJson(`/users/me/pets?user_id=${currentUserId()}`), mock.fetchPets),
  switchRole: (role: 'owner' | 'sitter'): Promise<UserProfile> =>
    withFallback(
      () => requestJson(`/users/me/role?user_id=${currentUserId()}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
      () => mock.switchRole(role)
    ),
  fetchOrders: (): Promise<OrderItem[]> =>
    withFallback(
      async () => (await requestJson<Partial<OrderItem>[]>('/orders')).map((item) => normalizeOrder(item)),
      mock.fetchOrders
    ),
  fetchNearbyOrders: (): Promise<OrderItem[]> =>
    withFallback(
      async () =>
        (await requestJson<Partial<OrderItem>[]>('/orders/nearby?latitude=31.2304&longitude=121.4737&radius_km=5')).map((item) => normalizeOrder(item)),
      mock.fetchNearbyOrders
    ),
  createOrder: (payload: CreateOrderPayload): Promise<OrderItem> =>
    (async () => {
      try {
        const response = await requestJson<Partial<OrderItem>>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            owner_id: payload.owner_id,
            service_type: payload.service_type,
            title: payload.title,
            description: payload.description,
            service_start_time: payload.service_start_time,
            service_end_time: payload.service_end_time,
            duration_minutes: payload.duration_minutes,
            pet_count: payload.pet_count,
            pet_species: payload.pet_species,
            pet_species_other: payload.pet_species_other ?? null,
            pet_ids: payload.pet_ids,
            detailed_address: payload.detailed_address,
            key_handover_method: payload.key_handover_method,
            pet_temperament: payload.pet_temperament,
            vaccination_status: payload.vaccination_status,
            vaccination_notes: payload.vaccination_notes ?? null,
            location: payload.location
          })
        })
        return normalizeOrder(response, payload as Partial<OrderItem>)
      } catch (error) {
        if (shouldUseMockFallback(error)) {
          return mock.createOrder(payload)
        }
        throw error
      }
    })(),
  payOrder: (orderId: number): Promise<OrderItem> =>
    withFallback(
      async () => normalizeOrder(await requestJson<Partial<OrderItem>>(`/orders/${orderId}/pay`, { method: 'POST' })),
      () => mock.payOrder(orderId)
    ),
  acceptOrder: (orderId: number): Promise<OrderItem> =>
    withFallback(
      async () =>
        normalizeOrder(
          await requestJson<Partial<OrderItem>>(`/orders/${orderId}/accept`, {
            method: 'POST',
            body: JSON.stringify({ sitter_id: currentUserId(2) })
          })
        ),
      () => mock.acceptOrder(orderId)
    ),
  startOrderService: (orderId: number): Promise<OrderItem> =>
    withFallback(
      async () => normalizeOrder(await requestJson<Partial<OrderItem>>(`/orders/${orderId}/start`, { method: 'POST' })),
      () => mock.startOrderService(orderId)
    ),
  completeOrderService: (orderId: number): Promise<OrderItem> =>
    withFallback(
      async () => normalizeOrder(await requestJson<Partial<OrderItem>>(`/orders/${orderId}/complete`, { method: 'POST' })),
      () => mock.completeOrderService(orderId)
    ),
  confirmOrder: (orderId: number, content: string, rating = 5): Promise<OrderItem> =>
    withFallback(
      async () =>
        normalizeOrder(
          await requestJson<Partial<OrderItem>>(`/orders/${orderId}/confirm`, {
            method: 'POST',
            body: JSON.stringify({ reviewer_name: currentUser.value?.nickname ?? '宠主', content, rating })
          })
        ),
      () => mock.confirmOrder(orderId, content, rating)
    ),
  appealOrder: (orderId: number, reason: string): Promise<OrderItem> =>
    withFallback(
      async () =>
        normalizeOrder(
          await requestJson<Partial<OrderItem>>(`/orders/${orderId}/appeal`, {
            method: 'POST',
            body: JSON.stringify({ reason })
          })
        ),
      () => mock.appealOrder(orderId, reason)
    ),
  refundOrder: (orderId: number, reason: string): Promise<OrderItem> =>
    withFallback(
      async () =>
        normalizeOrder(
          await requestJson<Partial<OrderItem>>(`/orders/${orderId}/refund`, {
            method: 'POST',
            body: JSON.stringify({ reason })
          })
        ),
      () => mock.refundOrder(orderId, reason)
    ),
  cancelOrder: (orderId: number, cancelledBy: 'owner' | 'sitter' | 'system', reason?: string): Promise<OrderItem> =>
    withFallback(
      async () =>
        normalizeOrder(
          await requestJson<Partial<OrderItem>>(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ cancelled_by: cancelledBy, reason: reason ?? null })
          })
        ),
      () => mock.cancelOrder(orderId, cancelledBy, reason)
    ),
  createTemporarySupportSession: (): Promise<SupportConversation> =>
    withFallback(
      () => requestJson('/support/temporary-session', { method: 'POST' }),
      mock.createTemporarySupportSession
    ),
  fetchSupportMessages: (guestSessionId?: string): Promise<SupportMessage[]> =>
    withFallback(
      () => requestJson(`/support/messages?${supportQuery(guestSessionId)}`),
      () => mock.fetchSupportMessages(guestSessionId)
    ),
  sendSupportMessage: (content: string, guestSessionId?: string): Promise<SupportMessage[]> =>
    withFallback(
      () => requestJson(`/support/messages?${supportQuery(guestSessionId)}`, { method: 'POST', body: JSON.stringify({ content }) }),
      () => mock.sendSupportMessage(content, guestSessionId)
    ),
  fetchPosts: (): Promise<PostItem[]> => withFallback(() => requestJson('/posts'), mock.fetchPosts),
  createPost: (content: string, tags: string[]): Promise<PostItem> =>
    withFallback(
      () => requestJson('/posts', { method: 'POST', body: JSON.stringify({ user_id: currentUserId(), content, tags }) }),
      () => mock.createPost(content, tags)
    ),
  loginPhone: (phone: string, code: string, role: 'owner' | 'sitter'): Promise<LoginResponse> =>
    withFallback(
      () => requestJson('/auth/phone', { method: 'POST', body: JSON.stringify({ phone, code, role }) }),
      () => mock.loginPhone(phone, role)
    ),
  loginWechat: (role: 'owner' | 'sitter'): Promise<LoginResponse> =>
    withFallback(
      () => requestJson('/auth/wechat', { method: 'POST', body: JSON.stringify({ scene: 'web_qr', code: 'demo-qr-1', role }) }),
      () => mock.loginWechat(role)
    )
}
