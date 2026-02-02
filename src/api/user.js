import { get, post } from '../utils/request.js'

// 微信小程序登录
export const wxLogin = (code) => {
  return post('/api/app/user/wx-login', { code })
}

// 获取用户信息
export const getUserInfo = () => {
  return get('/api/app/user/info')
}

// 更新用户信息
export const updateUserInfo = (userInfo) => {
  return post('/api/app/user/update', userInfo)
}

// 获取用户收藏列表
export const getUserFavorites = (params = {}) => {
  return get('/api/app/favorite/list', params)
}