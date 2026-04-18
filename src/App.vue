<template>
	<view id="app">
		<!-- 全局组件 -->
	</view>
</template>

<script>
	import { APP_ENV, API_BASE_URL } from './config/app.js'
	import { wxLogin, getUserInfo } from './api/user.js'

	export default {
		onLaunch: function() {
			// 初始化应用
			this.initApp()
			// 自动登录检查
			this.autoLogin()
		},
		onShow: function() {
			// 应用显示
		},
		onHide: function() {
			// 应用隐藏
		},
		methods: {
			initApp() {
				// 检查更新
				// #ifdef MP-WEIXIN
				if (uni.canIUse('getUpdateManager')) {
					const updateManager = uni.getUpdateManager()
					updateManager.onCheckForUpdate(function(res) {
						// 检查更新结果
					})
					updateManager.onUpdateReady(function() {
						uni.showModal({
							title: '更新提示',
							content: '新版本已经准备好，是否重启应用？',
							success: function(res) {
								if (res.confirm) {
									updateManager.applyUpdate()
								}
							}
						})
					})
					updateManager.onUpdateFailed(function() {
						uni.showModal({
							title: '更新失败',
							content: '新版本下载失败，请检查网络后重试',
							showCancel: false
						})
					})
				}
				// #endif

				// 获取系统信息
				uni.getSystemInfo({
					success: (res) => {
						this.globalData.systemInfo = res
					}
				})
			},

			// 自动登录检查
			async autoLogin() {
				const token = uni.getStorageSync('token')
				const userInfo = uni.getStorageSync('userInfo')

				// 如果已有token和用户信息，验证token有效性
				if (token && userInfo) {
					try {
						// 调用getUserInfo验证token是否有效
						await getUserInfo()
						// token有效，无需重新登录
						console.log('登录状态有效')
						return
					} catch (error) {
						// token失效，清除并重新登录
						console.log('登录状态失效，重新登录')
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
					}
				}

				// #ifdef MP-WEIXIN
				// 没有有效登录状态，执行静默登录
				try {
					const loginRes = await uni.login()
					if (loginRes.code) {
						// 静默登录，不获取用户详细信息
						const res = await wxLogin(loginRes.code, null)
						if (res.data && res.data.token) {
							uni.setStorageSync('token', res.data.token)
							uni.setStorageSync('userInfo', res.data.userInfo)
							console.log('自动登录成功')
						}
					}
				} catch (error) {
					console.log('自动登录失败:', error)
				}
				// #endif
			}
		},
		globalData: {
			userInfo: null,
			systemInfo: null,
			env: APP_ENV,
			baseUrl: API_BASE_URL
		}
	}
</script>

<style lang="scss">
	/* 全局样式 */
	@import "./static/styles/global.scss";
	/* 重置样式 */
	page, view, text, image, button, input {
		box-sizing: border-box;
	}
	
	page {
		background-color: #f5f5f5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
	}
	
	/* 通用类 */
	.container {
		padding-bottom: 120rpx;
		background: #f5f5f5;
		min-height: 100vh;
	}
	
	.flex {
		display: flex;
	}
	
	.flex-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.flex-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.text-center {
		text-align: center;
	}
	
	.text-ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	/* 主题色 */
	.primary-color {
		color: #ff69b4;
	}
	
	.primary-bg {
		background-color: #ff69b4;
	}
</style>
