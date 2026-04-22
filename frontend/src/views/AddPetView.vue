<script setup lang="ts">
import { ArrowLeft, Check, StarFilled, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '../api/client'
import { currentRole, currentUser, isAuthenticated, pets, setPets } from '../store/session'
import type { CreatePetPayload } from '../types/app'

interface PhotoSlot {
  id: number
  value: string
}

const router = useRouter()
const saving = ref(false)
const photoSlots = ref<PhotoSlot[]>([
  { id: 1, value: '' }
])
const maxPhotoSizeBytes = 20 * 1024 * 1024

const form = reactive({
  name: '',
  type: 'dog' as CreatePetPayload['type'],
  breed: '',
  gender: 'male' as CreatePetPayload['gender'],
  age: '',
  weight: '',
  specialty: '',
  habits: '',
  emergencyPhone: ''
})

const petTypeLabel = computed(() => {
  if (form.type === 'dog') return '狗狗'
  if (form.type === 'cat') return '猫猫'
  return '其他'
})

function typeToSpecies(type: CreatePetPayload['type']) {
  if (type === 'dog') return '狗狗'
  if (type === 'cat') return '猫猫'
  return '其他'
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function handlePhotoChange(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.warning('请上传 JPG 或 PNG 格式的照片。')
    return
  }

  if (file.size <= 0 || file.size > maxPhotoSizeBytes) {
    ElMessage.warning('单张照片大小需大于 0 且不超过 20MB。')
    return
  }

  photoSlots.value[index].value = await readFileAsDataUrl(file)
}

function removePhoto(index: number) {
  photoSlots.value[index].value = ''
}

function validateForm() {
  if (!form.name.trim()) return '请填写宠物名字。'
  if (!form.breed.trim()) return '请填写宠物品种。'
  if (!form.age || Number(form.age) < 0) return '请填写有效年龄。'
  if (form.weight && Number(form.weight) < 0) return '请填写有效体重。'
  if (!form.specialty.trim()) return '请填写性格特点。'
  if (!form.emergencyPhone.trim()) return '请填写紧急联系电话。'
  if (!/^1\d{10}$/.test(form.emergencyPhone.trim())) return '请输入 11 位手机号作为紧急联系方式。'
  if (!photoSlots.value.some((item) => item.value)) return '请至少上传一张宠物照片。'
  return ''
}

async function savePet() {
  if (!currentUser.value) {
    ElMessage.warning('请先登录宠物主人账号。')
    await router.push('/profile')
    return
  }

  const error = validateForm()
  if (error) {
    ElMessage.warning(error)
    return
  }

  saving.value = true
  try {
    const createdPet = await api.createPet({
      user_id: currentUser.value.id,
      name: form.name.trim(),
      type: form.type,
      species: typeToSpecies(form.type),
      gender: form.gender,
      breed: form.breed.trim(),
      age: Number(form.age),
      weight_kg: form.weight ? Number(form.weight) : null,
      specialty: form.specialty.trim(),
      habits: form.habits.trim() || null,
      emergency_phone: form.emergencyPhone.trim(),
      photos: photoSlots.value.map((item) => item.value).filter(Boolean)
    })
    setPets([...pets.value.filter((item) => item.id !== createdPet.id), createdPet])
    ElMessage.success('毛孩子档案已保存。')
    await router.push('/profile')
  } finally {
    saving.value = false
  }
}

async function backToProfile() {
  await router.push('/profile')
}

onMounted(() => {
  if (!isAuthenticated.value || currentRole.value !== 'owner') {
    ElMessage.info('请使用宠物主人模式添加毛孩子档案。')
    void router.push('/profile')
  }
})
</script>

<template>
  <div id="top" class="add-pet-page">
    <section class="add-pet-heading">
      <button type="button" class="add-pet-back" @click="backToProfile">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回个人中心</span>
      </button>

      <div class="add-pet-title-row">
        <span class="add-pet-title-icon">
          <el-icon><StarFilled /></el-icon>
        </span>
        <div>
          <h1>添加毛孩子档案</h1>
          <p>完善宠物信息，让服务更贴心</p>
        </div>
      </div>
    </section>

    <section class="add-pet-layout">
      <aside class="add-pet-photo-panel">
        <h2>宠物照片</h2>
        <div class="add-pet-photo-list">
          <label v-for="(slot, index) in photoSlots" :key="slot.id" class="add-pet-upload-card" :class="{ filled: slot.value }">
            <input type="file" accept="image/png,image/jpeg" @change="handlePhotoChange(index, $event)" />
            <img v-if="slot.value" :src="slot.value" alt="宠物照片预览" />
            <span v-else class="add-pet-upload-empty">
              <el-icon><Upload /></el-icon>
              <strong>点击上传照片</strong>
              <small>支持 JPG、PNG，0-20MB</small>
            </span>
            <button v-if="slot.value" type="button" class="add-pet-remove-photo" @click.prevent="removePhoto(index)">移除</button>
          </label>
        </div>
        <p>清晰的照片有助于铲屎官更好地识别和照顾您的宠物</p>
      </aside>

      <div class="add-pet-form-stack">
        <section class="add-pet-form-card">
          <h2>基本信息</h2>
          <div class="add-pet-field-grid">
            <label class="add-pet-field">
              <span>宠物名字 *</span>
              <input v-model="form.name" type="text" placeholder="例如：豆豆" />
            </label>

            <label class="add-pet-field">
              <span>宠物类型 *</span>
              <select v-model="form.type">
                <option value="dog">狗狗</option>
                <option value="cat">猫猫</option>
                <option value="other">其他</option>
              </select>
            </label>

            <label class="add-pet-field">
              <span>品种 *</span>
              <input v-model="form.breed" type="text" placeholder="例如：金毛、英短" />
            </label>

            <div class="add-pet-field">
              <span>性别 *</span>
              <div class="add-pet-segment">
                <button type="button" :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">男孩</button>
                <button type="button" :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">女孩</button>
              </div>
            </div>

            <label class="add-pet-field">
              <span>年龄</span>
              <input v-model="form.age" type="number" min="0" max="40" placeholder="例如：2" />
            </label>

            <label class="add-pet-field">
              <span>体重</span>
              <input v-model="form.weight" type="number" min="0" step="0.1" placeholder="例如：12.5" />
            </label>
          </div>
          <p class="add-pet-type-hint">当前宠物类型：{{ petTypeLabel }}</p>
        </section>

        <section class="add-pet-form-card">
          <h2>性格与习惯</h2>
          <label class="add-pet-field add-pet-field-wide">
            <span>性格特点</span>
            <textarea v-model="form.specialty" rows="4" placeholder="例如：性格温顺，喜欢和人玩耍，不咬人"></textarea>
          </label>

          <label class="add-pet-field add-pet-field-wide">
            <span>生活习惯（选填）</span>
            <textarea v-model="form.habits" rows="4" placeholder="例如：每天早晚各遛一次，喜欢吃鸡胸肉，不挑食"></textarea>
          </label>
        </section>

        <section class="add-pet-form-card">
          <h2>紧急联系方式</h2>
          <p>如遇紧急情况，铲屎官可联系此号码</p>
          <label class="add-pet-field add-pet-field-wide">
            <input v-model="form.emergencyPhone" type="tel" maxlength="11" placeholder="请输入手机号码" />
          </label>
        </section>

        <div class="add-pet-actions">
          <button type="button" class="add-pet-save" :disabled="saving" @click="savePet">
            <el-icon><Check /></el-icon>
            <span>{{ saving ? '保存中...' : '保存档案' }}</span>
          </button>
          <button type="button" class="add-pet-cancel" @click="backToProfile">取消</button>
        </div>
      </div>
    </section>
  </div>
</template>
