import { get } from '../utils/request.js'

// 获取Banner列表
export const getBannerList = (options = {}) => {
  return get('/api/app/banner/list', {}, options)
}
