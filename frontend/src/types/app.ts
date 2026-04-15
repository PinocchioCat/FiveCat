export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface UserProfile {
  id: number
  username: string
  nickname: string
  role: 'owner' | 'sitter'
  avatar: string
  bio: string
  phone?: string | null
  gender: 'male' | 'female' | 'other'
  registered_at: string
  is_verified: boolean
  tags: string[]
  rating: number
  completed_orders: number
  location: GeoPoint
}

export interface PetItem {
  id: number
  user_id: number
  name: string
  type: string
  species: string
  gender: 'male' | 'female' | 'unknown'
  breed: string
  age: number
  specialty: string
  photos: string[]
}

export interface OrderReview {
  rating: number
  content: string
  reviewer_name: string
  created_at: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending'
  | 'pending_service'
  | 'in_service'
  | 'pending_confirmation'
  | 'completed'
  | 'appealing'
  | 'refunding'
  | 'cancelled'

export type VaccinationStatus = '已齐全' | '未齐全'
export type OrderCancelActor = 'owner' | 'sitter' | 'system'

export interface OrderPricing {
  base_price: number
  pet_count_surcharge: number
  distance_surcharge: number
  service_surcharge: number
  holiday_surcharge: number
  total_price: number
}

export interface OrderItem {
  id: number
  owner_id: number
  sitter_id?: number | null
  status: OrderStatus
  service_type: string
  title: string
  description: string
  price: number
  service_time: string
  service_start_time: string
  service_end_time: string
  duration_minutes: number
  pet_count: number
  pet_species: string
  pet_species_other?: string | null
  pet_ids: number[]
  detailed_address: string
  key_handover_method: string
  pet_temperament: string
  vaccination_status: VaccinationStatus
  vaccination_notes?: string | null
  distance_km: number
  created_at: string
  payment_deadline_at?: string | null
  payment_paid_at?: string | null
  accepted_at?: string | null
  contacts_unlocked_at?: string | null
  service_started_at?: string | null
  service_completed_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancelled_by?: OrderCancelActor | null
  cancel_reason?: string | null
  owner_cancel_penalty?: number
  pricing?: OrderPricing | null
  location: GeoPoint
  review?: OrderReview | null
}

export interface CreateOrderPayload {
  owner_id: number
  service_type: string
  title: string
  description: string
  service_start_time: string
  service_end_time: string
  duration_minutes: number
  pet_count: number
  pet_species: string
  pet_species_other?: string | null
  pet_ids: number[]
  detailed_address: string
  key_handover_method: string
  pet_temperament: string
  vaccination_status: VaccinationStatus
  vaccination_notes?: string | null
  location: GeoPoint
}

export interface SupportMessage {
  id: number
  user_id: number
  sender: 'user' | 'support'
  content: string
  created_at: string
}

export interface SupportConversation {
  session_id: string
  is_temporary: boolean
  messages: SupportMessage[]
}

export interface PostAuthor {
  id: number
  username: string
  avatar: string
  role: string
}

export interface PostItem {
  id: number
  user_id: number
  content: string
  media_urls: string[]
  like_count: number
  tags: string[]
  created_at: string
  author: PostAuthor
}

export interface HomeOverview {
  user: UserProfile
  stats: {
    active_sitters: number
    pending_orders: number
    community_posts: number
    completed_orders: number
  }
  nearby_orders: OrderItem[]
  posts: PostItem[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: UserProfile
}
