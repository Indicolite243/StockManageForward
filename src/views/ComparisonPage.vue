<template>
  <div class="comparison-page">
    <div class="grid-background"></div>

    <div class="content-wrapper">
      <div class="left-sidebar glass-panel">
        <div class="sidebar-header">
          <div class="header-line"></div>
          <h3 class="sidebar-title">对比评估</h3>
        </div>

        <div class="sidebar-menu">
          <div class="menu-item" :class="{ active: activeMenu === 'asset' }" @click="setActiveMenu('asset')">
            <div class="menu-icon asset-icon"></div>
            <span>资产对比</span>
          </div>
          <div class="menu-item" :class="{ active: activeMenu === 'time' }" @click="setActiveMenu('time')">
            <div class="menu-icon time-icon"></div>
            <span>时间段对比</span>
          </div>
          <div class="menu-item" :class="{ active: activeMenu === 'region' }" @click="setActiveMenu('region')">
            <div class="menu-icon region-icon"></div>
            <span>分市场对比</span>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="content-row top-row">
          <div class="content-panel glass-panel chart-panel">
            <div class="panel-header">
              <div class="header-line"></div>
              <h4 class="panel-title">
                <i class="title-icon chart-icon"></i>
                数据可视化
              </h4>
              <div class="header-tools">
                <el-select v-model="pendingComparisonDataSource" size="small" style="width: 140px">
                  <el-option label="QMT实时" value="qmt" />
                  <el-option label="MongoDB缓存" value="mongodb" />
                </el-select>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="pendingComparisonDataSource === comparisonDataSource"
                  @click="confirmComparisonSourceChange"
                >
                  确认
                </el-button>
                <span class="source-state">已生效：{{ appliedComparisonSourceLabel }}</span>
                <span class="source-state pending" v-if="pendingComparisonDataSource !== comparisonDataSource">
                  待切换：{{ pendingComparisonSourceLabel }}
                </span>
                <span class="source-meta" v-if="comparisonSourceMetaText">{{ comparisonSourceMetaText }}</span>
                <div class="status-indicator"></div>
              </div>
            </div>
            <div class="panel-content">
              <ComparisonChart ref="comparisonChart" :chart-type="getChartType()" />
            </div>
          </div>

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
              <RiskThreshold :data="riskThresholdData" :meta="riskThresholdMeta" />
            </div>
          </div>
        </div>

        <div class="content-row bottom-row">
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

    <div class="floating-decorations">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
      <div class="decoration-orb orb-3"></div>
    </div>
  </div>
</template>

<script>
import ComparisonChart from '@/components/comparison/ComparisonChart.vue'
import RiskThreshold from '@/components/comparison/RiskThreshold.vue'
import ComparisonTable from '@/components/comparison/ComparisonTable.vue'
import RiskWarning from '@/components/comparison/RiskWarning.vue'
import { fetchRiskAssessment } from '@/api/riskThresholdApi.js'
import { fetchAssetComparison, fetchYearlyComparisonData, fetchAreaComparison } from '@/api/comparisonModuleApi.js'

export default {
  name: 'ComparisonPage',
  components: { ComparisonChart, RiskThreshold, ComparisonTable, RiskWarning },
  data() {
    return {
      activeMenu: 'asset',
      comparisonDataSource: 'qmt',
      pendingComparisonDataSource: 'qmt',
      comparisonSourceMeta: {
        data_source: '',
        snapshot_time: '',
        fallback_reason: ''
      },
      comparisonRequestId: 0,
      riskThresholdData: [],
      riskThresholdMeta: {},
      refreshTimer: null,
      riskWarnings: [
        {
          level: 'normal',
          message: '系统运行正常',
          time: new Date().toLocaleString(),
          action: '继续监控'
        }
      ]
    }
  },
  async mounted() {
    this.pendingComparisonDataSource = this.comparisonDataSource
    await this.loadRiskThresholdData()
    this.refreshAllData()
    this.startRefreshTimer()
  },
  beforeUnmount() {
    this.stopRefreshTimer()
  },
  methods: {
    startRefreshTimer() {
      if (this.refreshTimer) return
      this.refreshTimer = setInterval(() => {
        if (this.comparisonDataSource !== 'qmt') return
        this.refreshAllData()
      }, 5000)
    },
    stopRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    async confirmComparisonSourceChange() {
      if (this.pendingComparisonDataSource === this.comparisonDataSource) return
      this.comparisonDataSource = this.pendingComparisonDataSource
      this.comparisonSourceMeta = {
        data_source: '',
        snapshot_time: '',
        fallback_reason: ''
      }
      await this.refreshAllData()
    },
    async refreshAllData() {
      const currentRequestId = ++this.comparisonRequestId
      const requestedSource = this.comparisonDataSource
      let currentAccountId = '62283925'
      if (this.$refs.comparisonTable && this.$refs.comparisonTable.selectedAccount) {
        currentAccountId = this.$refs.comparisonTable.selectedAccount
      }

      try {
        let rawData = null
        if (this.activeMenu === 'asset') {
          rawData = await fetchAssetComparison(currentAccountId, requestedSource)
        } else if (this.activeMenu === 'time') {
          rawData = await fetchYearlyComparisonData(currentAccountId, 'mongodb')
        } else if (this.activeMenu === 'region') {
          rawData = await fetchAreaComparison(currentAccountId, requestedSource)
        }
        if (!rawData) return
        if (currentRequestId !== this.comparisonRequestId || requestedSource !== this.comparisonDataSource) {
          return
        }

        this.comparisonSourceMeta = {
          data_source: rawData.data_source || (this.activeMenu === 'time' ? 'mongodb_history' : ''),
          snapshot_time: rawData.snapshot_time || rawData.latest_time || '',
          fallback_reason: rawData.fallback_reason || ''
        }

        if (this.$refs.comparisonChart && typeof this.$refs.comparisonChart.setData === 'function') {
          this.$refs.comparisonChart.setData(rawData, currentAccountId)
        }
        if (this.$refs.comparisonTable && typeof this.$refs.comparisonTable.setData === 'function') {
          this.$refs.comparisonTable.setData(rawData)
        }
        if (this.activeMenu === 'asset' && this.$refs.riskWarning && typeof this.$refs.riskWarning.setData === 'function') {
          this.$refs.riskWarning.setData(rawData)
        }
      } catch (error) {
        console.error('刷新对比评估数据失败:', error)
      }
    },
    async loadRiskThresholdData(accountId = '62283925') {
      try {
        const data = await fetchRiskAssessment(accountId, 30)
        this.riskThresholdData = data.risk_indicators || []
        this.riskThresholdMeta = data.meta || {}
      } catch (error) {
        console.error('获取风险阈值失败:', error)
        this.riskThresholdData = []
        this.riskThresholdMeta = {}
      }
    },
    setActiveMenu(menu) {
      if (this.activeMenu === menu) return
      this.activeMenu = menu
      this.$nextTick(() => {
        this.refreshAllData()
      })
    },
    getChartType() { return this.activeMenu },
    getTableType() { return this.activeMenu },
    handleAccountChange(accountId) {
      this.refreshAllData()
      this.loadRiskThresholdData(accountId)
    }
  },
  computed: {
    appliedComparisonSourceLabel() {
      return this.comparisonDataSource === 'qmt' ? 'QMT实时' : 'MongoDB缓存'
    },
    pendingComparisonSourceLabel() {
      return this.pendingComparisonDataSource === 'qmt' ? 'QMT实时' : 'MongoDB缓存'
    },
    comparisonSourceMetaText() {
      const effectiveSource = this.comparisonSourceMeta?.data_source || (this.comparisonDataSource === 'qmt' ? 'qmt_live' : 'mongodb_cache')
      const isRealtime = effectiveSource === 'qmt_live'
      const sourceName = isRealtime ? 'QMT实时' : 'MongoDB缓存'
      const timeLabel = isRealtime ? '实时数据时间' : '缓存数据时间'
      const timeText = this.comparisonSourceMeta.snapshot_time
        ? `${timeLabel} ${String(this.comparisonSourceMeta.snapshot_time).replace('T', ' ')}`
        : '等待加载数据'
      const fallbackText = this.comparisonSourceMeta.fallback_reason ? ' · 当前为回退缓存' : ''
      return [sourceName, timeText].filter(Boolean).join(' · ') + fallbackText
    }
  }
}
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
  inset: 0;
  background-image: linear-gradient(rgba(64, 224, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(64, 224, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}
@keyframes gridMove { 0% { transform: translate(0, 0); } 100% { transform: translate(50px, 50px); } }
.content-wrapper { position: relative; width: 100%; height: 100%; display: flex; gap: 20px; z-index: 3; }
.glass-panel { position: relative; background: rgba(12, 20, 38, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(64, 224, 255, 0.3); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); overflow: hidden; transition: all 0.3s ease; }
.left-sidebar { width: 180px; min-width: 180px; display: flex; flex-direction: column; }
.sidebar-header, .panel-header { padding: 12px 15px; background: rgba(64, 224, 255, 0.1); border-bottom: 1px solid rgba(64, 224, 255, 0.2); display: flex; align-items: center; gap: 8px; }
.header-line { width: 3px; height: 16px; background: linear-gradient(180deg, #40e0ff, #1e90ff); border-radius: 2px; }
.sidebar-title, .panel-title { margin: 0; font-size: 14px; font-weight: 600; color: #ffffff; }
.sidebar-menu { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.menu-item { display: flex; align-items: center; gap: 10px; padding: 12px 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; color: rgba(255, 255, 255, 0.7); font-size: 13px; }
.menu-item:hover { background: rgba(64, 224, 255, 0.1); color: #ffffff; }
.menu-item.active { background: rgba(64, 224, 255, 0.2); color: #40e0ff; border: 1px solid rgba(64, 224, 255, 0.3); }
.menu-icon { width: 12px; height: 12px; border-radius: 2px; }
.asset-icon { background: linear-gradient(135deg, #40e0ff, #1e90ff); }
.time-icon { background: linear-gradient(135deg, #feca57, #ff9ff3); }
.region-icon { background: linear-gradient(135deg, #48dbfb, #0abde3); }
.main-content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.content-row { flex: 1; display: flex; gap: 20px; min-height: 0; }
.content-panel { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.panel-title { flex: 1; display: flex; align-items: center; gap: 6px; }
.header-tools { display: flex; align-items: center; gap: 10px; }
.source-state { font-size: 12px; color: rgba(255, 255, 255, 0.9); white-space: nowrap; }
.source-state.pending { color: rgba(255, 220, 120, 0.95); }
.source-meta { font-size: 12px; color: rgba(255, 255, 255, 0.82); white-space: nowrap; }
.status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 8px #00ff88; }
.panel-content { flex: 1; padding: 15px; overflow: hidden; position: relative; }
.floating-decorations { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.decoration-orb { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(64, 224, 255, 0.2), transparent); animation: orbFloat 8s ease-in-out infinite; }
.orb-1 { width: 80px; height: 80px; top: 10%; right: 20%; }
.orb-2 { width: 60px; height: 60px; bottom: 20%; left: 15%; animation-delay: 3s; }
.orb-3 { width: 70px; height: 70px; top: 60%; right: 10%; animation-delay: 6s; }
@keyframes orbFloat { 0%,100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-15px); opacity: 0.6; } }
@media (max-width: 1200px) { .content-row { flex-direction: column; } }
</style>
