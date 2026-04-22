<script setup lang="ts">
import { Bell, CircleCheck, Clock, Location, MapLocation, Position, User, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

interface CityCoverageItem {
  name: string
  status: 'opened' | 'soon'
  users: string
  sitters: string
  orders: string
  growth: string
  districts: string[]
}

const coverageStats = [
  { label: '服务城市', value: '12个', icon: Position, tone: 'blue' },
  { label: '注册用户', value: '78,200+', icon: User, tone: 'green' },
  { label: '活跃铲屎官', value: '7,900+', icon: UserFilled, tone: 'orange' },
  { label: '完成订单', value: '147,500+', icon: CircleCheck, tone: 'purple' }
]

const cityList: CityCoverageItem[] = [
  {
    name: '北京',
    status: 'opened',
    users: '12,500',
    sitters: '1,245',
    orders: '23,400',
    growth: '+25%',
    districts: ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '石景山区', '通州区', '昌平区']
  },
  {
    name: '上海',
    status: 'opened',
    users: '11,700',
    sitters: '1,080',
    orders: '20,860',
    growth: '+23%',
    districts: ['浦东新区', '徐汇区', '静安区', '黄浦区', '长宁区', '杨浦区']
  },
  {
    name: '广州',
    status: 'opened',
    users: '8,200',
    sitters: '840',
    orders: '15,300',
    growth: '+26%',
    districts: ['天河区', '越秀区', '海珠区', '番禺区', '白云区']
  },
  {
    name: '深圳',
    status: 'opened',
    users: '7,600',
    sitters: '790',
    orders: '14,800',
    growth: '+30%',
    districts: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区']
  },
  {
    name: '杭州',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '成都',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '武汉',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '南京',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '西安',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '重庆',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '天津',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  },
  {
    name: '苏州',
    status: 'soon',
    users: '即将开通',
    sitters: '-',
    orders: '-',
    growth: '-',
    districts: []
  }
]

const roadmapItems = [
  { value: '20', title: '覆盖城市', description: '新增 8 个一、二线城市', tone: 'blue' },
  { value: '500', title: '覆盖区域', description: '精细化服务到区县级', tone: 'green' },
  { value: '1M', title: '服务用户', description: '目标百万用户规模', tone: 'orange' }
]

const selectedCityName = ref('北京')
const openedCities = computed(() => cityList.filter((city) => city.status === 'opened'))
const selectedCity = computed(() => cityList.find((city) => city.name === selectedCityName.value) ?? openedCities.value[0])

function selectCity(city: CityCoverageItem) {
  selectedCityName.value = city.name
}

function reserveNotice() {
  ElMessage.success('已记录开通提醒，城市上线后会第一时间通知你。')
}
</script>

<template>
  <div id="top" class="city-coverage-page">
    <section class="city-coverage-hero">
      <span class="city-coverage-kicker">
        <el-icon><Location /></el-icon>
        城市覆盖
      </span>
      <h1>
        <span>服务覆盖全国</span>
        <strong>12个重点城市</strong>
      </h1>
      <p>持续拓展中，更多城市即将上线</p>
    </section>

    <section class="city-coverage-stat-grid" aria-label="城市覆盖概览">
      <article v-for="item in coverageStats" :key="item.label" class="city-coverage-stat-card">
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
        <el-icon class="city-coverage-stat-icon" :class="item.tone">
          <component :is="item.icon" />
        </el-icon>
      </article>
    </section>

    <section class="city-coverage-city-grid" aria-label="城市列表">
      <button
        v-for="city in cityList"
        :key="city.name"
        type="button"
        class="city-coverage-city-card"
        :class="{ active: selectedCity.name === city.name, muted: city.status === 'soon' }"
        @click="selectCity(city)"
      >
        <span class="city-coverage-city-name">
          {{ city.name }}
          <el-icon v-if="city.status === 'soon'"><Clock /></el-icon>
        </span>
        <template v-if="city.status === 'opened'">
          <strong>{{ city.users }} <small>用户</small></strong>
          <span class="city-coverage-city-growth">{{ city.growth }} 本月增长</span>
        </template>
        <template v-else>
          <strong>{{ city.users }}</strong>
          <span>敬请期待</span>
        </template>
      </button>
    </section>

    <section class="city-coverage-feature-card">
      <div class="city-coverage-photo">
        <img src="/images/city-skyline-shanghai.svg" alt="上海城市天际线" />
      </div>

      <div class="city-coverage-feature-copy">
        <div class="city-coverage-feature-head">
          <h2>{{ selectedCity.name }}</h2>
          <span :class="{ pending: selectedCity.status === 'soon' }">{{ selectedCity.status === 'opened' ? '已开通' : '筹备中' }}</span>
        </div>

        <div v-if="selectedCity.status === 'opened'" class="city-coverage-feature-stats">
          <div>
            <strong>{{ selectedCity.users }}</strong>
            <span>注册用户</span>
          </div>
          <div>
            <strong>{{ selectedCity.sitters }}</strong>
            <span>铲屎官</span>
          </div>
          <div>
            <strong>{{ selectedCity.orders }}</strong>
            <span>完成订单</span>
          </div>
        </div>

        <div v-if="selectedCity.status === 'opened'" class="city-coverage-districts">
          <h3>
            <el-icon><MapLocation /></el-icon>
            覆盖区域
          </h3>
          <div>
            <span v-for="district in selectedCity.districts" :key="district">{{ district }}</span>
          </div>
        </div>

        <div class="city-coverage-growth-box">
          <span>{{ selectedCity.status === 'opened' ? '本月增长' : '开通进度' }}</span>
          <strong>{{ selectedCity.status === 'opened' ? selectedCity.growth : '筹备中' }}</strong>
        </div>
      </div>
    </section>

    <section class="city-coverage-roadmap-band">
      <div class="city-coverage-section-heading">
        <h2>拓展计划</h2>
        <p>2026 年我们的目标</p>
      </div>

      <div class="city-coverage-roadmap-grid">
        <article v-for="item in roadmapItems" :key="item.title" class="city-coverage-roadmap-card">
          <span :class="item.tone">{{ item.value }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="city-coverage-cta">
      <el-icon><Bell /></el-icon>
      <h2>你的城市还未开通？</h2>
      <p>留下联系方式，新城市开通时我们会第一时间通知你</p>
      <button type="button" @click="reserveNotice">预约开通提醒</button>
    </section>
  </div>
</template>
