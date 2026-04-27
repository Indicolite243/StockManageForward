import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export async function fetchRiskAssessment(accountId = 'DEMO000001', days = 30, options = {}) {
  const params = {
    account_id: accountId,
    days,
    mock: 'false'
  }

  if (options.startDate) {
    params.start_date = options.startDate
  }
  if (options.endDate) {
    params.end_date = options.endDate
  }

  const response = await api.get('/api/risk-threshold/assessment/', {
    params
  })
  return transformRiskData(response.data)
}

function transformRiskData(backendData) {
  const indicators = []

  if (backendData.max_principal_loss) {
    indicators.push({
      metric: '最大本金损失',
      value: `${backendData.max_principal_loss.max_loss_rate}%`,
      status: mapStatus(backendData.max_principal_loss.status)
    })
  }

  if (backendData.volatility) {
    indicators.push({
      metric: '波动率',
      value: `${backendData.volatility.annual_volatility}%`,
      status: mapStatus(backendData.volatility.status)
    })
  }

  if (backendData.max_drawdown) {
    indicators.push({
      metric: '最大回测幅度',
      value: `${backendData.max_drawdown.max_drawdown}%`,
      status: mapStatus(backendData.max_drawdown.status)
    })
  }

  if (backendData.var) {
    indicators.push({
      metric: 'VaR值',
      value: `${backendData.var.var_rate}%`,
      status: mapStatus(backendData.var.status)
    })
  }

  return {
    risk_indicators: indicators,
    meta: {
      data_source: backendData.data_source || 'mongodb_history',
      snapshot_time: backendData.snapshot_time || '',
      period_days_available: backendData.period_days_available || 0,
      is_mock: Boolean(backendData.is_mock),
      range_start: backendData.range_start || '',
      range_end: backendData.range_end || ''
    }
  }
}

function mapStatus(backendStatus) {
  const statusMap = {
    正常: 'normal',
    预警: 'warning',
    危险: 'danger'
  }
  return statusMap[backendStatus] || 'normal'
}
