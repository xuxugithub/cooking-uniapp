import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// uni-app(vite) 在非 HBuilderX 环境下需要显式提供 vite 配置
export default defineConfig(({ mode }) => {
  // 获取命令行传入的环境变量
  const env = process.env.VITE_APP_ENV || 'dev'
  console.log('构建环境:', env)

  return {
    plugins: [uni()],
    // 确保环境变量能被正确读取
    envPrefix: 'VITE_',
    // 通过 define 将环境变量注入到代码中
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env)
    }
  }
})