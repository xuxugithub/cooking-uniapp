// 环境配置
const DEFAULT_ENV = 'dev'

// 获取环境变量
const rawEnv = import.meta.env.VITE_APP_ENV || import.meta.env.UNI_APP_ENV || DEFAULT_ENV
const COMPILE_ENV = String(rawEnv).toLowerCase()

// 标准化环境值
const NORMALIZED_ENV = COMPILE_ENV === 'test' ? 'dev' : COMPILE_ENV

// 导出最终环境
export const APP_ENV = NORMALIZED_ENV === 'prod' ? 'prod' : 'dev'

// API 基础地址
const API_BASE_URL_MAP = {
  dev: 'http://localhost:8080',
  prod: 'https://cook.xuaq.top'
}

export const API_BASE_URL = API_BASE_URL_MAP[APP_ENV]

export const FILE_PREVIEW_BASE_URL = `${API_BASE_URL}/api/admin/file/preview`