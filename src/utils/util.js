import { FILE_PREVIEW_BASE_URL } from '../config/app.js'

// 工具函数

/**
 * 获取完整的图片URL
 * @param {string} imagePath 图片路径
 * @returns {string} 完整的图片URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `${FILE_PREVIEW_BASE_URL}/${imagePath}`
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
    const context = this
    const later = () => {
      clearTimeout(timeout)
      func.apply(context, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
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
