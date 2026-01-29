// 工具函数

/**
 * 获取完整的图片URL
 * @param {string} imagePath 图片路径
 * @returns {string} 完整的图片URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `https://cook.web.xuaq.top/admin/file/preview/${imagePath}`
}

/**
 * 格式化相对时间
 * @param {string} timeStr 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatRelativeTime = (timeStr) => {
  if (!timeStr) return ''
  
  const now = new Date()
  const time = new Date(timeStr)
  const diff = now - time
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < month) {
    return Math.floor(diff / day) + '天前'
  } else {
    return time.toLocaleDateString()
  }
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 深拷贝
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 获取难度文本
 * @param {number} difficulty 难度等级
 * @returns {string} 难度文本
 */
export const getDifficultyText = (difficulty) => {
  const map = { 1: '简单', 2: '中等', 3: '困难' }
  return map[difficulty] || '未知'
}

/**
 * 获取难度颜色
 * @param {number} difficulty 难度等级
 * @returns {string} 颜色值
 */
export const getDifficultyColor = (difficulty) => {
  const map = { 1: '#67c23a', 2: '#e6a23c', 3: '#f56c6c' }
  return map[difficulty] || '#909399'
}

/**
 * 存储数据到本地
 * @param {string} key 键名
 * @param {any} data 数据
 */
export const setStorage = (key, data) => {
  try {
    uni.setStorageSync(key, data)
  } catch (error) {
    console.error('存储数据失败:', error)
  }
}

/**
 * 从本地获取数据
 * @param {string} key 键名
 * @param {any} defaultValue 默认值
 * @returns {any} 数据
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    return uni.getStorageSync(key) || defaultValue
  } catch (error) {
    console.error('获取数据失败:', error)
    return defaultValue
  }
}

/**
 * 删除本地数据
 * @param {string} key 键名
 */
export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    console.error('删除数据失败:', error)
  }
}