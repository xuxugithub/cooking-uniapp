import { get } from '../utils/request.js'

// 获取分类列表
export const getCategoryList = () => {
  return get('/app/category/list')
}