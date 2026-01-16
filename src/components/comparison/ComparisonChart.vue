<template>
  <div class="comparison-chart" v-loading="loading && !myChart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import { fetchYearlyComparisonData, fetchAreaComparison } from '@/api/comparisonModuleApi.js';
import { fetchAccountInfo } from '@/api/accountApi.js';

export default {
  name: 'ComparisonChart',
  props: {
    chartType: {
      type: String,
      default: 'asset'
    }
  },
  data() {
    return {
      myChart: null,
      loading: false,
      currentAccountId: null,
      lastOption: null,
      timer: null
    };
  },
  mounted() {
    this.initChart();
    window.addEventListener('resize', this.handleResize);
    // 启动 3 秒定时刷新，获取实时账户持仓并计算占比
    this.startPolling();
  },
  beforeUnmount() {
    this.stopPolling();
    window.removeEventListener('resize', this.handleResize);
    if (this.myChart) {
      this.myChart.dispose();
    }
  },
  watch: {
    chartType: {
      handler(newType) {
        console.log(`📊 切换图表类型为: ${newType}`);
        this.updateChart(null, true);
      },
      immediate: false
    }
  },
  methods: {
    initChart() {
      const chartDom = this.$refs.chartContainer;
      if (!chartDom) return;
      this.myChart = echarts.init(chartDom);
      this.updateChart();
    },

    startPolling() {
      // 每3秒计算一次占比并刷新显示
      this.timer = setInterval(() => {
        this.updateChart(null, false);
      }, 3000);
    },

    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    async updateChart(accountId, forceRefresh = false) {
      if (!this.myChart) return;

      if (accountId) {
        this.currentAccountId = accountId;
      }

      const targetAccountId = accountId || this.currentAccountId;

      // 仅在首次加载或强制刷新时显示 loading
      if (!this.lastOption || forceRefresh) {
        this.loading = true;
      }

      let option = {};

      try {
        if (this.chartType === 'asset') {
          option = await this.getAssetComparisonOption(targetAccountId);
        } else if (this.chartType === 'time') {
          option = await this.getTimeComparisonOption(targetAccountId);
        } else if (this.chartType === 'region') {
          option = await this.getRegionComparisonOption(targetAccountId);
        } else {
          option = await this.getAssetComparisonOption(targetAccountId);
        }

        // 彻底清空之前的标题和配置干扰
        option.title = { show: false };

        // 保持滚动条位置
        if (this.chartType === 'asset' && this.myChart && !forceRefresh) {
          const currentOption = this.myChart.getOption();
          if (currentOption && currentOption.dataZoom && currentOption.dataZoom.length > 0) {
            const start = currentOption.dataZoom[0].start;
            const end = currentOption.dataZoom[0].end;
            if (option.dataZoom && option.dataZoom.length > 0) {
              option.dataZoom.forEach(zoom => {
                delete zoom.startValue;
                delete zoom.endValue;
                zoom.start = start;
                zoom.end = end;
              });
            }
          }
        }

        this.myChart.setOption(option, forceRefresh);
        this.lastOption = option;
      } catch (error) {
        console.error(`❌ 更新图表失败: ${this.chartType}`, error);
        if (!this.lastOption || forceRefresh) {
          this.myChart.setOption(this.getEmptyChartOption(`加载失败: ${error.message || '网络异常'}`), true);
        }
      } finally {
        this.loading = false;
      }
    },

    async getAssetComparisonOption(accountId) {
      // 这里的逻辑参考数据展示模块，获取真实账户持仓数据
      const data = await fetchAccountInfo();
      if (!data || !data.accounts || data.accounts.length === 0) {
        throw new Error('未获取到有效账户数据');
      }

      let targetAccount = null;
      if (accountId) {
        targetAccount = data.accounts.find(acc => acc.account_id === accountId);
      }
      if (!targetAccount) {
        targetAccount = data.accounts[0];
        this.currentAccountId = targetAccount.account_id;
      }

      const positions = targetAccount.positions || [];
      if (positions.length === 0) {
        return this.getEmptyChartOption('该账户目前没有持仓数据');
      }

      // 按市值降序排序
      positions.sort((a, b) => b.market_value - a.market_value);

      // 计算总市值以便后面计算占比
      const totalMarketValue = positions.reduce((sum, p) => sum + Number(p.market_value), 0);

      const stockNames = [];
      const stockCodes = [];
      const marketValues = [];
      const percentages = [];

      positions.forEach(pos => {
        stockNames.push(pos.stock_name || '未知');
        stockCodes.push(pos.stock_code);
        const val = Number(pos.market_value) || 0;
        marketValues.push(val);
        // 计算并保留两位小数的占比
        percentages.push(totalMarketValue > 0 ? ((val / totalMarketValue) * 100).toFixed(2) : '0.00');
      });

      return {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(26, 31, 58, 0.95)',
          borderColor: 'rgba(64, 224, 255, 0.3)',
          textStyle: { color: '#ffffff' },
          formatter: (params) => {
            if (!params || params.length === 0) return '';
            const idx = params[0].dataIndex;
            return `${stockNames[idx]} (${stockCodes[idx]})<br/>市值: ${marketValues[idx].toLocaleString()} 元<br/>占比: ${percentages[idx]}%`;
          }
        },
        grid: {
          left: '80',
          right: '30',
          bottom: '80', // 留够空间给双行标签和 dataZoom
          top: '50',
          containLabel: true
        },
        dataZoom: [
          {
            type: 'slider',
            show: true,
            xAxisIndex: [0],
            startValue: 0,
            endValue: 4, // 默认显示前5个柱子
            bottom: 5,
            height: 15,
            borderColor: 'rgba(64, 224, 255, 0.3)',
            fillerColor: 'rgba(64, 224, 255, 0.2)',
            handleStyle: { color: '#40e0ff' },
            textStyle: { color: '#fff' }
          },
          {
            type: 'inside',
            xAxisIndex: [0],
            zoomOnMouseWheel: false,
            moveOnMouseWheel: true
          }
        ],
        xAxis: {
          type: 'category',
          show: true,
          data: stockNames,
          axisLabel: {
            show: true,
            interval: 0,
            rotate: 0, // 水平显示，配合 dataZoom 分页
            formatter: (value, index) => {
              const code = stockCodes[index] || '';
              // 根据要求：在股票代码下方显示股票名
              // 第一行显示股票代码 (蓝绿色)，第二行显示股票名称 (白色)
              return `{code|${code}}
{name|${value}}`;
            },
            rich: {
              code: {
                color: '#40e0ff',
                fontSize: 10,
                fontWeight: 'bold',
                align: 'center',
                lineHeight: 18
              },
              name: {
                color: '#ffffff',
                fontSize: 11,
                align: 'center',
                lineHeight: 18
              }
            }
          },
          axisLine: { show: true, lineStyle: { color: 'rgba(64, 224, 255, 0.5)' } },
          axisTick: { show: true }
        },
        yAxis: {
          type: 'value',
          show: true,
          name: '市值(元)',
          nameTextStyle: { color: '#ffffff', fontSize: 11, padding: [0, 0, 10, 0] },
          axisLabel: {
            show: true,
            color: '#ffffff',
            fontSize: 10,
            formatter: (value) => {
              return value.toLocaleString();
            }
          },
          axisLine: { show: true, lineStyle: { color: 'rgba(64, 224, 255, 0.5)' } },
          splitLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        series: [
          {
            name: '持仓市值',
            type: 'bar',
            data: marketValues,
            barMaxWidth: 40,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#40e0ff' },
                { offset: 1, color: 'rgba(64, 224, 255, 0.2)' }
              ]),
              borderRadius: [4, 4, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              color: '#ffffff',
              fontSize: 10,
              formatter: (params) => `${percentages[params.dataIndex]}%`
            }
          }
        ]
      };
    },

    async getTimeComparisonOption(accountId) {
      const data = await fetchYearlyComparisonData(accountId);
      const yearlyData = data.yearly_data || [];
      if (yearlyData.length === 0) return this.getEmptyChartOption('暂无年度对比历史数据');

      const years = yearlyData.map(item => item.year || item.timePeriod || '');
      const totalAssets = yearlyData.map(item => item.totalAssets || 0);
      const returnRates = yearlyData.map(item => item.returnRate || 0);

      return {
        tooltip: { trigger: 'axis' },
        legend: { data: ['总资产', '回报率'], textStyle: { color: '#ffffff' }, bottom: '0' },
        grid: { left: '50', right: '50', bottom: '60', containLabel: true },
        xAxis: {
          type: 'category',
          show: true,
          data: years,
          axisLabel: { color: '#ffffff' },
          axisLine: { lineStyle: { color: 'rgba(64, 224, 255, 0.3)' } }
        },
        yAxis: [
          { type: 'value', name: '总资产', axisLabel: { color: '#ffffff' }, axisLine: { show: true, lineStyle: { color: 'rgba(64, 224, 255, 0.3)' } } },
          { type: 'value', name: '回报率(%)', position: 'right', axisLabel: { color: '#ffffff', formatter: '{value}%' }, axisLine: { show: true, lineStyle: { color: '#ff6b6b' } } }
        ],
        series: [
          { name: '总资产', type: 'bar', data: totalAssets, itemStyle: { color: '#40e0ff' } },
          { name: '回报率', type: 'line', data: returnRates, yAxisIndex: 1, itemStyle: { color: '#ff6b6b' } }
        ]
      };
    },

    async getRegionComparisonOption(accountId) {
      const data = await fetchAreaComparison(accountId);
      const regionData = data.region_data || [];
      if (regionData.length === 0) return this.getEmptyChartOption('该账户暂无地区分布数据');

      const pieData = regionData.map(item => ({ name: item.region, value: item.totalAssets }));

      return {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', textStyle: { color: '#fff' } },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            data: pieData,
            label: { show: true, color: '#fff', formatter: '{b}: {d}%' }
          }
        ]
      };
    },

    handleResize() {
      if (this.myChart) this.myChart.resize();
    },

    getEmptyChartOption(message = '暂无数据') {
      return {
        title: {
          show: true,
          text: message,
          left: 'center',
          top: 'center',
          textStyle: { color: '#aaaaaa', fontSize: 14, fontWeight: 'normal' }
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      };
    }
  }
};
</script>

<style scoped>
.comparison-chart {
  width: 100%;
  height: 100%;
}
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 250px;
}
:deep(.el-loading-mask) {
  background-color: rgba(12, 20, 38, 0.6) !important;
}
</style>
