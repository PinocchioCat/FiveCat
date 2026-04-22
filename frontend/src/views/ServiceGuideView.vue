<script setup lang="ts">
import { ChatDotRound, CircleCheck, Clock, Close, House, Medal, Opportunity, Position, Star, User } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'

interface ServiceItem {
  icon: Component
  tone: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'navy'
  title: string
  summary: string
  price: string
  billing: string
  features: string[]
}

interface ProcessStep {
  icon: Component
  title: string
  description: string
}

interface PriceQuestion {
  question: string
  answer: string
}

const router = useRouter()

const serviceItems: ServiceItem[] = [
  {
    icon: Opportunity,
    tone: 'orange',
    title: '代遛狗',
    summary: '专业遛狗服务，让狗狗尽情运动',
    price: '¥25-50/次',
    billing: '30-60分钟',
    features: ['GPS实时定位', '照片/视频反馈', '基础清洁', '从业经验丰富']
  },
  {
    icon: House,
    tone: 'blue',
    title: '上门喂养',
    summary: '上门喂食、换水、铲屎，让宠物安心',
    price: '¥30-60/次',
    billing: '45分钟内完成',
    features: ['喂食换水', '清洁猫砂/笼舍', '拍照互动', '异常记录']
  },
  {
    icon: House,
    tone: 'green',
    title: '家庭寄养',
    summary: '温暖家庭环境，24小时专人照顾',
    price: '¥80-150/天',
    billing: '按天计费',
    features: ['专人陪伴', '定时喂食', '日常照护', '每日状态反馈']
  },
  {
    icon: Clock,
    tone: 'purple',
    title: '临时照护',
    summary: '短时间陪伴照看，外出临时托付',
    price: '¥40-80/小时',
    billing: '按小时计费',
    features: ['上门陪伴', '喂食换水', '基础清洁', '紧急联系']
  },
  {
    icon: CircleCheck,
    tone: 'red',
    title: '应急陪护',
    summary: '紧急情况快速响应，宠物医疗陪护',
    price: '¥100-200/次',
    billing: '视情况议价',
    features: ['快速响应', '医疗陪同', '状态反馈', '紧急沟通']
  },
  {
    icon: Position,
    tone: 'navy',
    title: '宠物接送',
    summary: '安全舒适的宠物专车接送服务',
    price: '¥50-100/次',
    billing: '按距离计费',
    features: ['专业笼具', '安全驾驶', '路线透明', '门到门接送']
  }
]

const processSteps: ProcessStep[] = [
  {
    icon: ChatDotRound,
    title: '发布需求',
    description: '填写服务类型、时间和宠物信息'
  },
  {
    icon: User,
    title: '匹配铲屎官',
    description: '平台推荐附近合适的服务者'
  },
  {
    icon: CircleCheck,
    title: '确认下单',
    description: '沟通细节，确认服务，支付订单'
  },
  {
    icon: Star,
    title: '服务完成',
    description: '验收后确认服务，评价反馈'
  }
]

const promiseItems = ['所有平台铲屎官实名认证和背景审核', '服务过程中定位、照片或视频同步', '平台担保交易，服务不满意可申请退款', '7x24小时在线客服，随时响应问题', '安全保障金机制，最高赔付10万元']

const excludedItems = ['宠物医疗诊断和治疗（仅提供陪护）', '美容洗护、洗澡、剪毛等', '宠物训练强化（长期行为矫正）', '寄送或转运相关手续', '烈性犬、攻击性宠物照护']

const priceQuestions: PriceQuestion[] = [
  {
    question: '价格如何确定？',
    answer: '价格会根据服务类型、时长、距离、宠物数量和服务难度浮动，最终以发布需求后双方确认的订单金额为准。'
  },
  {
    question: '如何支付？',
    answer: '下单时支付至平台担保账户，服务完成并确认后结算给服务者，保障双方权益。'
  },
  {
    question: '可以退款吗？',
    answer: '服务开始前可根据订单状态取消；若服务质量存在争议，可联系平台客服协助处理。'
  },
  {
    question: '平台收取手续费吗？',
    answer: '平台会按订单金额收取少量服务费，用于实名认证、客服支持和安全保障。'
  }
]

async function publishOrder() {
  await router.push('/orders?entry=publish')
}
</script>

<template>
  <div id="top" class="service-guide-page">
    <section class="service-guide-hero">
      <span class="service-guide-kicker">
        <el-icon><Star /></el-icon>
        服务说明
      </span>
      <h1>
        <span>专业宠物服务</span>
        <strong>值得信赖的选择</strong>
      </h1>
      <p>宠友邻提供多种专业宠物服务，每一项服务都经过精心设计，确保您的毛孩子得到最好的照顾。</p>
    </section>

    <section class="service-guide-service-grid" aria-label="宠友邻服务类型">
      <article v-for="item in serviceItems" :key="item.title" class="service-guide-service-card">
        <span class="service-guide-service-icon" :class="item.tone">
          <el-icon><component :is="item.icon" /></el-icon>
        </span>
        <h2>{{ item.title }}</h2>
        <p>{{ item.summary }}</p>

        <div class="service-guide-price-row">
          <div>
            <span>参考价格</span>
            <strong>{{ item.price }}</strong>
          </div>
          <div>
            <span>服务时长</span>
            <strong>{{ item.billing }}</strong>
          </div>
        </div>

        <div class="service-guide-feature-list">
          <span v-for="feature in item.features" :key="feature">
            <el-icon><CircleCheck /></el-icon>
            {{ feature }}
          </span>
        </div>
      </article>
    </section>

    <section class="service-guide-process-band">
      <div class="service-guide-section-heading">
        <h2>如何使用服务</h2>
        <p>简单四步，轻松预约</p>
      </div>

      <div class="service-guide-process-grid">
        <article v-for="(step, index) in processSteps" :key="step.title" class="service-guide-process-card">
          <span class="service-guide-step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="service-guide-process-icon">
            <el-icon><component :is="step.icon" /></el-icon>
          </span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </article>
      </div>
    </section>

    <section class="service-guide-section">
      <div class="service-guide-section-heading">
        <h2>服务保障</h2>
        <p>您的信任，我们珍重</p>
      </div>

      <div class="service-guide-guarantee-grid">
        <article class="service-guide-guarantee-card dark">
          <span class="service-guide-guarantee-icon">
            <el-icon><Medal /></el-icon>
          </span>
          <h3>我们承诺</h3>
          <ul>
            <li v-for="item in promiseItems" :key="item">
              <el-icon><CircleCheck /></el-icon>
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>

        <article class="service-guide-guarantee-card light">
          <span class="service-guide-guarantee-icon">
            <el-icon><Close /></el-icon>
          </span>
          <h3>不包含服务</h3>
          <ul>
            <li v-for="item in excludedItems" :key="item">
              <el-icon><Close /></el-icon>
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section class="service-guide-price-section">
      <div class="service-guide-section-heading">
        <h2>价格说明</h2>
      </div>

      <div class="service-guide-faq-card">
        <article v-for="item in priceQuestions" :key="item.question" class="service-guide-faq-item">
          <span>¥</span>
          <div>
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="service-guide-cta">
      <h2>准备好开始了吗？</h2>
      <p>立即发布需求，找到最合适的铲屎官</p>
      <button type="button" @click="publishOrder">立即发布需求</button>
    </section>
  </div>
</template>
