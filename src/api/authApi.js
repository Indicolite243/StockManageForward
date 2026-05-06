import { httpClient } from '@/utils/httpClient'

const REMEMBERED_LOGIN_KEY = 'remembered_login'

export const loginWithPassword = async (username, password) => {
  const response = await httpClient.post('/api/auth/login/', {
    username: username.trim(),
    password: password.trim()
  })

  const result = response.data || {}
  if (result.success && result.data?.token?.access_token) {
    const accessToken = result.data.token.access_token
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user_info', JSON.stringify(result.data.user || {}))
  }

  return result
}

export const registerWithPassword = async (username, password, confirmPassword) => {
  const response = await httpClient.post('/api/auth/register/', {
    username: username.trim(),
    password: password.trim(),
    confirm_password: confirmPassword.trim()
  })

  return response.data || {}
}

export const getCurrentUser = async () => {
  const response = await httpClient.get('/api/auth/profile/')
  if (response.data?.success && response.data?.data) {
    localStorage.setItem('user_info', JSON.stringify(response.data.data))
  }
  return response.data
}

export const logout = async () => {
  try {
    await httpClient.post('/api/auth/logout/')
  } finally {
    clearAuthData()
  }
}

export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
  const userInfo = localStorage.getItem('user_info')
  return !!(token && userInfo)
}

export const getLocalUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('user_info')
    return userInfo ? JSON.parse(userInfo) : null
  } catch (error) {
    console.error('解析用户信息失败:', error)
    return null
  }
}

export const getAccessToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('access_token')
}

export const saveRememberedLogin = (username, password, rememberPassword) => {
  if (!rememberPassword) {
    localStorage.removeItem(REMEMBERED_LOGIN_KEY)
    return
  }

  localStorage.setItem(
    REMEMBERED_LOGIN_KEY,
    JSON.stringify({
      username,
      password,
      rememberPassword: true
    })
  )
}

export const getRememberedLogin = () => {
  try {
    const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('读取保存密码信息失败:', error)
    return null
  }
}

export const clearRememberedLogin = () => {
  localStorage.removeItem(REMEMBERED_LOGIN_KEY)
}

export const clearAuthData = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  localStorage.removeItem('xuntou_token')
}

export default {
  loginWithPassword,
  registerWithPassword,
  getCurrentUser,
  logout,
  isAuthenticated,
  getLocalUserInfo,
  getAccessToken,
  saveRememberedLogin,
  getRememberedLogin,
  clearRememberedLogin,
  clearAuthData
}
