import type {
  CreateOrderPayload,
  HomeOverview,
  LoginResponse,
  OrderItem,
  PetItem,
  PostItem,
  SupportConversation,
  SupportMessage,
  UserProfile
} from '../types/app'
import { SUPPORT_DEFAULT_MESSAGE } from '../constants/support'
import { calculateOrderPricing, haversineDistanceKm } from '../utils/order'

const userTemplates: UserProfile[] = [
  {
    id: 1,
    username: '林小满',
    nickname: '小满',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
    bio: '两只猫一只狗的快乐宠主，喜欢记录毛孩子的日常。',
    phone: '13800000001',
    gender: 'female',
    registered_at: '2025-08-16T10:20:00',
    is_verified: true,
    tags: ['资深宠主'],
    rating: 4.9,
    completed_orders: 16,
    location: { latitude: 31.2304, longitude: 121.4737 }
  },
  {
    id: 2,
    username: '周阿梨',
    nickname: '阿梨',
    role: 'sitter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    bio: '下班后接单的兼职铲屎官，擅长上门喂养和陪玩。',
    phone: '13800000002',
    gender: 'female',
    registered_at: '2025-05-20T09:00:00',
    is_verified: true,
    tags: ['兼职铲屎官'],
    rating: 4.8,
    completed_orders: 52,
    location: { latitude: 31.2242, longitude: 121.4691 }
  }
]

const allPets: PetItem[] = [
  {
    id: 1,
    user_id: 1,
    name: '团团',
    type: 'cat',
    species: '外国猫',
    gender: 'male',
    breed: '英短蓝猫',
    age: 2,
    specialty: '会在饭点准时蹲点，熟悉自动喂食器。',
    photos: ['https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 2,
    user_id: 1,
    name: '奶油',
    type: 'dog',
    species: '小型犬',
    gender: 'female',
    breed: '柯基',
    age: 3,
    specialty: '擅长捡球，熟悉基础坐下与等待指令。',
    photos: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 11,
    user_id: 2,
    name: '元宝',
    type: 'cat',
    species: '中华田园猫',
    gender: 'male',
    breed: '狸花猫',
    age: 1,
    specialty: '亲人不怕生，擅长陪玩逗猫棒和定点如厕。',
    photos: ['https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 12,
    user_id: 2,
    name: '可乐',
    type: 'dog',
    species: '小型犬',
    gender: 'female',
    breed: '比熊',
    age: 4,
    specialty: '熟悉牵引外出流程，对洗护和吹毛非常配合。',
    photos: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80']
  }
]

function seedOrders(): OrderItem[] {
  const createdBase = new Date('2026-04-10T10:00:00')
  return [
    {
      id: 1001,
      owner_id: 1,
      sitter_id: null,
      status: 'pending_payment',
      service_type: '喂猫',
      title: '今晚帮我上门喂猫并换水',
      description: '两只猫，需要加粮、换水，并简单清理猫砂。',
      price: 45,
      service_time: '2026-04-10T19:30:00',
      service_start_time: '2026-04-10T19:30:00',
      service_end_time: '2026-04-10T20:30:00',
      duration_minutes: 30,
      pet_count: 2,
      pet_species: '外国猫',
      pet_species_other: null,
      pet_ids: [1],
      detailed_address: '静安区幸福里 8 号楼 1202，请详细描述位置小区楼栋以及门牌号。',
      key_handover_method: '待铲屎官接单后一对一联系对接',
      pet_temperament: '亲人，听到罐头声会主动靠近。',
      vaccination_status: '已齐全',
      vaccination_notes: null,
      distance_km: 1.2,
      created_at: new Date(createdBase.getTime() - 18 * 60 * 1000).toISOString(),
      payment_deadline_at: new Date(createdBase.getTime() + 2 * 60 * 1000).toISOString(),
      payment_paid_at: null,
      accepted_at: null,
      contacts_unlocked_at: null,
      service_started_at: null,
      service_completed_at: null,
      completed_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      owner_cancel_penalty: 0,
      pricing: {
        base_price: 40,
        pet_count_surcharge: 5,
        distance_surcharge: 0,
        service_surcharge: 0,
        holiday_surcharge: 0,
        total_price: 45
      },
      location: { latitude: 31.2298, longitude: 121.4761 },
      review: null
    },
    {
      id: 1002,
      owner_id: 1,
      sitter_id: 2,
      status: 'pending_confirmation',
      service_type: '投喂并陪玩',
      title: '下午上门投喂并陪玩',
      description: '希望喂完主食后陪玩 30 分钟，并反馈猫咪状态。',
      price: 50,
      service_time: '2026-04-10T13:00:00',
      service_start_time: '2026-04-10T13:00:00',
      service_end_time: '2026-04-10T14:00:00',
      duration_minutes: 30,
      pet_count: 1,
      pet_species: '外国猫',
      pet_species_other: null,
      pet_ids: [1],
      detailed_address: '徐汇区云锦路花园 2 栋 902，门禁到楼下后电话联系。',
      key_handover_method: '待铲屎官接单后一对一联系对接',
      pet_temperament: '慢热，先轻声打招呼再靠近，喜欢逗猫棒。',
      vaccination_status: '未齐全',
      vaccination_notes: '加强针还没补，近期不安排外出。',
      distance_km: 2.8,
      created_at: '2026-04-10T08:00:00',
      payment_deadline_at: '2026-04-10T08:20:00',
      payment_paid_at: '2026-04-10T08:05:00',
      accepted_at: '2026-04-10T08:20:00',
      contacts_unlocked_at: '2026-04-10T08:20:00',
      service_started_at: '2026-04-10T13:00:00',
      service_completed_at: '2026-04-10T13:35:00',
      completed_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      owner_cancel_penalty: 0,
      pricing: {
        base_price: 40,
        pet_count_surcharge: 0,
        distance_surcharge: 0,
        service_surcharge: 10,
        holiday_surcharge: 0,
        total_price: 50
      },
      location: { latitude: 31.2211, longitude: 121.4823 },
      review: null
    },
    {
      id: 1003,
      owner_id: 1,
      sitter_id: 2,
      status: 'completed',
      service_type: '喂猫',
      title: '节后上门照看两只猫',
      description: '已经完成一次上门喂养和猫砂清理，宠主反馈很好。',
      price: 45,
      service_time: '2026-04-06T19:30:00',
      service_start_time: '2026-04-06T19:30:00',
      service_end_time: '2026-04-06T20:30:00',
      duration_minutes: 60,
      pet_count: 2,
      pet_species: '外国猫',
      pet_species_other: null,
      pet_ids: [1],
      detailed_address: '浦东新区海岸城 6 号楼 1801，电梯出门右转第一户。',
      key_handover_method: '待铲屎官接单后一对一联系对接',
      pet_temperament: '熟悉上门喂养流程，添粮换水即可，不用强行互动。',
      vaccination_status: '已齐全',
      vaccination_notes: null,
      distance_km: 1.6,
      created_at: '2026-04-06T16:10:00',
      payment_deadline_at: '2026-04-06T16:30:00',
      payment_paid_at: '2026-04-06T16:18:00',
      accepted_at: '2026-04-06T16:30:00',
      contacts_unlocked_at: '2026-04-06T16:30:00',
      service_started_at: '2026-04-06T19:30:00',
      service_completed_at: '2026-04-06T20:20:00',
      completed_at: '2026-04-06T20:40:00',
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      owner_cancel_penalty: 0,
      pricing: {
        base_price: 40,
        pet_count_surcharge: 5,
        distance_surcharge: 0,
        service_surcharge: 0,
        holiday_surcharge: 0,
        total_price: 45
      },
      location: { latitude: 31.2285, longitude: 121.4712 },
      review: {
        rating: 5,
        content: '拍照反馈很及时，家里也收拾得很干净，下次还会继续约。',
        reviewer_name: '林小满',
        created_at: '2026-04-06T20:40:00'
      }
    }
  ]
}

let activeUser: UserProfile | null = null
let orders: OrderItem[] = seedOrders()

let supportMessages: SupportMessage[] = [
  {
    id: 1,
    user_id: 2,
    sender: 'support',
    content: SUPPORT_DEFAULT_MESSAGE,
    created_at: '2026-04-02T09:00:00'
  },
  {
    id: 2,
    user_id: 2,
    sender: 'user',
    content: '想确认一下兼职铲屎官接单后，服务完成多久会更新到我的口碑里？',
    created_at: '2026-04-02T09:02:00'
  },
  {
    id: 3,
    user_id: 2,
    sender: 'support',
    content: '您好！订单完成且宠主提交评价后，会在 24 小时内同步到你的服务记录和评分。',
    created_at: '2026-04-02T09:05:00'
  }
]

let temporarySupportSessions: Record<string, SupportMessage[]> = {}

let posts: PostItem[] = [
  {
    id: 501,
    user_id: 1,
    content: '今天团团第一次主动趴腿上，感觉正式被它录用成人类了。',
    media_urls: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=900&q=80'],
    like_count: 128,
    tags: ['晒宠', '英短', '治愈日常'],
    created_at: '2026-04-02T07:00:00',
    author: {
      id: 1,
      username: '林小满',
      avatar: userTemplates[0].avatar,
      role: 'owner'
    }
  },
  {
    id: 502,
    user_id: 2,
    content: '晚上接了两单上门喂养，猫咪比人类更有边界感，但零食能解决大部分问题。',
    media_urls: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80'],
    like_count: 76,
    tags: ['接单日记', '兼职铲屎官'],
    created_at: '2026-04-02T05:00:00',
    author: {
      id: 2,
      username: '周阿梨',
      avatar: userTemplates[1].avatar,
      role: 'sitter'
    }
  }
]

function wait<T>(payload: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(payload)), 180))
}

function createUser(role: 'owner' | 'sitter', overrides: Partial<UserProfile> = {}): UserProfile {
  const template = structuredClone(userTemplates.find((item) => item.role === role) as UserProfile)
  return {
    ...template,
    ...overrides,
    role,
    tags: structuredClone(overrides.tags ?? template.tags),
    location: structuredClone(overrides.location ?? template.location)
  }
}

function getCurrentUser(): UserProfile {
  return activeUser ?? createUser('owner')
}

function getCurrentUserPets() {
  const current = getCurrentUser()
  return allPets.filter((pet) => pet.user_id === current.id)
}

function nextSupportMessageId() {
  const persistedIds = supportMessages.map((item) => item.id)
  const temporaryIds = Object.values(temporarySupportSessions).flat().map((item) => item.id)
  return Math.max(0, ...persistedIds, ...temporaryIds) + 1
}

function createSupportWelcomeMessage(userId: number): SupportMessage {
  return {
    id: nextSupportMessageId(),
    user_id: userId,
    sender: 'support',
    content: SUPPORT_DEFAULT_MESSAGE,
    created_at: new Date().toISOString()
  }
}

function createSupportReply(userId: number, sourceContent: string): SupportMessage {
  return {
    id: nextSupportMessageId(),
    user_id: userId,
    sender: 'support',
    content: `您好！已经收到你的消息：${sourceContent}。如果方便的话，也可以继续告诉我毛孩子的品种、所在区域和期望服务时间，我会继续帮你安排。`,
    created_at: new Date(Date.now() + 60 * 1000).toISOString()
  }
}

function ensureSupportConversation(userId: number) {
  if (supportMessages.some((item) => item.user_id === userId)) {
    return
  }

  supportMessages = [...supportMessages, createSupportWelcomeMessage(userId)]
}

function ensureTemporarySupportSession(sessionId: string) {
  if (!temporarySupportSessions[sessionId]) {
    temporarySupportSessions = {
      ...temporarySupportSessions,
      [sessionId]: [createSupportWelcomeMessage(0)]
    }
  }

  return temporarySupportSessions[sessionId]
}

function findOrder(orderId: number) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }
  return order
}

function saveOrder(orderId: number, updater: (item: OrderItem) => OrderItem) {
  orders = orders.map((item) => (item.id === orderId ? updater(item) : item))
  return orders.find((item) => item.id === orderId) as OrderItem
}

function expireUnpaidOrders() {
  const now = Date.now()
  orders = orders.map((item) => {
    if (item.status !== 'pending_payment' || !item.payment_deadline_at) return item
    if (new Date(item.payment_deadline_at).getTime() > now) return item
    return {
      ...item,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'system',
      cancel_reason: '支付超时自动取消'
    }
  })
}

export async function loginPhone(phone: string, role: 'owner' | 'sitter' = 'owner'): Promise<LoginResponse> {
  const user = createUser(role, { phone })
  activeUser = user
  return wait({ access_token: `phone-token-${role}`, token_type: 'bearer', user })
}

export async function loginWechat(role: 'owner' | 'sitter' = 'owner'): Promise<LoginResponse> {
  const user = createUser(role)
  activeUser = user
  return wait({ access_token: `wechat-token-${role}`, token_type: 'bearer', user })
}

export async function fetchMe(): Promise<UserProfile> {
  if (!activeUser) {
    return Promise.reject(new Error('Unauthenticated')) as Promise<UserProfile>
  }
  return wait(activeUser)
}

export async function switchRole(role: 'owner' | 'sitter'): Promise<UserProfile> {
  activeUser = createUser(
    role,
    activeUser ? { username: activeUser.username, nickname: activeUser.nickname, phone: activeUser.phone ?? undefined } : {}
  )
  return wait(activeUser)
}

export async function fetchPets(): Promise<PetItem[]> {
  return wait(getCurrentUserPets())
}

export async function fetchOrders(): Promise<OrderItem[]> {
  expireUnpaidOrders()
  return wait(orders)
}

export async function fetchNearbyOrders(): Promise<OrderItem[]> {
  expireUnpaidOrders()
  return wait(orders.filter((item) => item.status === 'pending'))
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderItem> {
  const current = getCurrentUser()
  const distanceKm = haversineDistanceKm(current.location.latitude, current.location.longitude, payload.location.latitude, payload.location.longitude)
  const pricing = calculateOrderPricing({
    serviceType: payload.service_type,
    petCount: payload.pet_count,
    distanceKm,
    serviceStartTime: payload.service_start_time
  })
  const createdAt = new Date()
  const order: OrderItem = {
    id: Date.now(),
    owner_id: payload.owner_id,
    sitter_id: null,
    status: 'pending_payment',
    service_type: payload.service_type,
    title: payload.title,
    description: payload.description,
    price: pricing.total_price,
    service_time: payload.service_start_time,
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
    distance_km: Number(distanceKm.toFixed(1)),
    created_at: createdAt.toISOString(),
    payment_deadline_at: new Date(createdAt.getTime() + 20 * 60 * 1000).toISOString(),
    payment_paid_at: null,
    accepted_at: null,
    contacts_unlocked_at: null,
    service_started_at: null,
    service_completed_at: null,
    completed_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
    owner_cancel_penalty: 0,
    pricing,
    location: payload.location,
    review: null
  }
  orders = [order, ...orders]
  return wait(order)
}

export async function payOrder(orderId: number): Promise<OrderItem> {
  expireUnpaidOrders()
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'pending',
      payment_paid_at: new Date().toISOString()
    }))
  )
}

export async function acceptOrder(orderId: number): Promise<OrderItem> {
  expireUnpaidOrders()
  const sitterId = getCurrentUser().role === 'sitter' ? getCurrentUser().id : 2
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'pending_service',
      sitter_id: sitterId,
      accepted_at: new Date().toISOString(),
      contacts_unlocked_at: new Date().toISOString()
    }))
  )
}

export async function startOrderService(orderId: number): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'in_service',
      service_started_at: new Date().toISOString()
    }))
  )
}

export async function completeOrderService(orderId: number): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'pending_confirmation',
      service_completed_at: new Date().toISOString()
    }))
  )
}

export async function confirmOrder(orderId: number, content: string, rating = 5): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'completed',
      completed_at: new Date().toISOString(),
      review: {
        rating,
        content,
        reviewer_name: getCurrentUser().nickname,
        created_at: new Date().toISOString()
      }
    }))
  )
}

export async function appealOrder(orderId: number, reason: string): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'appealing',
      cancel_reason: reason
    }))
  )
}

export async function refundOrder(orderId: number, reason: string): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'refunding',
      cancel_reason: reason
    }))
  )
}

export async function cancelOrder(orderId: number, cancelledBy: 'owner' | 'sitter' | 'system', reason?: string): Promise<OrderItem> {
  findOrder(orderId)
  return wait(
    saveOrder(orderId, (item) => ({
      ...item,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancel_reason: reason ?? '订单已取消',
      owner_cancel_penalty: cancelledBy === 'owner' && item.accepted_at ? 5 : item.owner_cancel_penalty ?? 0
    }))
  )
}

export async function createTemporarySupportSession(): Promise<SupportConversation> {
  const sessionId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const messages = ensureTemporarySupportSession(sessionId)
  return wait({
    session_id: sessionId,
    is_temporary: true,
    messages: messages.slice().sort((a, b) => a.created_at.localeCompare(b.created_at))
  })
}

export async function fetchSupportMessages(guestSessionId?: string): Promise<SupportMessage[]> {
  if (guestSessionId) {
    return wait(ensureTemporarySupportSession(guestSessionId).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)))
  }

  if (!activeUser) {
    return Promise.reject(new Error('Unauthenticated')) as Promise<SupportMessage[]>
  }

  const user = activeUser
  ensureSupportConversation(user.id)
  return wait(supportMessages.filter((item) => item.user_id === user.id).sort((a, b) => a.created_at.localeCompare(b.created_at)))
}

export async function sendSupportMessage(content: string, guestSessionId?: string): Promise<SupportMessage[]> {
  if (guestSessionId) {
    const messages = ensureTemporarySupportSession(guestSessionId)
    const guestMessage: SupportMessage = {
      id: nextSupportMessageId(),
      user_id: 0,
      sender: 'user',
      content,
      created_at: new Date().toISOString()
    }
    temporarySupportSessions = {
      ...temporarySupportSessions,
      [guestSessionId]: [...messages, guestMessage, createSupportReply(0, content)]
    }
    return fetchSupportMessages(guestSessionId)
  }

  if (!activeUser) {
    return Promise.reject(new Error('Unauthenticated')) as Promise<SupportMessage[]>
  }

  ensureSupportConversation(activeUser.id)
  const message: SupportMessage = {
    id: nextSupportMessageId(),
    user_id: activeUser.id,
    sender: 'user',
    content,
    created_at: new Date().toISOString()
  }
  supportMessages = [...supportMessages, message, createSupportReply(activeUser.id, content)]
  return fetchSupportMessages()
}

export async function fetchPosts(): Promise<PostItem[]> {
  return wait(posts)
}

export async function createPost(content: string, tags: string[]): Promise<PostItem> {
  const current = getCurrentUser()
  const post: PostItem = {
    id: Date.now(),
    user_id: current.id,
    content,
    media_urls: ['https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80'],
    like_count: 0,
    tags,
    created_at: new Date().toISOString(),
    author: {
      id: current.id,
      username: current.username,
      avatar: current.avatar,
      role: current.role
    }
  }
  posts = [post, ...posts]
  return wait(post)
}

export async function fetchHomeOverview(): Promise<HomeOverview> {
  expireUnpaidOrders()
  const current = getCurrentUser()
  return wait({
    user: current,
    stats: {
      active_sitters: userTemplates.filter((item) => item.role === 'sitter').length,
      pending_orders: orders.filter((item) => item.status === 'pending').length,
      community_posts: posts.length,
      completed_orders: userTemplates.reduce((sum, item) => sum + item.completed_orders, 0)
    },
    nearby_orders: orders.filter((item) => item.status === 'pending'),
    posts
  })
}
