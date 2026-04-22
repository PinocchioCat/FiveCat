import { ref } from 'vue'

export type AuthDialogRole = 'owner' | 'sitter'

export const authDialogVisible = ref(false)
export const authDialogRole = ref<AuthDialogRole>('owner')
export const authDialogRedirect = ref('/')

export function openAuthDialog(options?: { role?: AuthDialogRole; redirect?: string }) {
  authDialogRole.value = options?.role ?? 'owner'
  authDialogRedirect.value = options?.redirect ?? '/'
  authDialogVisible.value = true
}

export function closeAuthDialog() {
  authDialogVisible.value = false
}
