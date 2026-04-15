<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: { latitude: number; longitude: number }
}>()

const emit = defineEmits<{
  'update:modelValue': [{ latitude: number; longitude: number }]
}>()

const mapRef = ref<HTMLElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const amapKey = import.meta.env.VITE_AMAP_KEY

function updatePoint(latitude: number, longitude: number) {
  emit('update:modelValue', { latitude, longitude })
}

async function loadScript() {
  if (!amapKey) {
    failed.value = true
    return
  }

  if (window.AMap) {
    ready.value = true
    return
  }

  const script = document.createElement('script')
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`
  script.async = true
  script.onload = () => {
    ready.value = true
    mountMap()
  }
  script.onerror = () => {
    failed.value = true
  }
  document.head.appendChild(script)
}

function mountMap() {
  if (!window.AMap || !mapRef.value) {
    return
  }

  const map = new window.AMap.Map(mapRef.value, {
    zoom: 13,
    center: [props.modelValue.longitude, props.modelValue.latitude]
  })

  const marker = new window.AMap.Marker({
    position: [props.modelValue.longitude, props.modelValue.latitude]
  })

  map.add(marker)
  map.on('click', (event: any) => {
    const lng = event.lnglat.getLng()
    const lat = event.lnglat.getLat()
    marker.setPosition([lng, lat])
    updatePoint(lat, lng)
  })
}

function onLatitudeChange(value: number | null | undefined) {
  updatePoint(Number(value ?? props.modelValue.latitude), props.modelValue.longitude)
}

function onLongitudeChange(value: number | null | undefined) {
  updatePoint(props.modelValue.latitude, Number(value ?? props.modelValue.longitude))
}

watch(ready, (value) => {
  if (value) {
    mountMap()
  }
})

onMounted(async () => {
  await loadScript()
})
</script>

<template>
  <div class="map-picker">
    <div v-if="!failed" ref="mapRef" class="map-stage"></div>
    <div v-else class="map-fallback">
      <div>
        <strong>高德地图暂未启用</strong>
        <p>在 `frontend/.env` 中填写 `VITE_AMAP_KEY` 后，这里就能支持点击地图自动回填经纬度。</p>
      </div>
    </div>
    <div class="map-coords">
      <el-input-number :model-value="modelValue.latitude" :precision="6" :step="0.0001" @update:model-value="onLatitudeChange" />
      <el-input-number :model-value="modelValue.longitude" :precision="6" :step="0.0001" @update:model-value="onLongitudeChange" />
    </div>
  </div>
</template>
