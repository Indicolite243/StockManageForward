<template>
  <div class="strategy-result">
    <div class="title">策略执行结果</div>

    <div class="result-content">
      <ChartSection class="transaction-curve" />

      <div class="key-metrics">
        <div class="title">关键指标</div>
        <el-table
          :data="keyMetrics"
          border
          style="width: 100%"
          :header-cell-style="headerStyle"
        >
          <el-table-column prop="metricName" label="指标名称" />
          <el-table-column prop="metricValue" label="指标值" />
          <el-table-column prop="description" label="描述" />
        </el-table>
      </div>

      <div class="execution-meta">
        <div class="title">本次执行信息</div>
        <el-table
          :data="executionInfo"
          border
          style="width: 100%"
          :header-cell-style="headerStyle"
        >
          <el-table-column prop="label" label="项目" width="180" />
          <el-table-column prop="value" label="内容" />
        </el-table>
      </div>

      <el-button type="primary" class="download-button" @click="downloadReport">
        查看并下载执行报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ChartSection from './ChartSection.vue'

const defaultMetrics = [
  { metricName: '策略收益率', metricValue: '--', description: '当前策略累计收益率' },
  { metricName: '基准收益率', metricValue: '--', description: '当前基准累计收益率' },
  { metricName: '策略年化收益率', metricValue: '--', description: '策略年化投资回报率' },
  { metricName: '基准年化收益率', metricValue: '--', description: '基准年化投资回报率' },
  { metricName: '最大回撤', metricValue: '--', description: '历史最大回撤幅度' },
  { metricName: '夏普比率', metricValue: '--', description: '风险调整后收益指标' }
]

const defaultExecutionInfo = [
  { label: '请求编号', value: '--' },
  { label: '上传文件', value: '待上传' },
  { label: '请求引擎', value: '待选择' },
  { label: '实际执行器', value: '待执行' },
  { label: '策略格式', value: '--' },
  { label: '解析引擎', value: '--' },
  { label: '基准代码', value: '--' },
  { label: '熊市保护', value: '--' },
  { label: '滑点', value: '--' },
  { label: '手续费率', value: '--' },
  { label: '成交量限制比例', value: '--' },
  { label: '报告路径', value: '待生成' },
  { label: '交易明细路径', value: '待生成' }
]

const keyMetrics = ref([...defaultMetrics])
const executionInfo = ref([...defaultExecutionInfo])

const metricMapping = [
  ['策略收益率', 'total_return', '当前策略累计收益率'],
  ['基准收益率', 'benchmark_return', '当前基准累计收益率'],
  ['策略年化收益率', 'annual_return', '策略年化投资回报率'],
  ['基准年化收益率', 'benchmark_annual_return', '基准年化投资回报率'],
  ['最大回撤', 'max_drawdown', '历史最大回撤幅度'],
  ['夏普比率', 'sharpe_ratio', '风险调整后收益指标'],
  ['Sortino 比率', 'sortino_ratio', '仅考虑下行波动的风险收益指标'],
  ['Alpha', 'alpha', '相对基准的超额收益能力'],
  ['Beta', 'beta', '相对基准的波动敏感度'],
  ['波动率', 'volatility', '策略收益年化波动率'],
  ['跟踪误差', 'tracking_error', '策略相对基准的偏离程度'],
  ['信息比率', 'information_ratio', '超额收益相对跟踪误差的比值'],
  ['下行风险', 'downside_risk', '仅统计下行波动的风险尺度'],
  ['胜率', 'win_rate', '正收益交易日占比'],
  ['期末净值', 'final_net_value', '回测结束时组合总资产'],
  ['成交笔数', 'trade_count', '回测期间总成交笔数'],
  ['买入笔数', 'buy_trade_count', '回测期间买入成交笔数'],
  ['卖出笔数', 'sell_trade_count', '回测期间卖出成交笔数'],
  ['换手率', 'turnover_ratio', '累计成交金额相对初始资金的比值'],
  ['总手续费', 'total_commission', '回测期间累计交易费用']
]

function headerStyle() {
  return {
    backgroundColor: 'rgba(64, 224, 255, 0.2)',
    color: '#000000',
    fontWeight: 'bold',
    padding: '8px 0',
    textAlign: 'center',
    borderBottom: '1px solid rgba(64, 224, 255, 0.3)'
  }
}

function buildMetricRows(metrics = {}) {
  const rows = metricMapping
    .filter(([, key]) => key in metrics)
    .map(([metricName, key, description]) => ({
      metricName,
      metricValue: metrics[key] ?? '--',
      description
    }))

  return rows.length ? rows : [...defaultMetrics]
}

function buildExecutionInfo(meta = {}) {
  const engineInfo = meta.engine_info || {}
  const artifacts = meta.artifacts || {}
  const rows = [
    ['请求编号', meta.request_id],
    ['上传文件', meta.uploaded_filename],
    ['请求引擎', meta.requested_engine],
    ['实际执行器', meta.executor_type],
    ['策略格式', meta.strategy_format],
    ['解析引擎', meta.resolved_engine],
    ['基准代码', meta.benchmark_symbol],
    ['熊市保护', meta.bear_protection_enabled ? '开启' : '关闭'],
    ['滑点', engineInfo.slippage_perc],
    ['手续费率', engineInfo.commission_rate],
    ['成交量限制比例', engineInfo.volume_limit_ratio],
    ['报告路径', artifacts.markdown_report],
    ['交易明细路径', artifacts.trade_excel]
  ]

  const mappedRows = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({
      label,
      value: String(value)
    }))

  return mappedRows.length ? mappedRows : [...defaultExecutionInfo]
}

function handleExecutionStarted(event) {
  const payload = event.detail || {}
  keyMetrics.value = buildMetricRows(payload.metrics || {})
  executionInfo.value = buildExecutionInfo(payload.execution_meta || {})
}

function downloadReport() {
  window.open('/api/download-strategy-report/', '_blank')
}

onMounted(() => {
  window.addEventListener('strategy-execution-started', handleExecutionStarted)
})

onBeforeUnmount(() => {
  window.removeEventListener('strategy-execution-started', handleExecutionStarted)
})
</script>

<style scoped>
.strategy-result {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
}

.title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #000000;
  text-shadow: 0 0 8px rgba(64, 224, 255, 0.6);
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 224, 255, 0.2);
  border-radius: 6px;
  overflow-y: auto;
}

.transaction-curve {
  min-height: 420px;
  flex-shrink: 0;
}

.download-button {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(64, 224, 255, 0.32), rgba(30, 144, 255, 0.34)) !important;
  color: #ffffff !important;
}

:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table tr),
:deep(.el-table td.el-table__cell) {
  background-color: #ffffff !important;
  color: #000000 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(64, 224, 255, 0.2) !important;
  color: #000000 !important;
  border-bottom: 1px solid rgba(64, 224, 255, 0.3) !important;
  font-weight: bold !important;
}

:deep(.el-table) {
  font-size: 11px;
}
</style>
