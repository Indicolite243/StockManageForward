<template>
  <div class="chart-section">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref(null)
let chartInstance = null

function createBaseOption(isStandby = true) {
  const standbyDates = [
    '03-25', '03-26', '03-27', '03-28', '03-29', '03-30', '03-31',
    '04-01', '04-02', '04-03', '04-04', '04-05', '04-06', '04-07',
    '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14',
    '04-15', '04-16', '04-17', '04-18', '04-19', '04-20', '04-21',
    '04-22', '04-23'
  ]
  const standbyLine = new Array(standbyDates.length).fill(0)

  return {
    backgroundColor: 'transparent',
    color: ['#58d6ff', '#ff9461', '#63f2a6'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 18, 34, 0.95)',
      borderColor: 'rgba(94, 224, 255, 0.25)',
      textStyle: { color: '#dffbff' },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(255,255,255,0.28)',
          width: 1
        }
      }
    },
    legend: {
      data: ['基准收益', '策略收益', '超额收益'],
      bottom: 8,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: {
        color: '#b9e7ff',
        fontSize: 12
      }
    },
    grid: {
      left: 58,
      right: 28,
      top: 46,
      bottom: 76,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: standbyDates,
      axisLabel: {
        color: '#9fdcff',
        rotate: 35,
        fontSize: 10,
        hideOverlap: true
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(94, 224, 255, 0.18)'
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '收益走势(%)',
      scale: true,
      min: isStandby ? -10 : null,
      max: isStandby ? 30 : null,
      interval: isStandby ? 10 : null,
      axisLabel: {
        formatter: '{value}%',
        color: '#9fdcff'
      },
      nameTextStyle: {
        color: '#b9e7ff',
        padding: [0, 0, 10, 0]
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(94, 224, 255, 0.08)'
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(94, 224, 255, 0.18)'
        }
      }
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 22,
        height: 18,
        borderColor: 'rgba(94, 224, 255, 0.18)',
        fillerColor: 'rgba(94, 224, 255, 0.16)',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        textStyle: {
          color: '#86dfff'
        }
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        right: 8,
        top: 82,
        bottom: 84,
        width: 16,
        borderColor: 'rgba(94, 224, 255, 0.18)',
        fillerColor: 'rgba(94, 224, 255, 0.16)',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        textStyle: {
          color: '#86dfff'
        }
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: 'ctrl',
        moveOnMouseWheel: true,
        preventDefaultMouseMove: false
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: 'ctrl',
        moveOnMouseWheel: false,
        preventDefaultMouseMove: false
      }
    ],
    series: [
      {
        name: '基准收益',
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: 'rgba(88, 214, 255, 0.7)'
        },
        data: standbyLine
      },
      {
        name: '策略收益',
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: 'rgba(255, 148, 97, 0.35)'
        },
        data: standbyLine
      },
      {
        name: '超额收益',
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: 'rgba(99, 242, 166, 0.35)'
        },
        data: standbyLine
      }
    ]
  }
}

function ensureChart() {
  if (!chartContainer.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }
}

function setEmptyChart() {
  ensureChart()
  if (!chartInstance) return
  chartInstance.setOption(createBaseOption(true), true)
}

function normalizeSeries(data) {
  if (!Array.isArray(data)) return []
  return data.map(item => {
    if (item === null || item === undefined || item === '') return null
    const numeric = Number(item)
    return Number.isFinite(numeric) ? numeric : null
  })
}

function renderChart(payload) {
  ensureChart()
  if (!chartInstance) return

  const dates = Array.isArray(payload?.dates) ? payload.dates : []
  const strategy = normalizeSeries(payload?.strategy)
  const benchmark = normalizeSeries(payload?.benchmark)
  const excess = normalizeSeries(payload?.excess)

  if (!dates.length || (!strategy.length && !benchmark.length && !excess.length)) {
    setEmptyChart()
    return
  }

  const option = createBaseOption(false)
  option.xAxis.data = dates
  option.series[0].data = benchmark
  option.series[1].data = strategy
  option.series[2].data = excess

  chartInstance.setOption(option, true)
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

function handleExecutionStarted(event) {
  renderChart(event.detail || {})
}

onMounted(async () => {
  await nextTick()
  setEmptyChart()
  window.addEventListener('resize', handleResize)
  window.addEventListener('strategy-execution-started', handleExecutionStarted)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('strategy-execution-started', handleExecutionStarted)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-section {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 420px;
}
</style>
