<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-section">
			<view class="user-info" v-if="hasUserInfo">
				<view class="avatar-container" @tap="onChooseAvatar">
					<!-- 默认展示微信头像，用户点击可更换 -->
					<open-data type="userAvatarUrl" class="avatar-open-data"></open-data>
					<text class="avatar-tip">点击更换</text>
				</view>
				<view class="user-details">
					<!-- 默认展示微信昵称，用户点击可修改 -->
					<view class="nickname-wrapper" @tap="onEditNickname">
						<open-data type="userNickName" class="nickname-open-data"></open-data>
					</view>
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
					<text class="login-title">登录后享受更多功能</text>
					<text class="login-desc">收藏菜品、记录浏览历史</text>
				</view>
				<button class="login-btn" @tap="onLogin">立即登录</button>
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

		<!-- 修改头像弹窗 -->
		<view class="edit-modal" v-if="showAvatarModal" @tap="showAvatarModal = false">
			<view class="edit-modal-content" @tap.stop>
				<view class="edit-modal-header">
					<text class="edit-modal-title">更换头像</text>
					<text class="edit-modal-close" @tap="showAvatarModal = false">×</text>
				</view>
				<view class="edit-modal-body">
					<text class="edit-modal-tip">点击下方按钮选择新头像</text>
					<button class="choose-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatarResult">
						<image v-if="tempAvatarUrl" class="preview-avatar" :src="tempAvatarUrl" mode="aspectFill"></image>
						<view v-else class="choose-avatar-placeholder">
							<text class="choose-avatar-icon">📷</text>
							<text class="choose-avatar-text">选择头像</text>
						</view>
					</button>
				</view>
				<view class="edit-modal-footer">
					<button class="edit-cancel-btn" @tap="showAvatarModal = false">取消</button>
					<button class="edit-confirm-btn" @tap="saveAvatar" :disabled="!tempAvatarUrl">保存</button>
				</view>
			</view>
		</view>

		<!-- 修改昵称弹窗 -->
		<view class="edit-modal" v-if="showNicknameModal" @tap="showNicknameModal = false">
			<view class="edit-modal-content" @tap.stop>
				<view class="edit-modal-header">
					<text class="edit-modal-title">修改昵称</text>
					<text class="edit-modal-close" @tap="showNicknameModal = false">×</text>
				</view>
				<view class="edit-modal-body">
					<input
						class="nickname-input"
						type="nickname"
						placeholder="请输入昵称"
						v-model="tempNickname"
						@input="onNicknameInput"
					/>
				</view>
				<view class="edit-modal-footer">
					<button class="edit-cancel-btn" @tap="showNicknameModal = false">取消</button>
					<button class="edit-confirm-btn" @tap="saveNickname" :disabled="!tempNickname">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { wxLogin, getUserInfo, getFollowList, getFansList, followUser, unfollowUser, updateUserInfo } from '../../api/user.js'
	import { API_BASE_URL } from '../../config/app.js'

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
				currentUserId: null,
				// 修改头像/昵称弹窗
				showAvatarModal: false,
				showNicknameModal: false,
				tempAvatarUrl: '',
				tempNickname: ''
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

			// 登录（静默登录）
			async onLogin() {
				// #ifdef MP-WEIXIN
				try {
					uni.showLoading({
						title: '登录中...',
						mask: true
					})

					const loginRes = await uni.login()
					if (!loginRes.code) {
						throw new Error('获取微信登录凭证失败')
					}

					// 静默登录，不获取用户详细信息
					const res = await wxLogin(loginRes.code, null)

					uni.hideLoading()

					if (res.data && res.data.token) {
						uni.setStorageSync('token', res.data.token)
						uni.setStorageSync('userInfo', res.data.userInfo)
						this.hasUserInfo = true
						this.userInfo = res.data.userInfo
						this.currentUserId = res.data.userInfo.id
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
					uni.hideLoading()
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

			// 选择头像 - 弹出弹窗
			onChooseAvatar() {
				this.tempAvatarUrl = ''
				this.showAvatarModal = true
			},

			// 微信选择头像回调
			onChooseAvatarResult(e) {
				this.tempAvatarUrl = e.detail.avatarUrl
			},

			// 保存头像
			async saveAvatar() {
				if (!this.tempAvatarUrl) return

				try {
					uni.showLoading({ title: '上传中...', mask: true })
					const uploadRes = await uni.uploadFile({
						url: API_BASE_URL + '/api/app/file/upload',
						filePath: this.tempAvatarUrl,
						name: 'file'
					})
					uni.hideLoading()

					if (uploadRes.data) {
						const data = JSON.parse(uploadRes.data)
						if (data.code === 200 && data.data && data.data.fileName) {
							const avatarUrl = API_BASE_URL + '/api/admin/file/preview/' + data.data.fileName

							await updateUserInfo({ avatarUrl })
							this.userInfo.avatarUrl = avatarUrl
							uni.setStorageSync('userInfo', this.userInfo)
							this.showAvatarModal = false
							uni.showToast({ title: '头像已更新', icon: 'success' })
						}
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: '上传失败', icon: 'none' })
				}
			},

			// 编辑昵称 - 弹出弹窗
			onEditNickname() {
				this.tempNickname = ''
				this.showNicknameModal = true
			},

			// 昵称输入回调
			onNicknameInput(e) {
				this.tempNickname = e.detail.value
			},

			// 保存昵称
			async saveNickname() {
				if (!this.tempNickname) return

				try {
					uni.showLoading({ title: '保存中...', mask: true })
					await updateUserInfo({ nickName: this.tempNickname })
					uni.hideLoading()

					this.userInfo.nickName = this.tempNickname
					uni.setStorageSync('userInfo', this.userInfo)
					this.showNicknameModal = false
					uni.showToast({ title: '昵称已更新', icon: 'success' })
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: '保存失败', icon: 'none' })
				}
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