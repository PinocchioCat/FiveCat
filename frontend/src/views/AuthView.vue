<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthDialog from '../components/AuthDialog.vue'

const route = useRoute()
const router = useRouter()
const visible = ref(true)

const role = computed<'owner' | 'sitter'>(() => (route.query.role === 'sitter' ? 'sitter' : 'owner'))
const redirect = computed(() => (typeof route.query.redirect === 'string' ? route.query.redirect : '/'))

async function closeDialog() {
  visible.value = false
  await router.push('/')
}

async function handleSuccess() {
  visible.value = false
  await router.push(redirect.value)
}
</script>

<template>
  <AuthDialog
    v-if="visible"
    :role="role"
    @close="closeDialog"
    @success="handleSuccess"
  />
</template>
