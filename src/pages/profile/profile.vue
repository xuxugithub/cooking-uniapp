<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-section">
			<view class="user-info" v-if="hasUserInfo">
				<image class="avatar" :src="userInfo.avatarUrl" mode="aspectFill"></image>
				<view class="user-details">
					<text class="nickname">{{userInfo.nickName}}</text>
					<text class="welcome">欢迎使用厨小教</text>
					<!-- 粉丝和关注数 -->
					<view class="user-follow-stats">
						<view class="stat-item">
							<text class="stat-number">{{userStats.followCount}}</text>
							<text class="stat-label">关注</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-number">{{userStats.fansCount}}</text>
							<text class="stat-label">粉丝</text>
						</view>
					</view>
				</view>
			</view>
			
			<view class="login-section" v-else>
				<text class="default-avatar">👤</text>
				<view class="login-info">
					<text class="login-title">授权后享受更多功能</text>
					<text class="login-desc">收藏菜品、记录浏览历史</text>
				</view>
				<button class="login-btn" @tap="onGetUserProfile">立即授权</button>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-group">
				<view class="menu-item" @tap="onViewFavorites">
					<view class="menu-icon">❤️</view>
					<text class="menu-text">我的收藏</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @tap="testToken">
					<view class="menu-icon">🔑</view>
					<text class="menu-text">测试Token</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @tap="onClearCache">
					<view class="menu-icon">🗑️</view>
					<text class="menu-text">清除缓存</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<button class="menu-item" open-type="share">
					<view class="menu-icon">📤</view>
					<text class="menu-text">分享小程序</text>
					<text class="menu-arrow">></text>
				</button>
				<view class="menu-item" @tap="onFeedback">
					<view class="menu-icon">💬</view>
					<text class="menu-text">意见反馈</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @tap="onAbout">
					<view class="menu-icon">ℹ️</view>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { wxLogin, getUserInfo } from '../../api/user.js'

	export default {
		data() {
			return {
				hasUserInfo: false,
				userInfo: {},
				userStats: {
					followCount: 0,
					fansCount: 0
				}
			}
		},
		onLoad() {
			this.checkUserInfo()
		},
		onShow() {
			this.checkUserInfo()
		},
		methods: {
			// 检查用户信息
			checkUserInfo() {
				const userInfo = uni.getStorageSync('userInfo')
				if (userInfo) {
					this.hasUserInfo = true
					this.userInfo = userInfo
					this.loadUserStats()
				}
			},

			// 加载用户统计信息
			async loadUserStats() {
				try {
					const res = await getUserInfo()
					if (res.data) {
						this.userStats = {
							followCount: res.data.followCount || 0,
							fansCount: res.data.fansCount || 0
						}
					}
				} catch (error) {
					console.log('获取用户统计信息失败:', error)
				}
			},

			// 获取用户信息
			async onGetUserProfile() {
				// #ifdef MP-WEIXIN
				try {
					// 必须在用户点击事件中同步调用 getUserProfile
					const userProfileRes = await uni.getUserProfile({
						desc: '用于完善用户资料'
					})
					
					if (!userProfileRes.userInfo) {
						throw new Error('获取用户信息失败')
					}
					
					// 然后获取登录凭证
					const loginRes = await uni.login()
					if (!loginRes.code) {
						throw new Error('获取微信登录凭证失败')
					}
					
					// 调用后端登录接口
					const loginData = {
						code: loginRes.code,
						userInfo: {
							nickName: userProfileRes.userInfo.nickName,
							avatarUrl: userProfileRes.userInfo.avatarUrl,
							gender: userProfileRes.userInfo.gender,
							country: userProfileRes.userInfo.country,
							province: userProfileRes.userInfo.province,
							city: userProfileRes.userInfo.city
						}
					}
					
					const res = await wxLogin(loginRes.code, loginData.userInfo)
					if (res.data && res.data.token) {
						uni.setStorageSync('token', res.data.token)
						uni.setStorageSync('userInfo', res.data.userInfo)
						this.hasUserInfo = true
						this.userInfo = res.data.userInfo
						this.loadUserStats()
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
					} else {
						throw new Error('登录接口返回数据异常')
					}
				} catch (error) {
					console.error('登录失败:', error)
					
					// 如果是用户取消授权，提供友好提示
					if (error.errMsg && error.errMsg.includes('getUserProfile:fail cancel')) {
						uni.showToast({
							title: '需要授权才能使用完整功能',
							icon: 'none',
							duration: 2000
						})
						return
					}
					
					// 如果获取用户信息失败，尝试简化登录（只用code）
					if (error.errMsg && error.errMsg.includes('getUserProfile:fail')) {
						try {
							console.log('尝试简化登录...')
							const loginRes = await uni.login()
							if (loginRes.code) {
								const res = await wxLogin(loginRes.code)
								if (res.data && res.data.token) {
									uni.setStorageSync('token', res.data.token)
									uni.setStorageSync('userInfo', res.data.userInfo)
									this.hasUserInfo = true
									this.userInfo = res.data.userInfo
									this.loadUserStats()
									uni.showToast({
										title: '登录成功',
										icon: 'success'
									})
									return
								}
							}
						} catch (fallbackError) {
							console.error('简化登录也失败:', fallbackError)
						}
					}
					
					uni.showToast({
						title: error.message || '登录失败',
						icon: 'none'
					})
				}
				// #endif
				
				// #ifdef H5
				// H5环境下的模拟登录
				try {
					const mockUserInfo = {
						id: 1,
						nickname: 'H5用户',
						avatar: 'https://via.placeholder.com/100x100?text=H5',
						fansCount: 0,
						followCount: 0
					}
					
					const mockToken = 'mock_token_' + Date.now()
					
					uni.setStorageSync('token', mockToken)
					uni.setStorageSync('userInfo', mockUserInfo)
					this.hasUserInfo = true
					this.userInfo = mockUserInfo
					this.userStats = {
						followCount: mockUserInfo.followCount,
						fansCount: mockUserInfo.fansCount
					}
					
					uni.showToast({
						title: '模拟登录成功',
						icon: 'success'
					})
				} catch (error) {
					console.error('模拟登录失败:', error)
					uni.showToast({
						title: '登录失败',
						icon: 'none'
					})
				}
				// #endif
			},

			// 查看收藏
			onViewFavorites() {
				uni.switchTab({
					url: '/pages/favorites/favorites'
				})
			},

			// 测试Token
			testToken() {
				const token = uni.getStorageSync('token')
				if (token) {
					uni.showModal({
						title: 'Token信息',
						content: `Token: ${token.substring(0, 20)}...`,
						showCancel: false
					})
				} else {
					uni.showToast({
						title: '未登录',
						icon: 'none'
					})
				}
			},

			// 清除缓存
			onClearCache() {
				uni.showModal({
					title: '提示',
					content: '确定要清除所有缓存数据吗？',
					success: (res) => {
						if (res.confirm) {
							uni.clearStorageSync()
							this.hasUserInfo = false
							this.userInfo = {}
							uni.showToast({
								title: '清除成功',
								icon: 'success'
							})
						}
					}
				})
			},

			// 意见反馈
			onFeedback() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},

			// 关于我们
			onAbout() {
				uni.showModal({
					title: '关于厨小教',
					content: '厨小教 v1.0.0\n零基础学做菜超简单',
					showCancel: false
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import url("./profile.scss");
</style>