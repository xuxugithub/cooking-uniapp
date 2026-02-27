import { createSSRApp } from 'vue'
import App from './App.vue'
import { API_BASE_URL } from './config/app.js'

export function createApp() {
  const app = createSSRApp(App)
  
  // 全局配置
  app.config.globalProperties.$baseUrl = API_BASE_URL
  
  return {
    app
  }
}
