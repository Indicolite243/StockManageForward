<template>
  <div class="comparison-page">
    <!-- 网格背景装饰 -->
    <div class="grid-background"></div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧导航栏 -->
      <div class="left-sidebar glass-panel">
        <div class="sidebar-header">
          <div class="header-line"></div>
          <h3 class="sidebar-title">对比评估</h3>
        </div>

        <div class="sidebar-menu">
          <div
            class="menu-item"
            :class="{ active: activeMenu === 'asset' }"
            @click="setActiveMenu('asset')"
          >
            <div class="menu-icon asset-icon"></div>
            <span>资产对比</span>
          </div>

          <div
            class="menu-item"
            :class="{ active: activeMenu === 'time' }"
            @click="setActiveMenu('time')"
          >
            <div class="menu-icon time-icon"></div>
            <span>时间段对比</span>
          </div>

          <div
            class="menu-item"
            :class="{ active: activeMenu === 'region' }"
            @click="setActiveMenu('region')"
          >
            <div class="menu-icon region-icon"></div>
            <span>分市场对比</span>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 上半部分 -->
        <div class="content-row top-row">
          <!-- 左上：图表区域 -->
          <div class="content-panel glass-panel chart-panel">
            <div class="panel-header">
              <div class="header-line"></div>
              <h4 class="panel-title">
                <i class="title-icon chart-icon"></i>
                数据可视化
              </h4>
              <div class="status-indicator"></div>
            </div>
            <div class="panel-content">
              <ComparisonChart ref="comparisonChart" :chart-type="getChartType()" />
            </div>
          </div>

          <!-- 右上：风险阈值 -->
          <div class="content-panel glass-panel threshold-panel">
            <div class="panel-header">
              <div class="header-line"></div>
              <h4 class="panel-title">
                <i class="title-icon threshold-icon"></i>
                风险阈值
              </h4>
              <div class="status-indicator"></div>
            </div>
            <div class="panel-content">
              <RiskThreshold :data="riskThresholdData" />
            </div>
          </div>
        </div>

        <!-- 下半部分 -->
        <div class="content-row bottom-row">
          <!-- 左下：表格区域 -->
          <div class="content-panel glass-panel table-panel">
            <div class="panel-header">
              <div class="header-line"></div>
              <h4 class="panel-title">
                <i class="title-icon table-icon"></i>
                数据详情
              </h4>
              <div class="status-indicator"></div>
            </div>
            <div class="panel-content">
              <ComparisonTable
                ref="comparisonTable"
                :table-type="getTableType()"
                @account-changed="handleAccountChange"
                @refresh="refreshAllData"
              />
            </div>
          </div>

          <!-- 右下：业绩归因 -->
          <div class="content-panel glass-panel warning-panel">
            <div class="panel-header">
              <div class="header-line"></div>
              <h4 class="panel-title">
                <i class="title-icon warning-icon"></i>
                业绩归因
              </h4>
              <div class="status-indicator"></div>
            </div>
            <div class="panel-content">
              <RiskWarning ref="riskWarning" :warnings="riskWarnings" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动装饰元素 -->
    <div class="floating-decorations">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
      <div class="decoration-orb orb-3"></div>
    </div>
  </div>
</template>

<script>
import ComparisonChart from '@/components/comparison/ComparisonChart.vue';
import RiskThreshold from '@/components/comparison/RiskThreshold.vue';
import ComparisonTable from '@/components/comparison/ComparisonTable.vue';
import RiskWarning from '@/components/comparison/RiskWarning.vue';
import { fetchRiskAssessment } from '@/api/riskThresholdApi.js';
import { fetchAssetComparison, fetchYearlyComparisonData, fetchAreaComparison } from '@/api/comparisonModuleApi.js';

export default {
  name: 'ComparisonPage',
  components: {
    ComparisonChart,
    RiskThreshold,
    ComparisonTable,
    RiskWarning,
  },
  data() {
    return {
      activeMenu: 'asset',
      riskThresholdData: [],
      refreshTimer: null,
      riskWarnings: [
        {
          level: 'normal',
          message: '系统运行正常',
          time: new Date().toLocaleString(),
          action: '继续监控'
        }
      ]
    };
  },
  async mounted() {
    console.log('🚀 [ComparisonPage] mounted');
    await this.loadRiskThresholdData();
    this.refreshAllData();
    this.startRefreshTimer();
  },
  beforeUnmount() {
    this.stopRefreshTimer();
  },
  methods: {
    startRefreshTimer() {
      if (this.refreshTimer) return;
      this.refreshTimer = setInterval(() => {
        this.refreshAllData();
      }, 3000);
    },

    stopRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },

    /**
     * 统一刷新所有数据
     * 实现“单一来源”分发，确保图表、表格数据严格同步
     */
    async refreshAllData() {
      let currentAccountId = '62283925';
      if (this.$refs.comparisonTable && this.$refs.comparisonTable.selectedAccount) {
        currentAccountId = this.$refs.comparisonTable.selectedAccount;
      }

      const type = this.activeMenu;
      console.log(`🔄 [ComparisonPage] 刷新数据 - 类型: ${type}, 账户: ${currentAccountId}`);

      try {
        let rawData = null;
        if (type === 'asset') {
          // 使用专门的资产对比接口，获取包含占比、盈亏率等丰富字段的数据
          rawData = await fetchAssetComparison(currentAccountId);
        } else if (type === 'time') {
          rawData = await fetchYearlyComparisonData(currentAccountId);
        } else if (type === 'region') {
          rawData = await fetchAreaComparison(currentAccountId);
        }

        if (!rawData) return;

        // 1. 分发数据给图表
        if (this.$refs.comparisonChart && typeof this.$refs.comparisonChart.setData === 'function') {
          this.$refs.comparisonChart.setData(rawData, currentAccountId);
        }

        // 2. 分发数据给表格
        if (this.$refs.comparisonTable && typeof this.$refs.comparisonTable.setData === 'function') {
          this.$refs.comparisonTable.setData(rawData);
        }

        // 3. 更新归因分析模块
        if (type === 'asset' && this.$refs.riskWarning && typeof this.$refs.riskWarning.setData === 'function') {
          this.$refs.riskWarning.setData(rawData);
        }

      } catch (error) {
        console.error(`❌ [ComparisonPage] 刷新失败:`, error);
      }
    },

    async loadRiskThresholdData(accountId = '62283925') {
      try {
        const data = await fetchRiskAssessment(accountId, 30);
        this.riskThresholdData = data.risk_indicators || data.indicators || [];
      } catch (error) {
        console.error('❌ 获取风险阈值失败:', error);
        this.riskThresholdData = [];
      }
    },

    setActiveMenu(menu) {
      if (this.activeMenu === menu) return;
      this.activeMenu = menu;
      this.$nextTick(() => {
        this.refreshAllData();
      });
    },

    getChartType() { return this.activeMenu; },
    getTableType() { return this.activeMenu; },

    handleAccountChange(accountId) {
      console.log('👤 [ComparisonPage] 账户切换:', accountId);
      this.refreshAllData();
      this.loadRiskThresholdData(accountId);
    }
  }
};
</script>

<style scoped>
.comparison-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 120px);
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
  z-index: 2;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(64, 224, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 224, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.content-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 20px;
  z-index: 3;
}

.glass-panel {
  position: relative;
  background: rgba(12, 20, 38, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(64, 224, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.left-sidebar {
  width: 180px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 15px;
  background: rgba(64, 224, 255, 0.1);
  border-bottom: 1px solid rgba(64, 224, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-line {
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #40e0ff, #1e90ff);
  border-radius: 2px;
}

.sidebar-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.sidebar-menu {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.menu-item:hover {
  background: rgba(64, 224, 255, 0.1);
  color: #ffffff;
}

.menu-item.active {
  background: rgba(64, 224, 255, 0.2);
  color: #40e0ff;
  border: 1px solid rgba(64, 224, 255, 0.3);
}

.menu-icon {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.asset-icon { background: linear-gradient(135deg, #40e0ff, #1e90ff); }
.time-icon { background: linear-gradient(135deg, #feca57, #ff9ff3); }
.region-icon { background: linear-gradient(135deg, #48dbfb, #0abde3); }

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-row {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  padding: 12px 15px;
  background: rgba(64, 224, 255, 0.1);
  border-bottom: 1px solid rgba(64, 224, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.panel-title {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
}

.panel-content {
  flex: 1;
  padding: 15px;
  overflow: hidden;
  position: relative;
}

.floating-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.decoration-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(64, 224, 255, 0.2), transparent);
  animation: orbFloat 8s ease-in-out infinite;
}

.orb-1 { width: 80px; height: 80px; top: 10%; right: 20%; }
.orb-2 { width: 60px; height: 60px; bottom: 20%; left: 15%; animation-delay: 3s; }
.orb-3 { width: 70px; height: 70px; top: 60%; right: 10%; animation-delay: 6s; }

@keyframes orbFloat {
  0%, 100% { transform: translateY(0px); opacity: 0.3; }
  50% { transform: translateY(-15px); opacity: 0.6; }
}

@media (max-width: 1200px) {
  .content-row { flex-direction: column; }
}
</style>
