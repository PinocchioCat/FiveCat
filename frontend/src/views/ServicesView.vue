<script setup lang="ts">
import { ArrowRight, Calendar, Clock, Filter, Location, Search, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

import { currentRole } from '../store/session'

interface NearbySitter {
  id: number
  name: string
  rating: string
  distance: string
  time: string
  avatar: string
}

interface TaskItem {
  id: number
  type: string
  title: string
  detailTitle: string
  petName: string
  description: string
  distance: string
  time: string
  price: string
  owner: string
  avatar: string
  publishedAt?: string
  orderNo: string
  address: string
  petDetail: string
  heroImage: string
  ownerAvatar: string
  ownerNote: string
}

const serviceType = ref('代遛狗')
const serviceTime = ref('')
const budget = ref('')
const address = ref('朝阳区阳光小区 3栋')
const note = ref('例如：狗狗比较活泼，需要多跑动...')
const searchKeyword = ref('')
const taskServiceType = ref('全部')
const taskDistance = ref('3公里以内')
const taskTime = ref('不限时间')
const minReward = ref('')
const maxReward = ref('')
const selectedTaskId = ref(1)

const isSitterTaskHall = computed(() => currentRole.value === 'sitter')

const nearbySitters: NearbySitter[] = [
  {
    id: 1,
    name: '王同学',
    rating: '4.9',
    distance: '距 800m',
    time: '全天可接',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 2,
    name: '李阿姨',
    rating: '5',
    distance: '距 1.2km',
    time: '下午14:00后',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 3,
    name: '张女士',
    rating: '4.8',
    distance: '距 2.5km',
    time: '周末可接',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80'
  }
]

const serviceFilters = ['全部', '代遛狗', '上门喂养', '家庭寄养']

const taskItems: TaskItem[] = [
  {
    id: 1,
    type: '代遛狗',
    title: '1只金毛（中型犬）',
    detailTitle: '中型犬',
    petName: '豆豆',
    description: '狗狗比较活泼，需要多跑动。平时会在小区楼下小公园玩耍，请务必牵好牵引绳...',
    distance: '距您 800m',
    time: '今天 18:00-19:00',
    price: '35.00',
    owner: '张女士',
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=240&q=80',
    orderNo: 'DLG202604160012',
    address: '朝阳区阳光小区3栋西门',
    petDetail: '豆豆（金毛, 2岁, 28kg, 已打疫苗）',
    heroImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    ownerNote: '狗狗比较活泼，需要多跑动。平时会在小区楼下小公园玩耍，请务必牵好牵引绳。如果遇到别的狗狗，拉紧一点，他比较爱激动。带了拾便袋和水壶，放在门口鞋柜上。'
  },
  {
    id: 2,
    type: '上门喂养',
    title: '2只蓝猫',
    detailTitle: '蓝猫',
    petName: '蓝猫',
    description: '需要添粮换水，顺便清理一下猫砂。家里有监控，两只猫比较怕生，不要强行抚摸。',
    distance: '距您 1.2km',
    time: '明天 10:00-11:00',
    price: '45.00',
    owner: '李先生',
    avatar: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=240&q=80',
    publishedAt: '半小时前发布',
    orderNo: 'SMWY202604160018',
    address: '朝阳区星河湾2号楼801',
    petDetail: '两只蓝猫（3岁, 已打疫苗）',
    heroImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80',
    ownerAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
    ownerNote: '两只猫都比较慢热，进门后先不要主动抱。请帮忙加粮、换水、清理猫砂，离开前拍一下猫砂盆和食盆照片给我。'
  },
  {
    id: 3,
    type: '代遛狗',
    title: '1只柯基（小型犬）',
    detailTitle: '小型犬',
    petName: '布丁',
    description: '脾气很好，不会乱叫，正常遛半小时即可，需要给个擦脚。',
    distance: '距您 2.0km',
    time: '今天 20:00-21:00',
    price: '25.00',
    owner: '王女士',
    avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=240&q=80',
    publishedAt: '1小时前发布',
    orderNo: 'DLG202604160026',
    address: '朝阳区云杉花园南门',
    petDetail: '布丁（柯基, 4岁, 11kg, 已打疫苗）',
    heroImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    ownerNote: '布丁很亲人，出门前会有点兴奋，先让它坐下再开门。遛完请擦脚，湿巾放在门口收纳盒里。'
  }
]

const visibleTaskItems = computed(() => {
  if (taskServiceType.value === '全部') return taskItems
  return taskItems.filter((item) => item.type === taskServiceType.value)
})

const selectedTask = computed(() => visibleTaskItems.value.find((item) => item.id === selectedTaskId.value) ?? visibleTaskItems.value[0] ?? taskItems[0])

function publishRequest() {
  ElMessage.success('需求已准备发布，后续可继续接入真实下单流程。')
}

function reserveSitter(name: string) {
  ElMessage.success(`已为你预留 ${name} 的快速预约入口。`)
}

function viewMore() {
  ElMessage.info('更多铲屎官列表入口已预留。')
}

function selectTask(task: TaskItem) {
  selectedTaskId.value = task.id
}

function contactOwner() {
  ElMessage.info('在线沟通入口已预留。')
}

function acceptTask() {
  ElMessage.success('抢单成功，订单已进入待服务。')
}
</script>

<template>
  <div v-if="isSitterTaskHall" class="task-hall-page">
    <aside class="task-hall-filter">
      <div class="task-hall-filter-title">
        <el-icon><Filter /></el-icon>
        <h2>任务筛选</h2>
      </div>

      <div class="task-hall-filter-group">
        <strong>服务类型</strong>
        <div class="task-hall-radio-list">
          <button
            v-for="item in serviceFilters"
            :key="item"
            type="button"
            class="task-hall-radio"
            :class="{ active: taskServiceType === item }"
            @click="taskServiceType = item"
          >
            <span></span>
            {{ item }}
          </button>
        </div>
      </div>

      <div class="task-hall-filter-group">
        <strong>距离范围</strong>
        <select v-model="taskDistance" class="task-hall-select">
          <option>3公里以内</option>
          <option>5公里以内</option>
          <option>10公里以内</option>
        </select>
      </div>

      <div class="task-hall-filter-group">
        <strong>时间要求</strong>
        <select v-model="taskTime" class="task-hall-select">
          <option>不限时间</option>
          <option>今天</option>
          <option>明天</option>
          <option>本周内</option>
        </select>
      </div>

      <div class="task-hall-filter-group">
        <strong>报酬区间（元）</strong>
        <div class="task-hall-price-row">
          <input v-model="minReward" type="text" placeholder="最低" />
          <span></span>
          <input v-model="maxReward" type="text" placeholder="最高" />
        </div>
      </div>
    </aside>

    <section class="task-hall-list">
      <button
        v-for="task in visibleTaskItems"
        :key="task.id"
        type="button"
        class="task-hall-card"
        :class="{ active: selectedTask.id === task.id }"
        @click="selectTask(task)"
      >
        <div class="task-hall-card-main">
          <div class="task-hall-card-head">
            <span class="task-hall-type">{{ task.type }}</span>
            <h3>{{ task.title }}</h3>
            <strong>¥ {{ task.price }}</strong>
          </div>
          <p>{{ task.description }}</p>
          <div class="task-hall-meta">
            <span><el-icon><Location /></el-icon>{{ task.distance }}</span>
            <span><el-icon><Clock /></el-icon>{{ task.time }}</span>
          </div>
        </div>

        <div v-if="task.publishedAt" class="task-hall-publisher">
          <img :src="task.avatar" :alt="task.owner" />
          <span>{{ task.owner }}</span>
          <small>{{ task.publishedAt }}</small>
        </div>
      </button>
    </section>

    <aside class="task-hall-detail">
      <div class="task-hall-detail-cover">
        <img :src="selectedTask.heroImage" :alt="selectedTask.title" />
        <div class="task-hall-detail-avatar">
          <img :src="selectedTask.avatar" :alt="selectedTask.petName" />
        </div>
        <span class="task-hall-address">
          <el-icon><Location /></el-icon>
          {{ selectedTask.address }}
        </span>
      </div>

      <div class="task-hall-detail-body">
        <section class="task-hall-order-summary">
          <div class="task-hall-detail-head">
            <div>
              <h2>{{ selectedTask.type }} - {{ selectedTask.detailTitle }}</h2>
              <p>服务单号: {{ selectedTask.orderNo }}</p>
            </div>
            <div class="task-hall-detail-price">
              <strong>¥ {{ selectedTask.price }}</strong>
              <span>已托管至平台</span>
            </div>
          </div>

          <div class="task-hall-detail-info">
            <div>
              <span>时间要求</span>
              <strong>{{ selectedTask.time }}</strong>
            </div>
            <div>
              <span>接送地址</span>
              <strong>{{ selectedTask.address }}</strong>
            </div>
            <div>
              <span>宠物详情</span>
              <strong>{{ selectedTask.petDetail }}</strong>
            </div>
          </div>
        </section>

        <div class="task-hall-owner-note-section">
          <h2>主人的嘱咐</h2>
          <p>{{ selectedTask.ownerNote }}</p>
        </div>

        <article class="task-hall-owner-card">
          <img class="task-hall-owner-avatar" :src="selectedTask.ownerAvatar" :alt="selectedTask.owner" />
          <div>
            <strong>{{ selectedTask.owner }}</strong>
            <span class="task-hall-owner-verify">
              <img src="/images/liteNameincon.png" alt="" />
              已实名认证 · 加入平台 1 年
            </span>
          </div>
        </article>
      </div>

      <div class="task-hall-detail-actions">
        <button type="button" class="task-hall-chat" @click="contactOwner">在线沟通</button>
        <button type="button" class="task-hall-accept" @click="acceptTask">立即抢单</button>
      </div>
    </aside>
  </div>

  <div v-else class="services-finder-page">
    <section class="services-finder-panel services-finder-demand">
      <h2>发布需求</h2>

      <label class="services-finder-field">
        <span>服务类型</span>
        <select v-model="serviceType">
          <option>代遛狗</option>
          <option>上门喂养</option>
          <option>家庭寄养</option>
          <option>临时照护</option>
          <option>应急陪护</option>
        </select>
      </label>

      <label class="services-finder-field">
        <span>服务时间</span>
        <div class="services-finder-input-icon">
          <el-icon><Calendar /></el-icon>
          <input v-model="serviceTime" type="text" placeholder="年 / 月 / 日 --:--" />
        </div>
      </label>

      <label class="services-finder-field">
        <span>预算范围（元）</span>
        <div class="services-finder-input-icon">
          <strong>¥</strong>
          <input v-model="budget" type="text" placeholder="输入预算" />
        </div>
      </label>

      <label class="services-finder-field">
        <span>服务地址</span>
        <div class="services-finder-input-icon">
          <el-icon><Location /></el-icon>
          <input v-model="address" type="text" />
        </div>
      </label>

      <div class="services-finder-field">
        <span>选择宠物</span>
        <div class="services-finder-pet-row">
          <button type="button" class="services-finder-pet active">豆豆（金毛）</button>
          <button type="button" class="services-finder-pet">+ 新增宠物</button>
        </div>
      </div>

      <label class="services-finder-field">
        <span>备注说明</span>
        <textarea v-model="note" rows="4"></textarea>
      </label>

      <button type="button" class="services-finder-primary" @click="publishRequest">确认发布</button>
    </section>

    <section class="services-finder-map-panel">
      <div class="services-finder-search">
        <el-icon><Search /></el-icon>
        <input v-model="searchKeyword" type="text" placeholder="搜索地址..." />
        <button type="button">搜索</button>
      </div>

      <div class="services-finder-map">
        <div class="services-finder-radar outer"></div>
        <div class="services-finder-radar inner"></div>
        <div class="services-finder-map-marker">
          <el-icon><Location /></el-icon>
        </div>
        <span class="services-finder-map-tip">服务半径 3 公里</span>
      </div>
    </section>

    <aside class="services-finder-panel services-finder-sitters">
      <h2>附近可接单铲屎官</h2>

      <div class="services-finder-sitter-list">
        <article v-for="sitter in nearbySitters" :key="sitter.id" class="services-finder-sitter-card">
          <div class="services-finder-sitter-head">
            <img :src="sitter.avatar" :alt="sitter.name" />
            <div>
              <strong>{{ sitter.name }}</strong>
              <p>
                <span class="services-finder-star"><el-icon><Star /></el-icon>{{ sitter.rating }}</span>
                <span>{{ sitter.distance }}</span>
              </p>
            </div>
          </div>

          <div class="services-finder-sitter-time">
            <el-icon><Clock /></el-icon>
            <span>{{ sitter.time }}</span>
          </div>

          <button type="button" class="services-finder-reserve" @click="reserveSitter(sitter.name)">快速预约</button>
        </article>
      </div>

      <button type="button" class="services-finder-more" @click="viewMore">
        <span>查看更多</span>
        <el-icon><ArrowRight /></el-icon>
      </button>
    </aside>
  </div>
</template>
