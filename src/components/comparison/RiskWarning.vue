<template>
  <div class="attribution-panel">
    <template v-if="hasData">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">组合市值</div>
          <div class="summary-value">{{ formatCurrency(summary.totalMarketValue) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">浮动盈亏</div>
          <div class="summary-value" :class="valueClass(summary.totalPnlAmount)">
            {{ formatSignedCurrency(summary.totalPnlAmount) }}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">正贡献个股</div>
          <div class="summary-value">{{ summary.positiveCount }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">主导行业</div>
          <div class="summary-value small">{{ summary.leadingIndustry }}</div>
        </div>
      </div>

      <div class="top-contributors-grid">
        <div class="card-section">
          <div class="section-title">正贡献 Top 5</div>
          <div v-if="topPositive.length" class="stock-list">
            <div v-for="item in topPositive" :key="`pos-${item.stockCode}`" class="stock-row">
              <div class="stock-main">
                <div class="stock-name">{{ item.stockName }}</div>
                <div class="stock-meta">{{ item.industry }} · 权重 {{ formatPercent(item.weightPct) }}</div>
              </div>
              <div class="stock-metrics positive">
                <div>{{ formatSignedPercent(item.contributionPct) }}</div>
                <div class="metric-sub">{{ formatSignedPercent(item.returnRate) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-inline">暂无正贡献个股</div>
        </div>

        <div class="card-section">
          <div class="section-title">负贡献 Top 5</div>
          <div v-if="topNegative.length" class="stock-list">
            <div v-for="item in topNegative" :key="`neg-${item.stockCode}`" class="stock-row">
              <div class="stock-main">
                <div class="stock-name">{{ item.stockName }}</div>
                <div class="stock-meta">{{ item.industry }} · 权重 {{ formatPercent(item.weightPct) }}</div>
              </div>
              <div class="stock-metrics negative">
                <div>{{ formatSignedPercent(item.contributionPct) }}</div>
                <div class="metric-sub">{{ formatSignedPercent(item.returnRate) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-inline">暂无负贡献个股</div>
        </div>
      </div>

      <div class="card-section attribution-meta-panel">
        <div class="attribution-meta">
          <span>样本个股 {{ attributionRows.length }} 只</span>
          <span>数据来源 {{ sourceLabel }}</span>
          <span v-if="snapshotTime">数据时间 {{ snapshotTime }}</span>
        </div>
      </div>

      <div class="card-section industry-section">
        <div class="industry-title-bar">行业贡献</div>
        <div v-if="industryRows.length" class="industry-list">
          <div v-for="industry in industryRows" :key="industry.name" class="industry-row">
            <div class="industry-header">
              <span class="industry-name">{{ industry.name }}</span>
              <span class="industry-value" :class="valueClass(industry.contributionPct)">
                {{ formatSignedPercent(industry.contributionPct) }}
              </span>
            </div>
            <div class="industry-bar-track">
              <div
                class="industry-bar"
                :class="valueClass(industry.contributionPct)"
                :style="industryBarStyle(industry.contributionPct)"
              ></div>
            </div>
          </div>
        </div>
        <div v-else class="empty-inline">暂无行业归因数据</div>
      </div>
    </template>

    <div v-else class="empty-state">
      <div class="empty-title">暂无业绩归因数据</div>
      <div class="empty-text">切换到资产对比并加载持仓后，这里会展示个股与行业贡献。</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RiskWarning',
  props: {
    warnings: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      attributionRows: [],
      industryRows: [],
      summary: {
        totalMarketValue: 0,
        totalPnlAmount: 0,
        positiveCount: 0,
        negativeCount: 0,
        leadingIndustry: '--'
      },
      sourceLabel: '--',
      snapshotTime: ''
    }
  },
  computed: {
    hasData() {
      return this.attributionRows.length > 0
    },
    topPositive() {
      return this.attributionRows
        .filter((item) => item.contributionPct > 0)
        .sort((a, b) => b.contributionPct - a.contributionPct)
        .slice(0, 5)
    },
    topNegative() {
      return this.attributionRows
        .filter((item) => item.contributionPct < 0)
        .sort((a, b) => a.contributionPct - b.contributionPct)
        .slice(0, 5)
    },
    maxIndustryContributionAbs() {
      const values = this.industryRows.map((item) => Math.abs(item.contributionPct))
      return values.length ? Math.max(...values, 0.01) : 0.01
    }
  },
  methods: {
    setData(rawData) {
      if (!rawData) {
        this.resetState()
        return
      }

      const positions = Array.isArray(rawData.asset_data)
        ? rawData.asset_data
        : Array.isArray(rawData.positions)
          ? rawData.positions
          : []

      if (!positions.length) {
        this.resetState(rawData)
        return
      }

      const totalMarketValue =
        Number(rawData.total_market_value || 0) ||
        positions.reduce((sum, item) => sum + Number(item.market_value || 0), 0)

      const rows = positions
        .map((item) => {
          const stockCode = item.stock_code || ''
          const stockName = item.stock_name || stockCode || '--'
          const industry = item.industry || item.industry_name || '未分类'
          const currentPrice = Number(item.current_price || item.open_price || item.lastPrice || 0)
          const costPrice = Number(item.cost_price || item.avg_price || item.open_price || 0)
          const volume = Number(item.volume || 0)
          const marketValue = Number(item.market_value || 0)
          const returnRate = Number(
            item.profit_loss_rate ??
              item.daily_return ??
              (costPrice > 0 && currentPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0)
          )
          const pnlAmount =
            volume > 0 && costPrice > 0 ? (currentPrice - costPrice) * volume : marketValue * (returnRate / 100)
          const weightPct = Number(
            item.asset_ratio ??
              item.percentage ??
              (totalMarketValue > 0 ? (marketValue / totalMarketValue) * 100 : 0)
          )
          const contributionPct = totalMarketValue > 0 ? (pnlAmount / totalMarketValue) * 100 : 0

          return {
            stockCode,
            stockName,
            industry,
            currentPrice,
            costPrice,
            volume,
            marketValue,
            returnRate,
            pnlAmount,
            weightPct,
            contributionPct
          }
        })
        .sort((a, b) => Math.abs(b.contributionPct) - Math.abs(a.contributionPct))

      const industryMap = new Map()
      rows.forEach((row) => {
        if (!industryMap.has(row.industry)) {
          industryMap.set(row.industry, {
            name: row.industry,
            contributionPct: 0,
            pnlAmount: 0,
            marketValue: 0,
            count: 0
          })
        }
        const bucket = industryMap.get(row.industry)
        bucket.contributionPct += row.contributionPct
        bucket.pnlAmount += row.pnlAmount
        bucket.marketValue += row.marketValue
        bucket.count += 1
      })

      const industryRows = Array.from(industryMap.values()).sort(
        (a, b) => Math.abs(b.contributionPct) - Math.abs(a.contributionPct)
      )
      const positiveCount = rows.filter((item) => item.contributionPct > 0).length
      const negativeCount = rows.filter((item) => item.contributionPct < 0).length
      const totalPnlAmount = rows.reduce((sum, item) => sum + item.pnlAmount, 0)
      const leadingIndustry = industryRows.length ? industryRows[0].name : '--'

      this.attributionRows = rows
      this.industryRows = industryRows
      this.summary = {
        totalMarketValue,
        totalPnlAmount,
        positiveCount,
        negativeCount,
        leadingIndustry
      }
      this.sourceLabel = this.resolveSourceLabel(rawData.data_source)
      this.snapshotTime = rawData.snapshot_time ? String(rawData.snapshot_time).replace('T', ' ') : ''
    },
    resetState(rawData = null) {
      this.attributionRows = []
      this.industryRows = []
      this.summary = {
        totalMarketValue: 0,
        totalPnlAmount: 0,
        positiveCount: 0,
        negativeCount: 0,
        leadingIndustry: '--'
      }
      this.sourceLabel = rawData ? this.resolveSourceLabel(rawData.data_source) : '--'
      this.snapshotTime = rawData?.snapshot_time ? String(rawData.snapshot_time).replace('T', ' ') : ''
    },
    resolveSourceLabel(source) {
      if (source === 'qmt_live') return 'QMT实时'
      if (source === 'mongodb_cache') return 'MongoDB缓存'
      if (source === 'mongodb_history') return 'MongoDB历史快照'
      return '--'
    },
    valueClass(value) {
      if (value > 0) return 'positive'
      if (value < 0) return 'negative'
      return 'neutral'
    },
    industryBarStyle(value) {
      const width = `${Math.max(6, (Math.abs(value) / this.maxIndustryContributionAbs) * 100)}%`
      return { width }
    },
    formatCurrency(value) {
      return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    },
    formatSignedCurrency(value) {
      const amount = Number(value || 0)
      const prefix = amount > 0 ? '+' : ''
      return `${prefix}${amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
    },
    formatSignedPercent(value) {
      const amount = Number(value || 0)
      const prefix = amount > 0 ? '+' : ''
      return `${prefix}${amount.toFixed(2)}%`
    },
    formatPercent(value) {
      return `${Number(value || 0).toFixed(2)}%`
    }
  }
}
</script>

<style scoped>
.attribution-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #ffffff;
  overflow-y: auto;
  padding-right: 4px;
  box-sizing: border-box;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card,
.card-section {
  background: rgba(21, 31, 56, 0.72);
  border: 1px solid rgba(64, 224, 255, 0.14);
  border-radius: 12px;
  box-shadow: inset 0 0 18px rgba(64, 224, 255, 0.05);
}

.summary-card {
  padding: 12px 14px;
}

.summary-label,
.section-title,
.stock-meta,
.attribution-meta {
  color: rgba(255, 255, 255, 0.72);
}

.summary-label {
  font-size: 12px;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #9ad9ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-value.small {
  font-size: 18px;
}

.top-contributors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

.card-section {
  padding: 14px;
  min-height: 0;
}

.section-title {
  font-size: 13px;
  margin-bottom: 12px;
  min-height: 28px;
  display: flex;
  align-items: center;
  line-height: 28px;
  padding: 0 2px;
}

.stock-list,
.industry-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.stock-main {
  min-width: 0;
  flex: 1;
}

.stock-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
  line-height: 1.35;
  word-break: break-all;
}

.stock-meta,
.metric-sub {
  font-size: 12px;
  line-height: 1.4;
}

.stock-metrics {
  text-align: right;
  font-weight: 700;
  min-width: 86px;
  flex-shrink: 0;
}

.industry-section {
  flex: 0 0 auto;
  padding-top: 10px;
}

.industry-title-bar {
  height: 40px;
  min-height: 40px;
  margin: 0 0 14px;
  padding: 0 14px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.03);
  box-sizing: border-box;
}

.industry-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 16px 0 2px;
  box-sizing: border-box;
}

.industry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

.industry-name {
  font-size: 13px;
  color: #ffffff;
}

.industry-value {
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  padding-left: 8px;
  text-align: right;
  padding-right: 2px;
}

.industry-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.industry-bar {
  height: 100%;
  border-radius: 999px;
}

.positive {
  color: #ff8c8c;
}

.negative {
  color: #6ee7a8;
}

.neutral {
  color: #9ad9ff;
}

.industry-bar.positive {
  background: linear-gradient(90deg, rgba(255, 140, 140, 0.35), #ff8c8c);
}

.industry-bar.negative {
  background: linear-gradient(90deg, rgba(110, 231, 168, 0.35), #6ee7a8);
}

.industry-bar.neutral {
  background: linear-gradient(90deg, rgba(154, 217, 255, 0.35), #9ad9ff);
}

.empty-state,
.empty-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
}

.empty-state {
  flex: 1;
  min-height: 220px;
  border: 1px dashed rgba(64, 224, 255, 0.2);
  border-radius: 12px;
  background: rgba(21, 31, 56, 0.4);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #d7f2ff;
}

.empty-text {
  font-size: 12px;
}

.attribution-meta-panel {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.attribution-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 12px;
  line-height: 1;
  min-height: 24px;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  box-sizing: border-box;
}

.attribution-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  line-height: 20px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .top-contributors-grid {
    grid-template-columns: 1fr;
  }
}
</style>
