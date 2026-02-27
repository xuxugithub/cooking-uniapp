import { get, post } from '../utils/request.js'

// 微信小程序登录
export const wxLogin = (code, userInfo = null) => {
  const data = { code }
  if (userInfo) {
    data.userInfo = userInfo
  }
  // 禁用自动loading，由调用方手动控制
  return post('/api/app/user/wx-login', data, { loading: false })
}

// 获取用户信息
export const getUserInfo = () => {
  return get('/api/app/user/info')
}

// 获取用户收藏列表
export const getUserFavorites = (params = {}) => {
  return get('/api/app/favorite/list', params)
}

// 获取关注列表
export const getFollowList = (userId) => {
  return get('/api/app/follow/list', { userId })
}

// 获取粉丝列表
export const getFansList = (userId) => {
  return get('/api/app/follow/fans', { userId })
}

// 关注用户
export const followUser = (followUserId) => {
  return post('/api/app/follow/add', { followUserId })
}

// 取消关注
export const unfollowUser = (followUserId) => {
  return post('/api/app/follow/remove', { followUserId })
}
