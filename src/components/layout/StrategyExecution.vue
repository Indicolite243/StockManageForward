<template>
  <div class="strategy-execution">
    <div class="strategy-display-module">
      <div class="title">当前执行策略</div>

      <div class="select-container">
        <el-select
          v-model="selectedStrategy"
          placeholder="请选择策略"
          @change="handleStrategyChange"
        >
          <el-option
            v-for="strategy in strategies"
            :key="strategy.id"
            :label="strategy.name"
            :value="strategy"
          />
        </el-select>

        <el-button type="primary" size="small" @click="openUploadDialog">
          导入策略文件
        </el-button>
      </div>

      <div class="strategy-content-card">
        <div class="strategy-description">
          <div class="title">策略简介</div>
          <div class="description-text">{{ selectedStrategy.description }}</div>
        </div>

        <div class="strategy-parameters">
          <div class="title">策略参数设置</div>
          <div class="parameters-table-wrapper">
            <el-table
              :data="selectedStrategy.parameters"
              style="width: 100%"
              :header-cell-style="headerStyle"
            >
              <el-table-column prop="paramKey" label="参数名称" />
              <el-table-column prop="paramValue" label="参数值" />
              <el-table-column prop="description" label="描述" />
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="uploadDialogVisible"
      title="导入并运行策略文件"
      width="620px"
      :close-on-click-modal="false"
    >
      <div class="upload-content">
        <div class="form-block">
          <div class="form-label">回测引擎</div>
          <el-select v-model="engineType" style="width: 100%">
            <el-option label="自动识别" value="auto" />
            <el-option label="MindGo / SuperMind" value="mindgo" />
            <el-option label="Backtrader" value="backtrader" />
          </el-select>
          <div class="form-tip">
            选择“自动识别”时，系统会根据上传的 .py 文件内容自动判断回测引擎。
          </div>
        </div>

        <div class="form-block">
          <div class="form-label">自定义回测时间范围</div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </div>

        <div class="form-block">
          <div class="form-label">策略文件</div>
          <el-upload
            ref="strategyUploadRef"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleStrategyFileChange"
            :limit="1"
            :on-exceed="handleStrategyExceed"
            accept=".py"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将 <strong>.py</strong> 策略文件拖到此处，或 <em>点击上传</em>
            </div>
          </el-upload>
        </div>

        <div class="form-block">
          <div class="form-label">行情文件（可选）</div>
          <el-upload
            ref="marketUploadRef"
            action="#"
            :auto-upload="false"
            :on-change="handleMarketFileChange"
            :on-remove="handleMarketFileRemove"
            :file-list="marketFileList"
            multiple
            accept=".xlsx"
          >
            <el-button type="default">上传行情 .xlsx</el-button>
          </el-upload>
          <div class="form-tip">
            当策略依赖新的本地行情文件时，可以在这里一并上传对应的 .xlsx。
          </div>
        </div>

        <div v-if="selectedStrategyFile" class="file-preview">
          <div class="file-preview-main">
            <el-icon><Document /></el-icon>
            <span>{{ selectedStrategyFile.name }}</span>
            <el-tag type="success" size="small">已选择</el-tag>
          </div>
          <div class="engine-detect">
            自动识别结果：
            <strong>{{ detectedEngineLabel }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isExecuting" @click="confirmUpload">
            {{ isExecuting ? '正在运行回测...' : '确认并运行回测' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import axios from 'axios'
import { Document, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const strategyUploadRef = ref(null)
const marketUploadRef = ref(null)

const strategies = ref([
  {
    id: 1,
    name: '量化选股策略',
    description: '基于股票数量、选股范围、最大仓位和个股仓位等基本面指标的价值投资策略。',
    parameters: [
      { paramKey: '股票数量', paramValue: '10', description: '最终持有的股票数量' },
      { paramKey: '最大仓位', paramValue: '80%', description: '组合总持仓上限' }
    ]
  },
  {
    id: 2,
    name: 'ETF轮动策略',
    description: '基于价格趋势和均线信号的 ETF 轮动策略，适合与 SuperMind 同类策略结果进行对照。',
    parameters: [
      { paramKey: '调仓周期', paramValue: '60天', description: '策略重新平衡的时间间隔' },
      { paramKey: '目标权重', paramValue: '20%', description: '每只 ETF 的目标持仓比例' },
      { paramKey: '手续费率', paramValue: '0.02%', description: '每笔交易的佣金费率' },
      { paramKey: '滑点', paramValue: '0.1%', description: '交易执行的价格滑点' }
    ]
  },
  {
    id: 3,
    name: '自定义策略',
    description: '上传你自己的 .py 策略文件，系统会根据脚本格式自动选择兼容执行器。',
    parameters: [
      { paramKey: '策略文件', paramValue: '用户上传', description: '支持 MindGo / SuperMind 与 Backtrader 脚本' },
      { paramKey: '时间范围', paramValue: '自定义', description: '通过日期选择器设置回测区间' }
    ]
  }
])

const selectedStrategy = ref(strategies.value[1])
const uploadDialogVisible = ref(false)
const selectedStrategyFile = ref(null)
const selectedStrategyText = ref('')
const marketFiles = ref([])
const marketFileList = ref([])
const isExecuting = ref(false)
const engineType = ref('auto')
const dateRange = ref(['2020-01-01', '2025-01-01'])

const detectedEngine = computed(() => {
  if (!selectedStrategyText.value) return 'unknown'
  const lowered = selectedStrategyText.value.toLowerCase()
  if (
    lowered.includes('mindgo_api') ||
    lowered.includes('from mindgo_api import *') ||
    lowered.includes('import mindgo_api')
  ) {
    return 'mindgo'
  }
  return 'backtrader'
})

const detectedEngineLabel = computed(() => {
  if (detectedEngine.value === 'mindgo') return 'MindGo / SuperMind'
  if (detectedEngine.value === 'backtrader') return 'Backtrader'
  return '暂未识别'
})

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

function handleStrategyChange() {}

function resetUploadState() {
  selectedStrategyFile.value = null
  selectedStrategyText.value = ''
  marketFiles.value = []
  marketFileList.value = []
  engineType.value = 'auto'
  dateRange.value = ['2020-01-01', '2025-01-01']
  strategyUploadRef.value?.clearFiles()
  marketUploadRef.value?.clearFiles()
}

function openUploadDialog() {
  resetUploadState()
  uploadDialogVisible.value = true
}

async function handleStrategyFileChange(file) {
  selectedStrategyFile.value = file.raw
  if (file?.raw?.text) {
    selectedStrategyText.value = await file.raw.text()
  } else {
    selectedStrategyText.value = ''
  }
}

function handleStrategyExceed(files) {
  strategyUploadRef.value?.clearFiles()
  const nextFile = files[0]
  strategyUploadRef.value?.handleStart(nextFile)
  selectedStrategyFile.value = nextFile
}

function handleMarketFileChange(file, uploadFiles) {
  marketFiles.value = uploadFiles.map(item => item.raw).filter(Boolean)
  marketFileList.value = uploadFiles
}

function handleMarketFileRemove(file, uploadFiles) {
  marketFiles.value = uploadFiles.map(item => item.raw).filter(Boolean)
  marketFileList.value = uploadFiles
}

async function confirmUpload() {
  if (!selectedStrategyFile.value) {
    ElMessage.warning('请先选择一个 .py 策略文件')
    return
  }

  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择回测时间范围')
    return
  }

  const [startDate, endDate] = dateRange.value
  if (new Date(startDate) >= new Date(endDate)) {
    ElMessage.error('开始日期必须早于结束日期')
    return
  }

  const formData = new FormData()
  formData.append('file', selectedStrategyFile.value)
  formData.append('start_date', startDate)
  formData.append('end_date', endDate)
  formData.append('engine_type', engineType.value)
  formData.append('enable_bear_protection', 'false')

  marketFiles.value.forEach(file => {
    formData.append('market_files', file)
  })

  isExecuting.value = true
  try {
    const response = await axios.post('/api/run-strategy/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 360000
    })

    if (response.data.status !== 'success') {
      ElMessage.error(response.data.message || '策略执行失败')
      return
    }

    uploadDialogVisible.value = false
    resetUploadState()
    ElMessage.success('回测执行完成')
    window.dispatchEvent(new CustomEvent('strategy-execution-started', { detail: response.data.data }))
  } catch (error) {
    const payload = error.response?.data

    if (payload?.error_code === 'missing_market_data') {
      const missingList = (payload.missing_market_files || []).join('<br/>')
      await ElMessageBox.alert(
        `当前策略缺少以下行情文件：<br/><br/>${missingList}<br/><br/>请重新上传策略文件，并补充这些 .xlsx 行情文件。`,
        '缺少行情文件',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '知道了',
          type: 'warning'
        }
      )
      return
    }

    if (payload?.detail) {
      await ElMessageBox.alert(
        `<strong>${payload.message || '策略执行失败'}</strong><br/><br/><pre style="font-size:11px;max-height:220px;overflow:auto;background:#f5f5f5;padding:8px;">${payload.detail}</pre>`,
        '策略执行错误',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭',
          type: 'error'
        }
      )
      return
    }

    if (error.code === 'ECONNABORTED') {
      ElMessage.error('回测请求超时，请稍后查看后端日志')
      return
    }

    ElMessage.error(payload?.message || '无法连接到后端服务，请确认服务已启动')
  } finally {
    isExecuting.value = false
  }
}
</script>

<style scoped>
.strategy-execution {
  width: 100%;
  height: 100%;
  padding: 6px;
  box-sizing: border-box;
  overflow-y: auto;
}

.strategy-display-module {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid rgba(64, 224, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #000000;
  text-shadow: 0 0 8px rgba(64, 224, 255, 0.6);
}

.select-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.select-container :deep(.el-select) {
  flex: 1;
}

.strategy-content-card {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  overflow: visible;
  padding: 12px;
  background: rgba(25, 39, 67, 0.65);
  border: 1px solid rgba(64, 224, 255, 0.18);
  border-radius: 8px;
}

.strategy-description {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.description-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.6;
}

.strategy-parameters {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.parameters-table-wrapper {
  flex: 1;
  min-height: 320px;
  overflow: visible;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #1b273f;
}

.form-tip {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.file-preview {
  padding: 10px 12px;
  background: rgba(64, 224, 255, 0.08);
  border: 1px solid rgba(64, 224, 255, 0.3);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #333;
}

.file-preview-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.engine-detect {
  color: #1f3b57;
}

:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table tr),
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background-color: #ffffff !important;
  color: #000000 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(64, 224, 255, 0.2) !important;
  border-bottom: 1px solid rgba(64, 224, 255, 0.3) !important;
  font-weight: bold !important;
}

:deep(.el-table) {
  font-size: 11px;
}
</style>
