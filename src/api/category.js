import { get } from '../utils/request.js'

// 获取分类列表
export const getCategoryList = (options = {}) => {
  return get('/api/app/category/list', {}, options)
}
