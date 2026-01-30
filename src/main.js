import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  
  // 全局配置
  app.config.globalProperties.$baseUrl = 'https://cook.xuaq.top'
  
  return {
    app
  }
}