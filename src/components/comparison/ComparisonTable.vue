<template>
  <div class="comparison-table" v-loading="loading && assetTableData.length === 0">
    <div class="table-header">
      <div class="table-title">{{ getTableTitle() }}</div>

      <!-- 添加账户选择器 -->
      <div class="table-controls">
        <el-select
          v-model="selectedAccount"
          placeholder="请选择账户"
          size="small"
          @change="handleAccountChange"
          class="account-selector"
        >
          <el-option
            v-for="account in accounts"
            :key="account.account_id"
            :label="account.account_id"
            :value="account.account_id"
          />
        </el-select>

        <div class="table-actions">
          <el-button size="small" type="primary" @click="exportData">
            <i class="export-icon"></i>
            导出
          </el-button>
          <el-button size="small" @click="refreshData">
            <i class="refresh-icon"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <div class="table-content">
      <el-table
        :data="tableData"
        row-key="stock_code"
        style="width: 100%"
        height="100%"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        stripe
        fit
      >
        <el-table-column
          v-for="column in tableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth"
          :formatter="column.formatter"
        >
          <!-- 自定义渲染逻辑 -->
          <template #default="{ row, column: col }" v-if="column.prop === 'trend'">
            <div class="trend-cell">
              <div class="trend-indicator" :class="getTrendClass(row[col.property])"></div>
              <span>{{ row[col.property] }}</span>
            </div>
          </template>
          <template #default="{ row, column: col }" v-else-if="column.prop === 'risk'">
            <div class="risk-cell">
              <el-tag :type="getRiskTagType(row[col.property])" size="small">
                {{ row[col.property] }}
              </el-tag>
            </div>
          </template>
          <!-- 默认渲染逻辑：确保非 trend/risk 列也能正常显示 -->
          <template #default="{ row, column: col }" v-else>
            <span :class="{'stock-code-text': column.prop === 'stock_code'}">
              {{ column.formatter ? column.formatter(row, col, row[col.property]) : row[col.property] }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { fetchYearlyComparisonData, fetchAreaComparison } from '@/api/comparisonModuleApi.js';
import { fetchAccountInfo } from '@/api/accountApi.js';

export default {
  name: 'ComparisonTable',
  props: {
    tableType: {
      type: String,
      default: 'asset'
    }
  },
  data() {
    return {
      assetTableData: [],
      timeTableData: [],
      regionTableData: [],
      loading: false,
      selectedAccount: '',
      accounts: [],
      timer: null
    };
  },
  created() {
    this.loadAccounts();
  },
  mounted() {
    // 启动 3 秒定时刷新，与图表同步
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  computed: {
    tableData() {
      switch (this.tableType) {
        case 'asset':
          return this.assetTableData;
        case 'time':
          return this.timeTableData;
        case 'region':
          return this.regionTableData;
        default:
          return [];
      }
    },

    tableColumns() {
      switch (this.tableType) {
        case 'asset':
          return [
            { prop: 'stock_code', label: '股票代码', minWidth: '100' },
            { prop: 'stock_name', label: '股票名称', minWidth: '100' },
            { prop: 'current_price', label: '当前价格', minWidth: '100', formatter: this.formatNumber },
            { prop: 'volume', label: '持仓数量', minWidth: '100', formatter: this.formatNumber },
            { prop: 'market_value', label: '股票市值', minWidth: '120', formatter: this.formatNumber },
            { prop: 'asset_ratio', label: '资产占比(%)', minWidth: '100', formatter: this.formatPercent },
            { prop: 'daily_return', label: '持仓盈亏(%)', minWidth: '100', formatter: this.formatPercent }
          ];
        case 'time':
          return [
            { prop: 'year', label: '年份', minWidth: '100' },
            { prop: 'totalAssets', label: '总资产(元)', minWidth: '150', formatter: this.formatNumber },
            { prop: 'returnRate', label: '回报率(%)', minWidth: '100', formatter: this.formatPercent },
            { prop: 'investmentRate', label: '投资占比(%)', minWidth: '120', formatter: this.formatPercent }
          ];
        case 'region':
          return [
            { prop: 'region', label: '地区', minWidth: '120' },
            { prop: 'totalAssets', label: '总资产(元)', minWidth: '150', formatter: this.formatNumber },
            { prop: 'returnRate', label: '回报率', minWidth: '100' },
            { prop: 'investmentRate', label: '投资占比', minWidth: '120' }
          ];
        default:
          return [];
      }
    }
  },
  watch: {
    tableType: {
      handler(newType) {
        console.log(`📊 表格类型切换: ${newType}`);
        this.loadTableData(newType);
      },
      immediate: true
    }
  },
  methods: {
    startPolling() {
      this.timer = setInterval(() => {
        if (this.tableType === 'asset') {
          this.loadAssetData(false);
        }
      }, 3000);
    },

    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    async loadAccounts() {
      this.loading = true;
      try {
        const data = await fetchAccountInfo();
        if (data && data.accounts && data.accounts.length > 0) {
          this.accounts = data.accounts;
          // 优先保留已有选择，否则选第一个
          if (!this.selectedAccount || !this.accounts.some(a => a.account_id === this.selectedAccount)) {
            this.selectedAccount = this.accounts[0].account_id;
          }
          await this.loadTableData(this.tableType, false);
        } else {
          console.warn('⚠️ 资产对比表格: 未获取到账户列表');
        }
      } catch (error) {
        console.error('❌ 获取账户列表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    handleAccountChange() {
      this.loadTableData(this.tableType, true);
      this.$emit('account-changed', this.selectedAccount);
    },

    async loadTableData(type, showLoading = true) {
      if (!this.selectedAccount && type === 'asset') {
        // 如果是资产对比但没选账户，先加载账户
        await this.loadAccounts();
        return;
      }

      if (showLoading) this.loading = true;

      try {
        switch (type) {
          case 'asset':
            await this.loadAssetData(false); // loadTableData 已经处理了 loading
            break;
          case 'time':
            await this.loadTimeData();
            break;
          case 'region':
            await this.loadRegionData();
            break;
        }
      } catch (error) {
        console.error(`❌ 加载${type}表格数据失败:`, error);
      } finally {
        if (showLoading) this.loading = false;
      }
    },

    async loadAssetData(showLoading = true) {
      if (showLoading) this.loading = true;
      try {
        const data = await fetchAccountInfo();
        if (!data || !data.accounts || data.accounts.length === 0) return;

        // 同步更新账户列表，确保下拉框数据最新
        this.accounts = data.accounts;

        // 如果当前没选账户，自动选第一个
        if (!this.selectedAccount) {
          this.selectedAccount = data.accounts[0].account_id;
        }

        const targetAccountId = this.selectedAccount;
        const account = data.accounts.find(acc => acc.account_id === targetAccountId);

        if (!account) {
          console.warn(`未找到账户: ${targetAccountId}`);
          return;
        }

        const positions = account.positions || [];
        const totalMarketValue = Number(account.market_value) || positions.reduce((sum, p) => sum + Number(p.market_value), 0);

        const processedData = positions.map(pos => {
          const currentPrice = Number(pos.open_price) || 0;
          const costPrice = Number(pos.avg_price) || 0;
          const marketValue = Number(pos.market_value) || 0;
          const assetRatio = totalMarketValue > 0 ? (marketValue / totalMarketValue * 100) : 0;
          const profitLossRate = costPrice > 0 ? ((currentPrice - costPrice) / costPrice * 100) : 0;

          return {
            stock_code: pos.stock_code,
            stock_name: pos.stock_name,
            current_price: currentPrice,
            volume: Number(pos.volume),
            market_value: marketValue,
            asset_ratio: assetRatio.toFixed(2),
            daily_return: profitLossRate.toFixed(2)
          };
        });

        processedData.sort((a, b) => b.market_value - a.market_value);
        this.assetTableData = processedData;

      } catch (error) {
        console.error('❌ 获取资产对比表格数据失败:', error);
      }
    },

    async loadTimeData() {
      try {
        const data = await fetchYearlyComparisonData(this.selectedAccount);
        this.timeTableData = data.yearly_data || [];
      } catch (error) {
        console.error('❌ 获取年度对比表格数据失败:', error);
        this.timeTableData = [];
      }
    },

    async loadRegionData() {
      try {
        const data = await fetchAreaComparison(this.selectedAccount);
        this.regionTableData = data.region_data || [];
      } catch (error) {
        console.error('❌ 获取地区对比表格数据失败:', error);
        this.regionTableData = [];
      }
    },

    getTableTitle() {
      const titleMap = {
        asset: '资产对比数据',
        time: '时间段对比数据',
        region: '分市场对比数据'
      };
      return titleMap[this.tableType] || '对比数据';
    },

    formatNumber(row, column, cellValue) {
      if (cellValue === null || cellValue === undefined || cellValue === '') return '-';
      return Number(cellValue).toLocaleString();
    },

    formatPercent(row, column, cellValue) {
      if (cellValue === null || cellValue === undefined || cellValue === '') return '-';
      return `${cellValue}%`;
    },

    getTrendClass(trend) {
      const trendMap = {
        '牛式': 'trend-up',
        '熊式': 'trend-down',
        '震荡': 'trend-stable'
      };
      return trendMap[trend] || 'trend-stable';
    },

    getRiskTagType(risk) {
      const riskMap = {
        '低': 'success',
        '中': 'warning',
        '高': 'danger'
      };
      return riskMap[risk] || 'info';
    },

    headerCellStyle() {
      return {
        backgroundColor: 'rgba(64, 224, 255, 0.15)',
        color: '#40e0ff',
        fontWeight: 'bold',
        fontSize: '12px',
        padding: '10px 0',
        borderBottom: '1px solid rgba(64, 224, 255, 0.3)'
      };
    },

    cellStyle() {
      return {
        backgroundColor: 'transparent',
        color: '#ffffff',
        fontSize: '11px',
        padding: '8px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      };
    },

    exportData() {
      console.log('导出数据:', this.tableData);
    },

    async refreshData() {
      await this.loadTableData(this.tableType);
    },
  }
};
</script>

<style scoped>
.comparison-table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
}

.table-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.account-selector {
  width: 140px;
}

.table-content {
  flex: 1;
  overflow: hidden;
}

.stock-code-text {
  color: #40e0ff;
  font-weight: 500;
}

.trend-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trend-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.trend-up { background: #00ff88; }
.trend-down { background: #ff6b6b; }
.trend-stable { background: #feca57; }

/* Table Overrides */
:deep(.el-table) {
  background-color: transparent !important;
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background-color: rgba(255, 255, 255, 0.02) !important;
}

:deep(.el-table__row:hover td.el-table__cell) {
  background-color: rgba(64, 224, 255, 0.05) !important;
}

:deep(.el-button) {
  background: rgba(64, 224, 255, 0.1) !important;
  border: 1px solid rgba(64, 224, 255, 0.3) !important;
  color: #40e0ff !important;
}

:deep(.el-button--primary) {
  background: rgba(64, 224, 255, 0.2) !important;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(12, 20, 38, 0.8) !important;
  box-shadow: 0 0 0 1px rgba(64, 224, 255, 0.2) inset !important;
}

:deep(.el-select .el-input__inner) {
  color: #ffffff !important;
}
</style>
