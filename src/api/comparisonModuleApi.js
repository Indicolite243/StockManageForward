import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

const ACCOUNT_ID = 'DEMO000001'

export async function fetchAssetComparison(accountId = ACCOUNT_ID, source = 'qmt') {
  const response = await api.get('/api/asset_comparison/', {
    params: {
      account_id: accountId,
      mock: 'false',
      source
    }
  })
  return response.data
}

export async function fetchYearlyComparisonData(accountId = ACCOUNT_ID, source = 'mongodb') {
  const response = await api.get('/api/timecomparison/yearly_comparison/', {
    params: {
      account_id: accountId,
      mock: 'false',
      source
    }
  })
  return response.data
}

export async function fetchAreaComparison(accountId = ACCOUNT_ID, source = 'qmt') {
  const response = await api.get('/api/areacomparsion/area_comparison/', {
    params: {
      account_id: accountId,
      mock: 'false',
      source
    }
  })
  return response.data
}
