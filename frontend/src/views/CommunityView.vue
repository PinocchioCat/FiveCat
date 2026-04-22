<script setup lang="ts">
import {
  Close,
  Delete,
  Picture,
  Position,
  Plus,
  Promotion,
  TrendCharts
} from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { api } from '../api/client'
import { openAuthDialog } from '../store/auth-dialog'
import { currentUser, isAuthenticated } from '../store/session'
import type { PostItem } from '../types/app'

type CommunityFilter = 'all' | 'cat' | 'dog' | 'feeding' | 'medical' | 'training' | 'boarding'

interface TopicItem {
  title: string
  heat: string
}

interface FollowItem {
  id: number
  name: string
  subtitle: string
  avatar: string
}

interface UploadDraft {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
}

const MAX_UPLOAD_COUNT = 10
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'cat', label: '养猫' },
  { key: 'dog', label: '养狗' },
  { key: 'feeding', label: '喂养' },
  { key: 'medical', label: '医疗' },
  { key: 'training', label: '训练' },
  { key: 'boarding', label: '寄养经验' }
] as const

const hiddenDirtyPostContents = new Set(['测试数据', '上课打瞌睡'])

const posts = ref<PostItem[]>([])
const publishing = ref(false)
const content = ref('')
const activeFilter = ref<CommunityFilter>('all')
const selectedTags = ref<string[]>([])
const customTagInput = ref('')
const selectedImages = ref<UploadDraft[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const topicPopoverVisible = ref(false)
const roleDialogVisible = ref(false)

const filterLabelMap: Record<Exclude<CommunityFilter, 'all'>, string> = {
  cat: '养猫',
  dog: '养狗',
  feeding: '喂养',
  medical: '医疗',
  training: '训练',
  boarding: '寄养经验'
}

const filterKeywordMap: Record<Exclude<CommunityFilter, 'all'>, string[]> = {
  cat: ['猫', '养猫'],
  dog: ['狗', '养狗'],
  feeding: ['喂养', '喂食', '主粮', '冻干', '猫粮', '狗粮'],
  medical: ['医疗', '体检', '疫苗', '驱虫', '绝育'],
  training: ['训练', '口令', '坐下', '等待', '纠正'],
  boarding: ['寄养', '托管', '适应', '留宿']
}

const localFallbackPosts: Record<Exclude<CommunityFilter, 'all'>, PostItem[]> = {
  cat: [
    {
      id: 9101,
      user_id: 9101,
      content: '家里新来的小猫前两天一直躲柜子，后来我把猫窝、饮水和猫砂都放在它能看见的位置，第三天就敢主动出来巡视地盘了。养猫最先要给它安全感。',
      media_urls: ['https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80'],
      like_count: 86,
      tags: ['养猫'],
      created_at: '2026-04-10T09:20:00',
      author: {
        id: 9101,
        username: '社区演示号',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    }
  ],
  dog: [
    {
      id: 9201,
      user_id: 9201,
      content: '周末带狗子出门前先做了十分钟嗅闻垫和基础服从，出去之后明显不再一路狂冲。养狗很多时候不是“累够了”就行，而是要先把兴奋值慢慢降下来。',
      media_urls: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80'],
      like_count: 112,
      tags: ['养狗'],
      created_at: '2026-04-11T08:40:00',
      author: {
        id: 9201,
        username: '狗狗日常实验室',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    },
    {
      id: 9202,
      user_id: 9202,
      content: '最近把狗饭分成早晚两顿，再加上固定的饮水提醒，肠胃状态稳定了很多。对于精力旺盛的小型犬来说，节奏化的照顾真的比“想到什么做什么”靠谱。',
      media_urls: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80'],
      like_count: 79,
      tags: ['养狗', '喂养'],
      created_at: '2026-04-09T19:15:00',
      author: {
        id: 9202,
        username: '犬系生活录',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    }
  ],
  feeding: [
    {
      id: 9301,
      user_id: 9301,
      content: '我现在会把主粮、冻干和零食分开管理，尤其是零食只留在训练或外出奖励时用。喂养不是越多越好，而是让毛孩子知道每一口食物的节奏和边界。',
      media_urls: ['https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80'],
      like_count: 67,
      tags: ['喂养'],
      created_at: '2026-04-08T17:10:00',
      author: {
        id: 9301,
        username: '科学喂养笔记',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    }
  ],
  medical: [
    {
      id: 9401,
      user_id: 9401,
      content: '给猫做体检前我会先记下最近一周的食欲、饮水、排便和精神状态，问诊时医生特别容易快速判断重点。医疗问题别只凭感觉，带着记录去会省很多时间。',
      media_urls: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80'],
      like_count: 95,
      tags: ['医疗'],
      created_at: '2026-04-07T13:50:00',
      author: {
        id: 9401,
        username: '毛孩子健康档案',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
        role: 'sitter'
      }
    }
  ],
  training: [
    {
      id: 9501,
      user_id: 9501,
      content: '“坐下-等待-再出门”这套动作我练了两周，最大的收获不是口令执行得多标准，而是狗子出门前的情绪稳定了很多。训练本质上是在建立沟通规则。',
      media_urls: ['https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80'],
      like_count: 121,
      tags: ['训练'],
      created_at: '2026-04-06T20:00:00',
      author: {
        id: 9501,
        username: '训练复盘手记',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    },
    {
      id: 9502,
      user_id: 9502,
      content: '小狗护食不是一下子“纠正”好的，我是从远距离经过不打扰、再到靠近放下更高价值奖励，一步步建立信任。训练一定别只看结果，要看过程是否安全。',
      media_urls: [],
      like_count: 58,
      tags: ['训练'],
      created_at: '2026-04-05T11:30:00',
      author: {
        id: 9502,
        username: '宠物行为观察员',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
        role: 'sitter'
      }
    }
  ],
  boarding: [
    {
      id: 9601,
      user_id: 9601,
      content: '第一次送寄养前，我提前三次把毛孩子带去短暂停留，并把熟悉的窝垫、玩具和日常作息卡一起交给照护人。寄养经验里最重要的是“提前适应”，不是临时托付。',
      media_urls: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80'],
      like_count: 88,
      tags: ['寄养经验'],
      created_at: '2026-04-04T16:45:00',
      author: {
        id: 9601,
        username: '安心寄养备忘录',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
        role: 'owner'
      }
    }
  ]
}

const hotTopics: TopicItem[] = [
  { title: '#新手养宠避坑指南', heat: '12.5w 参与' },
  { title: '#同城寻宠互助', heat: '8.3w 参与' },
  { title: '#周末带狗去哪玩', heat: '5.6w 参与' },
  { title: '#奇葩宠物睡姿大赏', heat: '3.2w 参与' },
  { title: '#绝育注意事项', heat: '1.8w 参与' }
]

const recommendedUsers: FollowItem[] = [
  {
    id: 701,
    name: '兽医老张',
    subtitle: '10年宠物临床经验',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 702,
    name: '金毛多多妈',
    subtitle: '分享每日多多的生活',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 703,
    name: '同城流浪猫救助',
    subtitle: '领养代替购买',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 704,
    name: '训犬阿南',
    subtitle: '专注基础行为训练',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 705,
    name: '猫咪营养研究所',
    subtitle: '记录科学喂养日常',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80'
  }
]

const filteredPosts = computed(() => {
  if (activeFilter.value === 'all') return posts.value

  const tagLabel = filterLabelMap[activeFilter.value]
  const keywords = filterKeywordMap[activeFilter.value]

  return posts.value.filter((post) => {
    const postTags = post.tags.map((item) => item.toLowerCase())
    const haystack = `${post.content} ${post.tags.join(' ')}`.toLowerCase()

    return postTags.includes(tagLabel.toLowerCase()) || keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
  })
})

const activeFilterLabel = computed(() => filterOptions.find((item) => item.key === activeFilter.value)?.label ?? '当前分类')
const fallbackPosts = computed(() => {
  if (activeFilter.value === 'all' || filteredPosts.value.length > 0) return []
  return localFallbackPosts[activeFilter.value] ?? []
})
const displayedPosts = computed(() => (filteredPosts.value.length > 0 ? filteredPosts.value : fallbackPosts.value))
const hasDisplayedPosts = computed(() => displayedPosts.value.length > 0)
const leftColumnPosts = computed(() => displayedPosts.value.filter((_, index) => index % 2 === 0))
const rightColumnPosts = computed(() => displayedPosts.value.filter((_, index) => index % 2 === 1))

function normalizeTag(tag: string) {
  return tag.replace(/^#+/, '').trim()
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${size} B`
}

function formatPostTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function postPrimaryTag(post: PostItem) {
  return post.tags[0] || '社区动态'
}

function postTitle(post: PostItem) {
  const plain = post.content.trim()
  if (plain.length <= 26) return plain
  return `${plain.slice(0, 26)}...`
}

function postExcerpt(post: PostItem) {
  const plain = post.content.trim()
  if (plain.length <= 26) return ''
  return plain
}

function postComments(post: PostItem) {
  return Math.max(3, Math.round(post.like_count * 0.28) + post.tags.length * 2)
}

function canDeletePost(post: PostItem) {
  return currentUser.value?.id === post.user_id
}

function galleryImages(post: PostItem) {
  return post.media_urls.slice(0, 4)
}

function galleryOverflowCount(post: PostItem) {
  return Math.max(0, post.media_urls.length - 4)
}

function isHiddenDirtyPost(post: PostItem) {
  return hiddenDirtyPostContents.has(post.content.trim())
}

function resetComposer() {
  content.value = ''
  selectedTags.value = []
  customTagInput.value = ''
  selectedImages.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function toggleTag(tag: string) {
  const normalized = normalizeTag(tag)
  const exists = selectedTags.value.includes(normalized)

  if (exists) {
    selectedTags.value = selectedTags.value.filter((item) => item !== normalized)
    return
  }

  if (selectedTags.value.length >= 10) {
    ElMessage.warning('话题标签最多选择 10 个。')
    return
  }

  selectedTags.value = [...selectedTags.value, normalized]
}

function addCustomTag() {
  const normalized = normalizeTag(customTagInput.value)
  if (!normalized) {
    ElMessage.warning('请输入自定义标签。')
    return
  }
  if (selectedTags.value.includes(normalized)) {
    ElMessage.info('这个标签已经添加过了。')
    customTagInput.value = ''
    return
  }
  if (selectedTags.value.length >= 10) {
    ElMessage.warning('话题标签最多选择 10 个。')
    return
  }

  selectedTags.value = [...selectedTags.value, normalized]
  customTagInput.value = ''
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((item) => item !== tag)
}

function confirmTopicSelection() {
  topicPopoverVisible.value = false
}

function triggerImagePicker() {
  fileInputRef.value?.click()
}

function showLocationPlaceholder() {
  ElMessage.info('添加位置功能坑位已保留，后续可继续接入。')
}

function chooseRole(role: 'owner' | 'sitter') {
  roleDialogVisible.value = false
  openAuthDialog({
    role,
    redirect: '/community'
  })
}

function isAcceptedImage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return file.type.startsWith('image/') || ALLOWED_EXTENSIONS.includes(extension)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (selectedImages.value.length >= MAX_UPLOAD_COUNT) {
    ElMessage.warning(`最多只能上传 ${MAX_UPLOAD_COUNT} 张图片。`)
    input.value = ''
    return
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
    ElMessage.warning('图片大小需大于 0 且不超过 50MB。')
    input.value = ''
    return
  }

  if (!isAcceptedImage(file)) {
    ElMessage.warning('仅支持 jpg、png、gif、webp、bmp 等常见图片格式。')
    input.value = ''
    return
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    selectedImages.value = [
      ...selectedImages.value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl
      }
    ]
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '图片读取失败，请重试。')
  } finally {
    input.value = ''
  }
}

function removeSelectedImage(id: string) {
  selectedImages.value = selectedImages.value.filter((item) => item.id !== id)
}

async function loadPosts() {
  posts.value = (await api.fetchPosts()).filter((post) => !isHiddenDirtyPost(post))
}

async function publishPost() {
  const plainText = content.value.trim()

  if (!plainText) {
    ElMessage.warning('先写一点动态内容再发布吧。')
    return
  }

  if (!isAuthenticated.value || !currentUser.value) {
    ElMessage.warning('请先登录后再发布内容。')
    roleDialogVisible.value = true
    return
  }

  if (selectedTags.value.length === 0) {
    ElMessage.warning('请至少选择或添加一个话题标签。')
    return
  }

  publishing.value = true

  try {
    const created = await api.createPost({
      user_id: currentUser.value.id,
      content: plainText,
      media_urls: selectedImages.value.map((item) => item.dataUrl),
      tags: Array.from(new Set(selectedTags.value.map((item) => normalizeTag(item)).filter(Boolean)))
    })

    posts.value = [created, ...posts.value]
    resetComposer()
    ElMessage.success('动态已发布。')
  } finally {
    publishing.value = false
  }
}

async function removePost(post: PostItem) {
  if (!canDeletePost(post)) {
    ElMessage.warning('只能删除当前登录账号自己发布的动态。')
    return
  }

  try {
    await ElMessageBox.confirm('删除后这条动态将不再展示，确定继续吗？', '删除动态', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  await api.deletePost(post.id)
  posts.value = posts.value.filter((item) => item.id !== post.id)
  ElMessage.success('动态已删除。')
}

function followUser(name: string) {
  ElMessage.success(`已关注 ${name}`)
}

onMounted(() => {
  void loadPosts()
})
</script>

<template>
  <div class="community-page-refined">
    <section class="community-refined-main">
      <div class="community-refined-composer">
        <div class="community-refined-composer-head">
          <img :src="currentUser?.avatar || '/images/support-agent-cat.jpg'" :alt="currentUser?.username || '用户头像'" />

          <div class="community-refined-composer-body">
            <div class="community-refined-editor">
              <el-input
                v-model="content"
                type="textarea"
                :rows="4"
                resize="none"
                maxlength="500"
                show-word-limit
                placeholder="分享你的养宠经验、互助心得或今天的毛孩子瞬间..."
              />

              <div class="community-refined-editor-toolbar">
                <input
                  ref="fileInputRef"
                  class="community-refined-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                  @change="handleFileChange"
                />

                <button
                  type="button"
                  class="community-refined-tool-button"
                  :disabled="selectedImages.length >= MAX_UPLOAD_COUNT"
                  @click="triggerImagePicker"
                >
                  <el-icon><Picture /></el-icon>
                  <span>图片/视频</span>
                </button>

                <el-popover
                  v-model:visible="topicPopoverVisible"
                  placement="bottom-start"
                  trigger="click"
                  :width="320"
                  popper-class="community-refined-topic-popper"
                >
                  <template #reference>
                    <button type="button" class="community-refined-tool-button community-refined-topic-trigger">
                      <span class="community-refined-topic-icon" aria-hidden="true"></span>
                      <span>话题标签</span>
                    </button>
                  </template>

                  <div class="community-refined-topic-selector">
                    <div class="community-refined-topic-selector-head">
                      <strong>选择话题标签</strong>
                      <span>可多选，也可添加自定义标签</span>
                    </div>

                    <div class="community-refined-tag-list">
                      <button
                        v-for="tag in filterOptions.filter((item) => item.key !== 'all').map((item) => item.label)"
                        :key="tag"
                        type="button"
                        class="community-refined-tag-chip"
                        :class="{ active: selectedTags.includes(tag) }"
                        @click="toggleTag(tag)"
                      >
                        #{{ tag }}
                      </button>
                    </div>

                    <div class="community-refined-tag-custom">
                      <el-input
                        v-model="customTagInput"
                        maxlength="12"
                        placeholder="自定义标签，例如：同城互助"
                        @keyup.enter="addCustomTag"
                      />

                      <button type="button" class="community-refined-secondary-button" @click="addCustomTag">
                        <el-icon><Plus /></el-icon>
                        <span>添加</span>
                      </button>
                    </div>

                    <div class="community-refined-topic-selector-foot">
                      <button type="button" class="community-refined-secondary-button" @click="confirmTopicSelection">
                        完成
                      </button>
                    </div>
                  </div>
                </el-popover>

                <button type="button" class="community-refined-tool-button" @click="showLocationPlaceholder">
                  <el-icon><Position /></el-icon>
                  <span>添加位置</span>
                </button>
              </div>
            </div>

            <div v-if="selectedImages.length" class="community-refined-upload-list">
              <div v-for="image in selectedImages" :key="image.id" class="community-refined-upload-item">
                <img :src="image.dataUrl" :alt="image.name" />

                <div class="community-refined-upload-meta">
                  <strong>{{ image.name }}</strong>
                  <span>{{ formatFileSize(image.size) }}</span>
                </div>

                <button type="button" class="community-refined-upload-remove" @click="removeSelectedImage(image.id)">
                  <el-icon><Close /></el-icon>
                </button>
              </div>
            </div>

            <div v-if="selectedTags.length" class="community-refined-selected-tags">
              <span
                v-for="tag in selectedTags"
                :key="tag"
                class="community-refined-selected-tag"
              >
                #{{ tag }}
                <button type="button" @click="removeTag(tag)">
                  <el-icon><Close /></el-icon>
                </button>
              </span>
            </div>
          </div>
        </div>

        <div class="community-refined-composer-foot">
          <div class="community-refined-tools"></div>
          <button type="button" class="community-refined-publish" :disabled="publishing" @click="publishPost">
            <span>{{ publishing ? '发布中...' : '发布' }}</span>
            <el-icon><Promotion /></el-icon>
          </button>
        </div>
      </div>

      <div class="community-refined-filters">
        <button
          v-for="item in filterOptions"
          :key="item.key"
          type="button"
          class="community-refined-filter"
          :class="{ active: activeFilter === item.key }"
          @click="activeFilter = item.key"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-if="hasDisplayedPosts" class="community-refined-waterfall">
        <div class="community-refined-column">
          <article
            v-for="post in leftColumnPosts"
            :key="post.id"
            class="community-refined-card"
            :class="{ 'is-text-only': post.media_urls.length === 0 }"
          >
            <div class="community-refined-card-top">
              <span class="community-refined-card-tag">#{{ postPrimaryTag(post) }}</span>

              <button
                v-if="canDeletePost(post)"
                type="button"
                class="community-refined-card-delete"
                @click="removePost(post)"
              >
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </button>
            </div>

            <img
              v-if="post.media_urls.length === 1"
              :src="post.media_urls[0]"
              :alt="post.author.username"
              class="community-refined-card-cover"
            />

            <div v-else-if="post.media_urls.length > 1" class="community-refined-card-gallery">
              <div
                v-for="(image, index) in galleryImages(post)"
                :key="`${post.id}-${index}`"
                class="community-refined-card-gallery-item"
              >
                <img :src="image" :alt="`${post.author.username}-${index}`" class="community-refined-card-cover" />
                <span v-if="index === 3 && galleryOverflowCount(post) > 0" class="community-refined-gallery-more">
                  +{{ galleryOverflowCount(post) }}
                </span>
              </div>
            </div>

            <div class="community-refined-card-body">
              <span class="community-refined-card-time">{{ formatPostTime(post.created_at) }}</span>
              <h3>{{ postTitle(post) }}</h3>
              <p v-if="postExcerpt(post)" class="community-refined-card-content">{{ postExcerpt(post) }}</p>

              <div v-if="post.tags.length > 1" class="community-refined-card-tags">
                <span v-for="tag in post.tags.slice(0, 4)" :key="tag">#{{ tag }}</span>
              </div>

              <div class="community-refined-card-foot">
                <div class="community-refined-author">
                  <img :src="post.author.avatar" :alt="post.author.username" />
                  <span>{{ post.author.username }}</span>
                </div>

                <div class="community-refined-metrics">
                  <span>赞 {{ post.like_count }}</span>
                  <span>评 {{ postComments(post) }}</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="community-refined-column">
          <article
            v-for="post in rightColumnPosts"
            :key="post.id"
            class="community-refined-card"
            :class="{ 'is-text-only': post.media_urls.length === 0 }"
          >
            <div class="community-refined-card-top">
              <span class="community-refined-card-tag">#{{ postPrimaryTag(post) }}</span>

              <button
                v-if="canDeletePost(post)"
                type="button"
                class="community-refined-card-delete"
                @click="removePost(post)"
              >
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </button>
            </div>

            <img
              v-if="post.media_urls.length === 1"
              :src="post.media_urls[0]"
              :alt="post.author.username"
              class="community-refined-card-cover"
            />

            <div v-else-if="post.media_urls.length > 1" class="community-refined-card-gallery">
              <div
                v-for="(image, index) in galleryImages(post)"
                :key="`${post.id}-${index}`"
                class="community-refined-card-gallery-item"
              >
                <img :src="image" :alt="`${post.author.username}-${index}`" class="community-refined-card-cover" />
                <span v-if="index === 3 && galleryOverflowCount(post) > 0" class="community-refined-gallery-more">
                  +{{ galleryOverflowCount(post) }}
                </span>
              </div>
            </div>

            <div class="community-refined-card-body">
              <span class="community-refined-card-time">{{ formatPostTime(post.created_at) }}</span>
              <h3>{{ postTitle(post) }}</h3>
              <p v-if="postExcerpt(post)" class="community-refined-card-content">{{ postExcerpt(post) }}</p>

              <div v-if="post.tags.length > 1" class="community-refined-card-tags">
                <span v-for="tag in post.tags.slice(0, 4)" :key="tag">#{{ tag }}</span>
              </div>

              <div class="community-refined-card-foot">
                <div class="community-refined-author">
                  <img :src="post.author.avatar" :alt="post.author.username" />
                  <span>{{ post.author.username }}</span>
                </div>

                <div class="community-refined-metrics">
                  <span>赞 {{ post.like_count }}</span>
                  <span>评 {{ postComments(post) }}</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="empty-state-card compact community-refined-empty-state">
        <h3>{{ activeFilterLabel }}暂无数据</h3>
        <p>当前分类下暂时还没有可展示的帖子，稍后可以切换到“全部”查看，或者发布一条新的社区动态。</p>
      </div>
    </section>

    <aside class="community-refined-side">
      <article class="community-refined-side-card">
        <div class="community-refined-side-head">
          <el-icon><TrendCharts /></el-icon>
          <h2>热门话题</h2>
        </div>

        <div class="community-refined-topic-list">
          <div v-for="(item, index) in hotTopics" :key="item.title" class="community-refined-topic-item">
            <span class="community-refined-topic-rank" :class="{ hot: index < 3 }">{{ index + 1 }}</span>
            <div class="community-refined-topic-copy">
              <strong>{{ item.title }}</strong>
            </div>
            <span class="community-refined-topic-heat">{{ item.heat }}</span>
          </div>
        </div>
      </article>

      <article class="community-refined-side-card">
        <div class="community-refined-side-head">
          <span class="community-refined-follow-head-icon" aria-hidden="true"></span>
          <h2>推荐关注</h2>
        </div>

        <div class="community-refined-follow-list">
          <div v-for="user in recommendedUsers" :key="user.id" class="community-refined-follow-item">
            <div class="community-refined-follow-user">
              <img :src="user.avatar" :alt="user.name" />
              <div>
                <strong>{{ user.name }}</strong>
                <span>{{ user.subtitle }}</span>
              </div>
            </div>

            <button type="button" class="community-refined-follow-button" @click="followUser(user.name)">关注</button>
          </div>
        </div>
      </article>
    </aside>

    <el-dialog
      v-model="roleDialogVisible"
      width="520px"
      title="请选择登录身份"
      align-center
    >
      <div class="role-choice-grid">
        <button type="button" class="role-choice-card" @click="chooseRole('owner')">
          <strong>我是宠物主人</strong>
          <span>登录后可发布社区动态、记录养宠日常，也能继续查看个人主页和订单。</span>
        </button>

        <button type="button" class="role-choice-card" @click="chooseRole('sitter')">
          <strong>我是铲屎官</strong>
          <span>登录后可发布服务见闻与照护经验，也能继续进入接单与个人中心流程。</span>
        </button>
      </div>
    </el-dialog>
  </div>
</template>
