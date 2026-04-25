import axios from 'axios'
import {
  mockAssetCategoryData,
  mockRegionData,
  mockTimeData,
  USE_MOCK_DATA
} from './mockData.js'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data) {
      console.warn('API 返回错误响应:', error.response.data)
    }
    return Promise.reject(error)
  }
)

export async function fetchAccountInfo(source = 'qmt') {
  try {
    const response = await api.get('/api/account-info/', {
      params: {
        mock: 'false',
        source,
        _t: Date.now()
      }
    })
    return response.data
  } catch (error) {
    console.error('获取账户信息失败:', error)
    if (error.response?.status === 503) {
      throw new Error(error.response?.data?.error || '连接交易接口失败')
    }
    if (error.request) {
      throw new Error('后端服务无响应，请确认 Django 服务已启动')
    }
    throw error
  }
}

export async function fetchAssetCategoryData() {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ ...mockAssetCategoryData, is_mock: true }), 300)
    })
  }

  const response = await api.get('/api/asset-category/')
  return response.data
}

export async function fetchRegionDataFromBackend() {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ ...mockRegionData, is_mock: true }), 300)
    })
  }

  const response = await api.get('/api/region-data/')
  return response.data
}

export async function fetchTimeDataFromBackend(params) {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ ...mockTimeData, is_mock: true }), 300)
    })
  }

  const response = await api.get('/api/time-data/', { params })
  return response.data
}
