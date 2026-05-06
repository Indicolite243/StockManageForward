<template>
  <div class="menu-bar">
    <div class="top-decoration">
      <div class="decoration-line"></div>
      <div class="corner-accent left"></div>
      <div class="corner-accent right"></div>
    </div>

    <div class="header-section">
      <div class="logo-area">
        <div class="logo-icon">
          <div class="icon-circle">
            <i class="icon-stock"></i>
          </div>
        </div>
        <div class="title-group">
          <h1 class="main-title">股票决策可视化系统</h1>
          <div class="subtitle">Stock Vision Analytics</div>
        </div>
      </div>

      <div class="status-indicators">
        <div class="status-item">
          <div class="status-dot active"></div>
          <span>系统运行正常</span>
        </div>
        <div class="time-display">{{ currentTime }}</div>

        <div class="user-menu">
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-avatar">
              <div class="avatar-circle">
                <i class="avatar-icon">👤</i>
              </div>
              <span class="user-name">{{ userName }}</span>
              <i class="el-icon-arrow-down"></i>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item command="profile">
                  <i class="el-icon-user"></i>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="switch-account">
                  <i class="el-icon-refresh"></i>
                  切换账号
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <i class="el-icon-switch-button"></i>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div class="nav-section">
      <el-menu
        :default-active="activeIndex"
        class="nav-menu"
        mode="horizontal"
        router
        @select="handleSelect"
      >
        <el-menu-item index="/display" class="menu-item-custom">
          <div class="menu-item-content">
            <i class="menu-icon display-icon"></i>
            <span class="menu-text">数据展示</span>
            <div class="menu-glow"></div>
          </div>
        </el-menu-item>
        <el-menu-item index="/comparison" class="menu-item-custom">
          <div class="menu-item-content">
            <i class="menu-icon comparison-icon"></i>
            <span class="menu-text">对比评估</span>
            <div class="menu-glow"></div>
          </div>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="bottom-decoration">
      <div class="decoration-line"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { getLocalUserInfo, logout as logoutApi } from '@/api/authApi.js'

const router = useRouter()
const route = useRoute()
const activeIndex = ref(route.path)
const currentTime = ref('')
const userName = ref('用户')

let timer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleSelect = (key) => {
  activeIndex.value = key
  router.push(key)
}

const handleLogout = async () => {
  try {
    await logoutApi()
    userName.value = '用户'
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error?.message || '退出登录失败')
  }
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中...')
      break
    case 'switch-account':
      router.push('/login')
      break
    case 'logout':
      await handleLogout()
      break
    default:
      break
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  const userInfo = getLocalUserInfo()
  if (userInfo?.display_name || userInfo?.username) {
    userName.value = userInfo.display_name || userInfo.username
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.menu-bar {
  position: relative;
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(12, 20, 38, 0.95) 0%,
    rgba(26, 31, 58, 0.95) 50%,
    rgba(15, 20, 25, 0.95) 100%
  );
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(64, 224, 255, 0.3);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(64, 224, 255, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.top-decoration {
  position: relative;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(64, 224, 255, 0.8) 50%, transparent 100%);
}

.decoration-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(64, 224, 255, 0.6) 20%,
    rgba(64, 224, 255, 1) 50%,
    rgba(64, 224, 255, 0.6) 80%,
    transparent 100%
  );
  animation: pulse 3s ease-in-out infinite;
}

.corner-accent {
  position: absolute;
  top: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(45deg, #40e0ff, #1e90ff);
  box-shadow: 0 0 10px rgba(64, 224, 255, 0.8);
}

.corner-accent.left {
  left: 0;
}

.corner-accent.right {
  right: 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px 10px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  position: relative;
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #40e0ff, #1e90ff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 20px rgba(64, 224, 255, 0.6),
    inset 0 0 10px rgba(255, 255, 255, 0.2);
  animation: rotate 10s linear infinite;
}

.icon-stock {
  width: 24px;
  height: 24px;
  background: white;
  clip-path: polygon(0% 100%, 25% 0%, 50% 50%, 75% 0%, 100% 100%);
}

.title-group {
  color: white;
}

.main-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #40e0ff, #ffffff, #1e90ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(64, 224, 255, 0.5);
}

.subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
  letter-spacing: 1px;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 10px #00ff88;
  animation: pulse 2s ease-in-out infinite;
}

.time-display {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: rgba(64, 224, 255, 0.9);
  text-shadow: 0 0 5px rgba(64, 224, 255, 0.5);
}

.user-menu {
  margin-left: 20px;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(64, 224, 255, 0.2);
  transition: all 0.3s ease;
}

.user-avatar:hover {
  background: rgba(64, 224, 255, 0.1);
  border-color: rgba(64, 224, 255, 0.4);
  box-shadow: 0 0 15px rgba(64, 224, 255, 0.2);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #40e0ff, #1e90ff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(64, 224, 255, 0.4);
}

.avatar-icon {
  font-size: 16px;
  color: white;
}

.user-name {
  font-size: 14px;
  color: white;
  font-weight: 500;
  text-shadow: 0 0 5px rgba(64, 224, 255, 0.3);
}

.user-dropdown {
  background: rgba(12, 20, 38, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 224, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.user-dropdown :deep(.el-dropdown-menu__item) {
  color: white;
  background: transparent;
  border-radius: 4px;
  margin: 2px 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.user-dropdown :deep(.el-dropdown-menu__item:hover) {
  background: rgba(64, 224, 255, 0.1);
  color: #40e0ff;
}

.user-dropdown :deep(.el-dropdown-menu__item i) {
  margin-right: 8px;
  color: rgba(64, 224, 255, 0.8);
}

.user-dropdown :deep(.el-dropdown-menu__item.is-divided) {
  border-top: 1px solid rgba(64, 224, 255, 0.2);
  margin-top: 8px;
  padding-top: 12px;
}

.nav-section {
  padding: 0 30px 15px;
}

.nav-menu {
  background: transparent !important;
  border: none !important;
}

.menu-item-custom {
  position: relative;
  margin: 0 10px;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(64, 224, 255, 0.2) !important;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.menu-item-custom:hover {
  background: rgba(64, 224, 255, 0.1) !important;
  border-color: rgba(64, 224, 255, 0.5) !important;
  box-shadow:
    0 0 20px rgba(64, 224, 255, 0.3),
    inset 0 0 20px rgba(64, 224, 255, 0.1);
  transform: translateY(-2px);
}

.menu-item-custom.is-active {
  background: rgba(64, 224, 255, 0.2) !important;
  border-color: rgba(64, 224, 255, 0.8) !important;
  box-shadow:
    0 0 30px rgba(64, 224, 255, 0.5),
    inset 0 0 20px rgba(64, 224, 255, 0.2);
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  position: relative;
}

.menu-icon {
  width: 16px;
  height: 16px;
  background: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

.display-icon {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'/%3E%3C/svg%3E");
}

.comparison-icon {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25L22 19.5l-2.5.75-.75 2.5L18 19.5l-2.5.75-.75-2.5L17.5 17l2.5-.75.75-2.5z'/%3E%3C/svg%3E");
}

.menu-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(64, 224, 255, 0.3);
}

.menu-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(64, 224, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.menu-item-custom:hover .menu-glow {
  opacity: 1;
  animation: shimmer 1.5s ease-in-out infinite;
}

.bottom-decoration {
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(64, 224, 255, 0.4) 25%,
    rgba(64, 224, 255, 0.8) 50%,
    rgba(64, 224, 255, 0.4) 75%,
    transparent 100%
  );
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

:deep(.el-menu-item) {
  border: none !important;
  background: transparent !important;
  color: white !important;
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  line-height: normal !important;
}

:deep(.el-menu-item:hover) {
  background: transparent !important;
  color: white !important;
}

:deep(.el-menu-item.is-active) {
  background: transparent !important;
  color: white !important;
  border-bottom: none !important;
}
</style>
