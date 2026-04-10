import { computed, ref } from 'vue'

import type { PetItem, UserProfile } from '../types/app'

const STORAGE_KEY = 'petneighbor.session'

interface StoredSession {
  currentUser: UserProfile | null
  pets: PetItem[]
  authToken: string
}

export const currentUser = ref<UserProfile | null>(null)
export const pets = ref<PetItem[]>([])
export const authToken = ref('')
export const currentRole = computed(() => currentUser.value?.role ?? 'owner')
export const isAuthenticated = computed(() => Boolean(currentUser.value && authToken.value))

function persistSession() {
  if (typeof window === 'undefined') return

  if (!currentUser.value && !authToken.value && pets.value.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  const snapshot: StoredSession = {
    currentUser: currentUser.value,
    pets: pets.value,
    authToken: authToken.value
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function restoreSession() {
  if (typeof window === 'undefined') return

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  try {
    const snapshot = JSON.parse(raw) as StoredSession
    currentUser.value = snapshot.currentUser ?? null
    pets.value = snapshot.pets ?? []
    authToken.value = snapshot.authToken ?? ''
  } catch (error) {
    console.warn('Failed to restore PetNeighbor session.', error)
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function setCurrentUser(user: UserProfile | null) {
  currentUser.value = user
  persistSession()
}

export function setPets(items: PetItem[]) {
  pets.value = items
  persistSession()
}

export function setAuthToken(token: string) {
  authToken.value = token
  persistSession()
}

export function clearSession() {
  currentUser.value = null
  pets.value = []
  authToken.value = ''
  persistSession()
}

restoreSession()