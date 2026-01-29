import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// uni-app(vite) 在非 HBuilderX 环境下需要显式提供 vite 配置
export default defineConfig({
  plugins: [uni()],
})

