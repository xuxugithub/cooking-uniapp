import { get, post } from '../utils/request.js'

// 获取菜品分页列表
export const getDishPage = (params) => {
  return get('/api/app/dish/page', params)
}

// 根据ID获取菜品详情
export const getDishById = (id) => {
  return get(`/api/app/dish/${id}`)
}

// 获取菜品制作步骤
export const getDishSteps = (dishId) => {
  return get(`/api/app/dish-step/list/${dishId}`)
}

// 获取菜品食材
export const getDishIngredients = (dishId) => {
  return get(`/api/app/dish-ingredient/list/${dishId}`)
}

// 搜索菜品
export const searchDish = (keyword, params = {}) => {
  return get('/api/app/dish/search', { keyword, ...params })
}

// 获取热门菜品
export const getHotDishes = (params = {}) => {
  return get('/api/app/dish/hot', params)
}

// 获取推荐菜品
export const getRecommendDishes = (params = {}) => {
  return get('/api/app/dish/recommend', params)
}

// 增加浏览量
export const increaseViewCount = (dishId) => {
  return post(`/api/app/dish/${dishId}/view`)
}

// 收藏/取消收藏菜品
export const toggleFavorite = (dishId) => {
  return post(`/api/app/dish/${dishId}/favorite`)
}

// 记录用户浏览历史
export const recordViewHistory = (dishId) => {
  return post(`/api/app/dish/${dishId}/view-history`)
}

// 获取个人推荐菜品列表（基于用户浏览历史）
export const getPersonalRecommendDishes = (params = {}) => {
  return get('/api/app/dish/personal-recommend', params)
}

// 获取所有菜品列表（支持多种排序）
export const getAllDishes = (params = {}) => {
  return get('/api/app/dish/all', params)
}