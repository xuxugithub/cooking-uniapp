<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-section">
			<view class="user-info" v-if="hasUserInfo">
				<view class="avatar-container">
					<image v-if="userInfo.avatarUrl" class="avatar" :src="userInfo.avatarUrl" mode="aspectFill"></image>
					<view v-else class="default-avatar">👤</view>
				</view>
				<view class="user-details">
					<text class="nickname">{{userInfo.nickName}}</text>
					<text class="welcome">欢迎使用菜味小记</text>
					<!-- 粉丝和关注数 -->
					<view class="user-follow-stats">
						<view class="stat-item" @tap="onShowFollowList">
							<text class="stat-number">{{userStats.followCount}}</text>
							<text class="stat-label">关注</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item" @tap="onShowFansList">
							<text class="stat-number">{{userStats.fansCount}}</text>
							<text class="stat-label">粉丝</text>
						</view>
					</view>
				</view>
			</view>
			
			<view class="login-section" v-else>
				<text class="login-default-avatar">👤</text>
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
				</view>
				<view class="menu-item" @tap="onClearCache">
					<view class="menu-icon">🗑️</view>
					<text class="menu-text">清除缓存</text>
				</view>
			</view>

			<view class="menu-group">
				<button class="menu-item" open-type="share">
					<view class="menu-icon">📤</view>
					<text class="menu-text">分享小程序</text>
				</button>
				<view class="menu-item" @tap="onFeedback">
					<view class="menu-icon">💬</view>
					<text class="menu-text">意见反馈</text>
				</view>
				<view class="menu-item" @tap="onAbout">
					<view class="menu-icon">ℹ️</view>
					<text class="menu-text">关于我们</text>
				</view>
			</view>
		</view>
		
		<!-- 关注/粉丝列表弹窗 -->
		<view class="user-list-modal" v-if="showUserListModal" @tap="closeUserListModal">
			<view class="modal-content" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">{{modalTitle}}</text>
					<text class="close-btn" @tap="closeUserListModal">×</text>
				</view>
				<view class="user-list" v-if="userList.length > 0">
					<view class="user-item" v-for="user in userList" :key="user.userId">
						<view class="user-avatar-container">
							<image v-if="user.avatarUrl" class="user-avatar" :src="user.avatarUrl" mode="aspectFill"></image>
							<view v-else class="user-default-avatar">👤</view>
						</view>
						<view class="user-info">
							<text class="user-nickname">{{user.nickName}}</text>
						</view>
						<view class="follow-btn" v-if="user.userId !== currentUserId" 
							  :class="{ 'followed': user.isFollowed }" 
							  @tap="toggleFollow(user)">
							<text>{{user.isFollowed ? '已关注' : '关注'}}</text>
						</view>
					</view>
				</view>
				<view class="empty-list" v-else>
					<text class="empty-text">{{modalTitle === '关注列表' ? '暂无关注' : '暂无粉丝'}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { wxLogin, getUserInfo, getFollowList, getFansList, followUser, unfollowUser } from '../../api/user.js'

	export default {
		data() {
			return {
				hasUserInfo: false,
				userInfo: {},
				userStats: {
					followCount: 0,
					fansCount: 0
				},
				// 弹窗相关
				showUserListModal: false,
				modalTitle: '',
				userList: [],
				currentUserId: null
			}
		},
		onLoad() {
			this.checkUserInfo()
		},
		onShow() {
			this.checkUserInfo()
			// 强制刷新页面状态，确保UI正确显示
			this.$nextTick(() => {
				this.$forceUpdate()
			})
		},
		methods: {
			// 检查用户信息
			checkUserInfo() {
				const userInfo = uni.getStorageSync('userInfo')
				const token = uni.getStorageSync('token')
				
				if (userInfo && token) {
					this.hasUserInfo = true
					this.userInfo = userInfo
					this.currentUserId = userInfo.id
					this.loadUserStats()
				} else {
					// 清理无效的用户信息
					this.hasUserInfo = false
					this.userInfo = {}
					this.currentUserId = null
					this.userStats = {
						followCount: 0,
						fansCount: 0
					}
					// 清理本地存储中的无效数据
					if (!token) {
						uni.removeStorageSync('userInfo')
					}
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
					// 如果是未登录错误，清理用户状态
					if (error.message && error.message.includes('未登录')) {
						this.clearUserState()
						// 清理本地存储
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
					}
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
					
					// 调用后端登录接口（禁用自动loading，手动控制）
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
					
					// 手动显示loading
					uni.showLoading({
						title: '登录中...',
						mask: true
					})
					
					const res = await wxLogin(loginRes.code, loginData.userInfo)
					
					// 手动隐藏loading
					uni.hideLoading()
					
					if (res.data && res.data.token) {
						uni.setStorageSync('token', res.data.token)
						uni.setStorageSync('userInfo', res.data.userInfo)
						this.hasUserInfo = true
						this.userInfo = res.data.userInfo
						this.currentUserId = res.data.userInfo.id
						// 强制刷新页面状态
						this.$forceUpdate()
						this.loadUserStats()
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
					} else {
						throw new Error('登录接口返回数据异常')
					}
				} catch (error) {
					// 确保隐藏loading
					try {
						uni.hideLoading()
					} catch (e) {
						// 忽略hideLoading错误
					}
					
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
							const loginRes = await uni.login()
							if (loginRes.code) {
								// 使用禁用loading的方式调用API
								const res = await wxLogin(loginRes.code, null)
								if (res.data && res.data.token) {
									uni.setStorageSync('token', res.data.token)
									uni.setStorageSync('userInfo', res.data.userInfo)
									this.hasUserInfo = true
									this.userInfo = res.data.userInfo
									this.currentUserId = res.data.userInfo.id
									// 强制刷新页面状态
									this.$forceUpdate()
									this.loadUserStats()
									uni.showToast({
										title: '登录成功',
										icon: 'success'
									})
									return
								}
							}
						} catch (fallbackError) {
							// 简化登录失败，继续显示错误
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
						nickName: 'H5用户',
						avatarUrl: '',
						fansCount: 0,
						followCount: 0
					}
					
					const mockToken = 'mock_token_' + Date.now()
					
					uni.setStorageSync('token', mockToken)
					uni.setStorageSync('userInfo', mockUserInfo)
					this.hasUserInfo = true
					this.userInfo = mockUserInfo
					this.currentUserId = mockUserInfo.id
					this.userStats = {
						followCount: mockUserInfo.followCount,
						fansCount: mockUserInfo.fansCount
					}
					
					uni.showToast({
						title: '模拟登录成功',
						icon: 'success'
					})
				} catch (error) {
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

			// 清除缓存
			onClearCache() {
				uni.showModal({
					title: '提示',
					content: '确定要清除缓存数据吗？（登录状态不会被清除）',
					success: (res) => {
						if (res.confirm) {
							// 保存登录相关数据
							const token = uni.getStorageSync('token')
							const userInfo = uni.getStorageSync('userInfo')

							// 清除所有缓存
							uni.clearStorageSync()

							// 恢复登录状态
							if (token) {
								uni.setStorageSync('token', token)
							}
							if (userInfo) {
								uni.setStorageSync('userInfo', userInfo)
							}

							uni.showToast({
								title: '清除成功',
								icon: 'success'
							})
						}
					}
				})
			},

			// 清理用户状态
			clearUserState() {
				this.hasUserInfo = false
				this.userInfo = {}
				this.currentUserId = null
				this.userStats = {
					followCount: 0,
					fansCount: 0
				}
				// 强制刷新页面状态
				this.$forceUpdate()
			},

			// 意见反馈
			onFeedback() {
				uni.navigateTo({
					url: '/pages/feedback/feedback'
				})
			},

			// 关于我们
			onAbout() {
				uni.navigateTo({
					url: '/pages/about/about'
				})
			},

			// 显示关注列表
			async onShowFollowList() {
				if (!this.hasUserInfo) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				try {
					this.modalTitle = '关注列表'
					this.showUserListModal = true
					this.userList = []
					
					const res = await getFollowList(this.userInfo.id)
					if (res.data) {
						this.userList = res.data
					}
				} catch (error) {
					uni.showToast({
						title: '获取关注列表失败',
						icon: 'none'
					})
				}
			},

			// 显示粉丝列表
			async onShowFansList() {
				if (!this.hasUserInfo) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				try {
					this.modalTitle = '粉丝列表'
					this.showUserListModal = true
					this.userList = []
					
					const res = await getFansList(this.userInfo.id)
					if (res.data) {
						this.userList = res.data
					}
				} catch (error) {
					uni.showToast({
						title: '获取粉丝列表失败',
						icon: 'none'
					})
				}
			},

			// 关闭用户列表弹窗
			closeUserListModal() {
				this.showUserListModal = false
				this.userList = []
				this.modalTitle = ''
			},

			// 切换关注状态
			async toggleFollow(user) {
				if (!this.hasUserInfo) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				try {
					if (user.isFollowed) {
						// 取消关注
						await unfollowUser(user.userId)
						user.isFollowed = false
						uni.showToast({
							title: '已取消关注',
							icon: 'success'
						})
					} else {
						// 关注
						await followUser(user.userId)
						user.isFollowed = true
						uni.showToast({
							title: '关注成功',
							icon: 'success'
						})
					}
					
					// 更新本地统计数据
					this.loadUserStats()
				} catch (error) {
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import url("./profile.scss");
</style>