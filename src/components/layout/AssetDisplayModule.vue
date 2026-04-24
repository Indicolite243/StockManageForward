<template>
  <div class="left-aside">
    <div class="asset-display-module">
      <div class="title">所有账户总资产数据</div>

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

async function loadAccountData() {
  try {
    const data = await fetchAccountInfo()
    if (!data?.accounts?.length) return

    const previousSelected = selectedAccount.value
    accounts.value = data.accounts.map(account => {
      const initialTotalAsset = 10000000
      const totalReturnRate = initialTotalAsset
        ? ((Number(account.total_asset) - initialTotalAsset) / initialTotalAsset) * 100
        : 0

      const totalPositions = Array.isArray(account.positions)
        ? account.positions.reduce((sum, pos) => sum + Number(pos.volume || 0), 0)
        : 0

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
    console.error('获取账户信息失败:', error)
  }
}

function handleAccountChange(accountId) {
  selectedAccount.value = accountId
}

const selectedAccountData = computed(() => {
  const account = accounts.value.find(item => item.account_id === selectedAccount.value)
  if (!account) return []

  return [
    {
      account_id: account.account_id,
      total_asset: formatNumber(account.total_asset),
      cash: formatNumber(account.cash),
      frozen_cash: formatNumber(account.market_value),
      total_return_rate: account.total_return_rate,
      total_positions: formatNumber(account.total_positions, 0),
      market_value: formatNumber(account.market_value)
    }
  ]
})

const selectedStocks = computed(() => {
  const account = accounts.value.find(item => item.account_id === selectedAccount.value)
  if (!account?.positions?.length) return []

  return [...account.positions]
    .sort((a, b) => Number(b.market_value || 0) - Number(a.market_value || 0))
    .slice(0, 10)
    .map(position => ({
      stock_code: position.stock_code,
      open_price: formatNumber(position.open_price),
      volume: formatNumber(position.volume, 0),
      avg_price: formatNumber(position.avg_price),
      market_value: formatNumber(position.market_value)
    }))
})

onMounted(() => {
  loadAccountData()
  timer = setInterval(loadAccountData, 5000)
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
