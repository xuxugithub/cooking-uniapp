<template>
	<view class="container">
		<!-- 菜品图片 -->
		<view class="dish-image-section" v-if="dish">
			<image class="dish-image" :src="getImageUrl(dish.image)" mode="aspectFill"></image>
			<view class="dish-overlay">
				<text class="dish-name">{{dish.name}}</text>
				<view class="dish-basic-info">
					<text class="dish-difficulty" :style="{color: getDifficultyColor(dish.difficulty)}">
						{{getDifficultyText(dish.difficulty)}}
					</text>
					<text class="dish-time">{{dish.cookingTime}}分钟</text>
					<text class="dish-servings">{{dish.servings}}人份</text>
				</view>
			</view>
		</view>

		<!-- 菜品信息 -->
		<view class="dish-info-section" v-if="dish">
			<view class="info-item">
				<text class="info-label">简介</text>
				<text class="info-content">{{dish.description || '暂无简介'}}</text>
			</view>
			<view class="dish-stats">
				<view class="stat-item">
					<text class="stat-number">{{dish.viewCount || 0}}</text>
					<text class="stat-label">浏览</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{dish.collectCount || 0}}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{dish.shareCount || 0}}</text>
					<text class="stat-label">分享</text>
				</view>
			</view>
		</view>

		<!-- 食材列表 -->
		<view class="ingredients-section" v-if="ingredients.length > 0">
			<text class="section-title">所需食材</text>
			<view class="ingredients-list">
				<view class="ingredient-item" v-for="item in ingredients" :key="item.id">
					<text class="ingredient-name">{{item.name}}</text>
					<text class="ingredient-amount">{{item.amount}}{{item.unit}}</text>
				</view>
			</view>
		</view>

		<!-- 制作步骤 -->
		<view class="steps-section" v-if="steps.length > 0">
			<text class="section-title">制作步骤</text>
			<view class="steps-list">
				<view class="step-item" v-for="(item, index) in steps" :key="item.id">
					<view class="step-number">{{index + 1}}</view>
					<view class="step-content">
						<text class="step-description">{{item.description}}</text>
						<image 
							v-if="item.image" 
							class="step-image" 
							:src="getImageUrl(item.image)" 
							mode="aspectFill"
							@tap="onPreviewImage"
							:data-url="getImageUrl(item.image)"
						></image>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-actions" v-if="dish">
			<view class="action-btn" @tap.stop="onToggleFavorite">
				<view class="heart-icon" :class="{ 'favorited': isFavorite }">
					{{ isFavorite ? '❤️' : '🤍' }}
				</view>
				<view class="action-text">{{isFavorite ? '已收藏' : '收藏'}}</view>
			</view>
			<button class="action-btn" open-type="share">
				<view class="action-icon">📤</view>
				<view class="action-text">分享</view>
			</button>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
	import { getDishById, getDishSteps, getDishIngredients, toggleFavorite, increaseViewCount, recordViewHistory } from '../../api/dish.js'
	import { getImageUrl, getDifficultyText, getDifficultyColor } from '../../utils/util.js'

	export default {
		data() {
			return {
				dishId: null,
				dish: null,
				steps: [],
				ingredients: [],
				loading: true,
				isFavorite: false,
				// 浏览记录相关
				enterTime: null,
				hasRecordedView: false,
				viewTimer: null
			}
		},
		onLoad(options) {
			if (options.id) {
				this.dishId = options.id
				this.enterTime = Date.now()
				this.hasRecordedView = false
				this.loadDishDetail()
				this.checkFavoriteStatus()
			}
		},
		onShow() {
			// 重置进入时间（从其他页面返回时）
			if (this.dishId && !this.enterTime) {
				this.enterTime = Date.now()
				this.startViewTimer()
			}
			// 重新加载详情以获取最新的收藏状态
			if (this.dishId) {
				this.loadDishDetail()
			}
		},
		onHide() {
			// 页面隐藏时清除定时器
			this.clearViewTimer()
		},
		onUnload() {
			// 页面卸载时清除定时器
			this.clearViewTimer()
		},
		methods: {
			// 加载菜品详情
			async loadDishDetail() {
				try {
					this.loading = true
					
					const [dishRes, stepsRes, ingredientsRes] = await Promise.all([
						getDishById(this.dishId),
						getDishSteps(this.dishId),
						getDishIngredients(this.dishId)
					])

					this.dish = dishRes.data
					this.steps = stepsRes.data || []
					this.ingredients = ingredientsRes.data || []
					
					// 从后端返回的数据中获取收藏状态
					if (dishRes.data && dishRes.data.isFavorite !== undefined) {
						this.isFavorite = dishRes.data.isFavorite
					} else {
						// 如果后端没有返回，则从本地存储获取
						this.isFavorite = false
						this.checkFavoriteStatus()
					}
					
					// 确保 dish 对象存在，以便底部按钮显示
					if (!this.dish) {
						console.error('菜品数据为空')
						uni.showToast({
							title: '菜品不存在',
							icon: 'none'
						})
					}
					
					this.loading = false

					// 设置页面标题
					if (dishRes.data?.name) {
						uni.setNavigationBarTitle({
							title: dishRes.data.name
						})
					}

					// 页面加载完成后开始浏览计时
					this.startViewTimer()
				} catch (error) {
					console.error('加载菜品详情失败:', error)
					this.loading = false
					this.dish = null
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				}
			},

			// 开始浏览计时
			startViewTimer() {
				if (this.hasRecordedView) return
				
				// 5秒后记录有效浏览（增加时间以确保是有意义的浏览）
				this.viewTimer = setTimeout(() => {
					this.recordValidView()
				}, 5000)
			},

			// 清除浏览计时器
			clearViewTimer() {
				if (this.viewTimer) {
					clearTimeout(this.viewTimer)
					this.viewTimer = null
				}
			},

			// 记录有效浏览
			async recordValidView() {
				if (this.hasRecordedView || !this.dishId) return
				
				this.hasRecordedView = true
				
				try {
					// 记录用户浏览历史（后端会根据15分钟规则自动处理浏览量增加）
					try {
						const response = await recordViewHistory(this.dishId)
						console.log('浏览历史记录成功:', response)
						
						// 重新获取菜品信息以更新浏览量（如果后端增加了的话）
						const dishRes = await getDishById(this.dishId)
						if (dishRes.data) {
							this.dish.viewCount = dishRes.data.viewCount
						}
					} catch (error) {
						console.log('记录浏览历史失败，可能用户未登录:', error)
						// 未登录用户，直接增加浏览量（无法应用15分钟规则）
						await increaseViewCount(this.dishId)
						if (this.dish) {
							this.dish.viewCount = (this.dish.viewCount || 0) + 1
						}
						// 记录到本地存储作为备选
						this.recordLocalViewHistory()
					}
				} catch (error) {
					console.error('记录浏览失败:', error)
				}
			},

			// 记录本地浏览历史
			recordLocalViewHistory() {
				try {
					const viewHistory = uni.getStorageSync('viewHistory') || []
					const dishId = this.dishId
					const dish = this.dish
					
					if (!dish) return
					
					// 查找是否已存在
					const existingIndex = viewHistory.findIndex(item => item.id == dishId)
					
					const historyItem = {
						id: dish.id,
						name: dish.name,
						image: dish.image,
						description: dish.description,
						difficulty: dish.difficulty,
						cookingTime: dish.cookingTime,
						categoryName: dish.categoryName,
						viewTime: new Date().toISOString(),
						viewCount: 1
					}
					
					if (existingIndex >= 0) {
						// 更新现有记录
						viewHistory[existingIndex] = {
							...viewHistory[existingIndex],
							viewTime: historyItem.viewTime,
							viewCount: (viewHistory[existingIndex].viewCount || 0) + 1
						}
					} else {
						// 添加新记录
						viewHistory.unshift(historyItem)
					}
					
					// 只保留最近100条记录
					if (viewHistory.length > 100) {
						viewHistory.splice(100)
					}
					
					uni.setStorageSync('viewHistory', viewHistory)
				} catch (error) {
					console.error('记录本地浏览历史失败:', error)
				}
			},

			// 检查收藏状态
			checkFavoriteStatus() {
				const favorites = uni.getStorageSync('favorites') || []
				const isFavorite = favorites.some(item => item.id == this.dishId)
				this.isFavorite = isFavorite
			},

			// 收藏/取消收藏
			async onToggleFavorite() {
				if (!this.dish) return
				
				try {
					// 先尝试调用后端接口
					let backendResult = null
					try {
						const response = await toggleFavorite(this.dishId)
						backendResult = response.data
						console.log('后端收藏接口调用成功:', backendResult)
					} catch (error) {
						console.log('后端收藏接口调用失败:', error)
						uni.showToast({
							title: error.message || '操作失败，请先登录',
							icon: 'none'
						})
						return
					}
					
					// 根据后端结果更新界面
					if (backendResult) {
						// 使用后端返回的状态
						this.isFavorite = backendResult.isFavorite
						if (backendResult.collectCount !== undefined) {
							this.dish.collectCount = backendResult.collectCount
						}
						
						// 更新本地存储
						let favorites = uni.getStorageSync('favorites') || []
						if (this.isFavorite) {
							// 添加收藏
							const favoriteItem = {
								id: this.dish.id,
								name: this.dish.name,
								image: this.dish.image,
								description: this.dish.description,
								difficulty: this.dish.difficulty,
								cookingTime: this.dish.cookingTime,
								categoryName: this.dish.categoryName,
								viewCount: this.dish.viewCount,
								collectCount: this.dish.collectCount,
								createTime: new Date().toISOString()
							}
							
							// 移除已存在的项目（如果有）
							favorites = favorites.filter(item => item.id != this.dishId)
							favorites.unshift(favoriteItem)
						} else {
							// 取消收藏
							favorites = favorites.filter(item => item.id != this.dishId)
						}
						
						uni.setStorageSync('favorites', favorites)
						
						uni.showToast({
							title: backendResult.message || (this.isFavorite ? '收藏成功' : '取消收藏成功'),
							icon: 'success'
						})
					}
					
				} catch (error) {
					console.error('收藏操作失败:', error)
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			},

			// 预览图片
			onPreviewImage(e) {
				const { url } = e.currentTarget.dataset
				uni.previewImage({
					current: url,
					urls: [url]
				})
			},

			// 分享
			onShareAppMessage() {
				return {
					title: `推荐一道美味的${this.dish?.name}`,
					path: `/pages/dish-detail/dish-detail?id=${this.dishId}`,
					imageUrl: getImageUrl(this.dish?.image)
				}
			},

			// 获取图片URL
			getImageUrl(imagePath) {
				return getImageUrl(imagePath)
			},

			// 获取难度文本
			getDifficultyText(difficulty) {
				return getDifficultyText(difficulty)
			},

			// 获取难度颜色
			getDifficultyColor(difficulty) {
				return getDifficultyColor(difficulty)
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import url("./dish-detail.scss");
</style>