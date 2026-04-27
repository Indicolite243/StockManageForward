<template>
  <div class="left-aside">
    <div class="asset-display-module">
      <div class="title">所有账户总资产数据</div>

      <div class="source-bar">
        <span class="source-label">数据源</span>
        <el-select v-model="pendingDataSource" size="small">
          <el-option label="QMT实时" value="qmt" />
          <el-option label="MongoDB缓存" value="mongodb" />
        </el-select>
        <el-button
          size="small"
          type="primary"
          :disabled="pendingDataSource === dataSource"
          @click="confirmSourceChange"
        >
          确认
        </el-button>
        <span class="source-state">已生效：{{ appliedSourceText }}</span>
      </div>

      <div class="select-container">
        <el-select
          v-model="selectedAccount"
          placeholder="请选择账户"
          @change="handleAccountChange"
        >
          <el-option
            v-for="account in accounts"
            :key="account.account_id"
            :label="account.account_id"
            :value="account.account_id"
          />
        </el-select>
      </div>

      <div class="table-container">
        <el-table
          :data="selectedAccountData"
          style="width: 100%"
          border
          :header-cell-style="headerStyle"
          :cell-style="cellStyle"
          :row-class-name="tableRowClassName"
        >
          <el-table-column prop="account_id" label="资金账户" min-width="120" align="center" />
          <el-table-column prop="total_asset" label="总资产" min-width="150" align="right" />
          <el-table-column prop="cash" label="可用金额" min-width="150" align="right" />
          <el-table-column prop="frozen_cash" label="股票/期货持仓市值" min-width="150" align="right" />
          <el-table-column prop="total_return_rate" label="总收益率" min-width="120" align="right" />
          <el-table-column prop="total_positions" label="持仓股票数" min-width="120" align="right" />
          <el-table-column prop="market_value" label="持仓市值" min-width="150" align="right" />
        </el-table>
      </div>
    </div>

    <div class="asset-details">
      <div class="title">账户资产数据详情</div>

      <div class="table-stock">
        <el-table
          :data="selectedStocks"
          style="width: 100%"
          height="420"
          border
          :header-cell-style="headerStyle"
          :cell-style="cellStyle"
          :row-class-name="tableRowClassName"
        >
          <el-table-column prop="stock_code" label="股票代码" min-width="120" align="center" />
          <el-table-column prop="open_price" label="当前价格" min-width="120" align="right" />
          <el-table-column prop="volume" label="持仓数量" min-width="120" align="right" />
          <el-table-column prop="avg_price" label="成本价" min-width="120" align="right" />
          <el-table-column prop="market_value" label="股票市值" min-width="150" align="right" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchAccountInfo } from '@/api/accountApi.js'

const accounts = ref([])
const selectedAccount = ref('')
const dataSource = ref('qmt')
const pendingDataSource = ref('qmt')
const latestMeta = ref({ data_source: '', snapshot_time: '', is_realtime: false, fallback_reason: '' })
const requestId = ref(0)
let timer = null

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

function cellStyle({ column }) {
  return {
    padding: '8px 0',
    textAlign: column.align || 'center',
    color: '#000000',
    backgroundColor: 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }
}

function tableRowClassName({ rowIndex }) {
  return rowIndex % 2 === 0 ? 'even-row' : ''
}

function formatNumber(value, decimals = 2) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return decimals === 0 ? '0' : '0.00'
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const appliedSourceLabel = computed(() => (dataSource.value === 'qmt' ? 'QMT实时' : 'MongoDB缓存'))
const appliedSourceText = computed(() => {
  const timeText = latestMeta.value.snapshot_time ? latestMeta.value.snapshot_time.replace('T', ' ') : ''
  return timeText ? `${appliedSourceLabel.value} ${timeText}` : appliedSourceLabel.value
})

async function loadAccountData() {
  const currentRequestId = ++requestId.value
  const requestedSource = dataSource.value
  try {
    const data = await fetchAccountInfo(requestedSource)
    if (currentRequestId !== requestId.value || requestedSource !== dataSource.value) {
      return
    }

    latestMeta.value = {
      data_source: data.data_source || (requestedSource === 'qmt' ? 'qmt_live' : 'mongodb_cache'),
      snapshot_time: data.snapshot_time || '',
      is_realtime: Boolean(data.is_realtime),
      fallback_reason: ''
    }
    if (!data?.accounts?.length) {
      accounts.value = []
      selectedAccount.value = ''
      return
    }

    const previousSelected = selectedAccount.value
    accounts.value = data.accounts.map(account => {
      const totalReturnRate = Number.isFinite(Number(account.total_return_rate))
        ? Number(account.total_return_rate)
        : 0
      const totalPositions = Number(account.total_positions || 0)
      return {
        ...account,
        total_return_rate: `${totalReturnRate.toFixed(2)}%`,
        total_positions: totalPositions
      }
    })

    if (!previousSelected || !accounts.value.find(item => item.account_id === previousSelected)) {
      selectedAccount.value = accounts.value[0].account_id
    }
  } catch (error) {
    accounts.value = []
    selectedAccount.value = ''
    latestMeta.value = {
      data_source: '',
      snapshot_time: '',
      is_realtime: false,
      fallback_reason: ''
    }
    console.error('获取账户信息失败:', error)
  }
}

function handleAccountChange(accountId) {
  selectedAccount.value = accountId
}

function confirmSourceChange() {
  if (pendingDataSource.value === dataSource.value) return
  dataSource.value = pendingDataSource.value
  accounts.value = []
  selectedAccount.value = ''
  latestMeta.value = { data_source: '', snapshot_time: '', is_realtime: false, fallback_reason: '' }
  loadAccountData()
}

const selectedAccountData = computed(() => {
  const account = accounts.value.find(item => item.account_id === selectedAccount.value)
  if (!account) return []
  return [{
    account_id: account.account_id,
    total_asset: formatNumber(account.total_asset),
    cash: formatNumber(account.cash),
    frozen_cash: formatNumber(account.market_value),
    total_return_rate: account.total_return_rate,
    total_positions: formatNumber(account.total_positions, 0),
    market_value: formatNumber(account.market_value)
  }]
})

const selectedStocks = computed(() => {
  const account = accounts.value.find(item => item.account_id === selectedAccount.value)
  if (!account?.positions?.length) return []
  return [...account.positions]
    .sort((a, b) => Number(b.market_value || 0) - Number(a.market_value || 0))
    .map(position => ({
      stock_code: position.stock_code,
      open_price: formatNumber(position.open_price ?? position.current_price),
      volume: formatNumber(position.volume, 0),
      avg_price: formatNumber(position.avg_price ?? position.cost_price),
      market_value: formatNumber(position.market_value)
    }))
})

onMounted(() => {
  pendingDataSource.value = dataSource.value
  loadAccountData()
  timer = setInterval(() => {
    if (dataSource.value !== 'qmt') return
    loadAccountData()
  }, 5000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.left-aside {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
}

.asset-display-module,
.asset-details {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #000000;
  text-align: center;
  text-shadow: 0 0 10px rgba(64, 224, 255, 0.8);
}

.source-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.source-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.86);
}

.source-state {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.select-container {
  margin-bottom: 10px;
}

.table-container,
.table-stock {
  width: 100%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(64, 224, 255, 0.3);
}

:deep(.el-table) {
  font-size: 12px;
  color: #000000;
  background: transparent;
}
</style>
