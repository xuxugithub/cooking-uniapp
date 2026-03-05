const DEFAULT_ENV = 'prod'

const COMPILE_ENV = String(
  import.meta.env.VITE_APP_ENV || import.meta.env.UNI_APP_ENV || DEFAULT_ENV
).toLowerCase()

const NORMALIZED_ENV = COMPILE_ENV === 'test' ? 'dev' : COMPILE_ENV

export const APP_ENV = NORMALIZED_ENV === 'prod' ? 'prod' : 'dev'

const API_BASE_URL_MAP = {
  dev: 'http://localhost:8080',
  prod: 'https://cook.xuaq.top'
}

export const API_BASE_URL = API_BASE_URL_MAP[APP_ENV]

export const FILE_PREVIEW_BASE_URL = `${API_BASE_URL}/api/admin/file/preview`
