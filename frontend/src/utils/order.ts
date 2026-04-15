import type { OrderItem, OrderPricing, OrderStatus, VaccinationStatus } from '../types/app'

const HALF_HOUR_MINUTES = new Set([0, 30])
const SPRING_FESTIVAL_WINDOWS: Record<number, [Date, Date]> = {
  2025: [new Date(2025, 0, 28, 0, 0, 0), new Date(2025, 1, 4, 23, 59, 59)],
  2026: [new Date(2026, 1, 17, 0, 0, 0), new Date(2026, 1, 24, 23, 59, 59)],
  2027: [new Date(2027, 1, 6, 0, 0, 0), new Date(2027, 1, 13, 23, 59, 59)]
}

export const ORDER_SERVICE_OPTIONS = ['喂猫', '投喂并陪玩', '下楼溜猫']
export const ORDER_VACCINATION_OPTIONS: VaccinationStatus[] = ['已齐全', '未齐全']

export function statusLabel(status: OrderStatus) {
  if (status === 'pending_payment') return '待支付'
  if (status === 'pending') return '待接单'
  if (status === 'pending_service') return '待服务'
  if (status === 'in_service') return '服务中'
  if (status === 'pending_confirmation') return '待确认'
  if (status === 'completed') return '已完成'
  if (status === 'appealing') return '申诉中'
  if (status === 'refunding') return '退款中'
  return '已取消'
}

export function statusTagType(status: OrderStatus): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'completed') return 'success'
  if (status === 'pending_payment' || status === 'pending_confirmation') return 'warning'
  if (status === 'appealing' || status === 'refunding' || status === 'cancelled') return 'danger'
  if (status === 'pending_service' || status === 'in_service') return 'info'
  return ''
}

export function speciesLabel(order: Pick<OrderItem, 'pet_species' | 'pet_species_other'>) {
  return order.pet_species === '其他' && order.pet_species_other ? order.pet_species_other : order.pet_species
}

export function formatDateTime(value?: string | null) {
  if (!value) return '未设置'
  return new Date(value).toLocaleString('zh-CN')
}

export function formatCountDown(deadlineAt?: string | null, now = Date.now()) {
  if (!deadlineAt) return '已结束'
  const remaining = new Date(deadlineAt).getTime() - now
  if (remaining <= 0) return '已超时'
  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatDateTimeValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

export function parseDateTimeValue(value: string) {
  return new Date(value)
}

export function nextHalfHour(date = new Date()) {
  const next = new Date(date)
  next.setSeconds(0, 0)
  const minutes = next.getMinutes()
  if (minutes === 0 || minutes === 30) {
    next.setMinutes(minutes + 30)
    return next
  }
  if (minutes < 30) {
    next.setMinutes(30)
    return next
  }
  next.setHours(next.getHours() + 1, 0, 0, 0)
  return next
}

export function addMinutes(value: string | Date, minutes: number) {
  const date = value instanceof Date ? new Date(value) : parseDateTimeValue(value)
  date.setMinutes(date.getMinutes() + minutes)
  return date
}

export function normalizeHalfHourDateTime(value: string) {
  const date = parseDateTimeValue(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  date.setSeconds(0, 0)
  const minutes = date.getMinutes()
  if (minutes === 0 || minutes === 30) {
    return formatDateTimeValue(date)
  }
  if (minutes < 30) {
    date.setMinutes(30)
    return formatDateTimeValue(date)
  }
  date.setHours(date.getHours() + 1, 0, 0, 0)
  return formatDateTimeValue(date)
}

export function isValidHalfHourDateTime(value: string) {
  const date = parseDateTimeValue(value)
  return !Number.isNaN(date.getTime()) && HALF_HOUR_MINUTES.has(date.getMinutes()) && date.getSeconds() === 0
}

export function validateServiceWindow(startValue: string, endValue: string, now = new Date()) {
  const start = parseDateTimeValue(startValue)
  const end = parseDateTimeValue(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '请选择完整的服务起止时间'
  }
  if (!isValidHalfHourDateTime(startValue) || !isValidHalfHourDateTime(endValue)) {
    return '服务时间只能选择整点或半点'
  }
  if (start.getTime() <= now.getTime()) {
    return '开始时间必须晚于当前时间'
  }
  if (end.getTime() <= start.getTime()) {
    return '结束时间必须晚于开始时间'
  }
  return ''
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isSpringFestival(value: Date) {
  const window = SPRING_FESTIVAL_WINDOWS[value.getFullYear()]
  if (!window) return false
  const [start, end] = window
  return value >= start && value <= end
}

export function calculateOrderPricing(input: {
  serviceType: string
  petCount: number
  distanceKm: number
  serviceStartTime: string
}): OrderPricing {
  const petCountSurcharge = input.petCount <= 1 ? 0 : Math.ceil((input.petCount - 1) / 2) * 5
  const distanceSurcharge = input.distanceKm > 3 ? Math.ceil(input.distanceKm - 3) * 5 : 0
  const serviceSurcharge = ['投喂并陪玩', '下楼溜猫'].includes(input.serviceType) ? 10 : 0
  const holidaySurcharge = isSpringFestival(parseDateTimeValue(input.serviceStartTime)) ? 10 : 0
  const basePrice = 40
  const totalPrice = basePrice + petCountSurcharge + distanceSurcharge + serviceSurcharge + holidaySurcharge
  return {
    base_price: basePrice,
    pet_count_surcharge: petCountSurcharge,
    distance_surcharge: distanceSurcharge,
    service_surcharge: serviceSurcharge,
    holiday_surcharge: holidaySurcharge,
    total_price: totalPrice
  }
}
