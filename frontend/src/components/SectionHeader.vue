<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="section-header">
    <span class="section-eyebrow">{{ eyebrow }}</span>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>
