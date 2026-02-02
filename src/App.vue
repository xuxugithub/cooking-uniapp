<template>
	<view id="app">
		<!-- 全局组件 -->
	</view>
</template>

<script>
	export default {
		onLaunch: function() {
			// 初始化应用
			this.initApp()
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
			}
		},
		globalData: {
			userInfo: null,
			systemInfo: null,
			baseUrl: 'https://cook.xuaq.top'
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