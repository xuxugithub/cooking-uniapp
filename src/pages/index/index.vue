<template>
	<view class="container">
		<!-- 顶部搜索栏 -->
		<view class="top-search-bar">
			<view class="search-input-container">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input-field" 
					placeholder="搜索菜品、食材..." 
					v-model="searchValue"
					@input="onSearchInput"
					@confirm="onSearchConfirm"
					confirm-type="search" 
				/>
				<text class="search-btn" @tap="onSearchConfirm" v-if="searchValue">搜索</text>
			</view>
		</view>

		<!-- Banner轮播 -->
		<view class="banner-section" v-if="banners.length > 0">
			<swiper 
				class="banner-swiper" 
				:indicator-dots="true" 
				:autoplay="true" 
				:interval="3000" 
				:duration="500"
			>
				<swiper-item v-for="item in banners" :key="item.id" @tap="onBannerTap" :data-item="item">
					<image class="banner-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
					<view class="banner-overlay">
						<view class="banner-title" v-if="item.title">{{item.title}}</view>
						<view class="banner-subtitle">厨小教，零基础学做菜超简单</view>
					</view>
				</swiper-item>
			</swiper>
		</view>

		<!-- 分类导航 -->
		<view class="category-section" v-if="categories.length > 0">
			<view class="category-header">
				<text class="category-title">菜品分类</text>
			</view>
			<view class="category-list">
				<view 
					class="category-item" 
					v-for="item in categories" 
					:key="item.id" 
					@tap="onCategoryTap" 
					:data-category="item"
				>
					<view class="category-icon-wrapper" v-if="item.icon">
						<image class="category-icon" :src="getImageUrl(item.icon)" mode="aspectFill"></image>
					</view>
					<view class="category-icon-placeholder" v-else>
						<text class="category-icon-text">{{item.name.charAt(0)}}</text>
					</view>
					<text class="category-name">{{item.name}}</text>
				</view>
				<view class="category-item more-btn" @tap="goToCategory">
					<view class="category-icon-wrapper more-icon-wrapper">
						<text class="more-icon">⋯</text>
					</view>
					<text class="category-name">更多</text>
				</view>
			</view>
		</view>

		<!-- 全部菜品 -->
		<view class="recommend-section" v-if="allDishes.length > 0">
			<view class="section-header">
				<text class="section-title">全部菜品</text>
				<!-- 排序选项 -->
				<view class="sort-options">
					<view 
						class="sort-item" 
						:class="currentSortType === item.key ? 'active' : ''"
						v-for="item in sortOptions" 
						:key="item.key" 
						@tap="onSortChange" 
						:data-sort="item.key"
					>
						{{item.name}}
					</view>
				</view>
			</view>
			<view class="recommend-grid">
				<view 
					class="recommend-item" 
					v-for="item in allDishes" 
					:key="item.id" 
					@tap="onDishTap" 
					:data-dish="item"
				>
					<image class="recommend-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
					<view class="recommend-info">
						<text class="recommend-name">{{item.name}}</text>
						<view class="recommend-meta">
							<text class="recommend-category">{{item.categoryName}}</text>
							<text class="recommend-time">{{item.cookingTime}}分钟</text>
						</view>
						<view class="recommend-stats">
							<text class="stat-item">👁️ {{item.viewCount || 0}}</text>
							<text class="stat-item">❤️ {{item.collectCount || 0}}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 加载更多 -->
			<view class="load-more" v-if="loadingMore">
				<text>加载中...</text>
			</view>
			
			<!-- 没有更多数据 -->
			<view class="no-more" v-if="!hasMore && allDishes.length > 0">
				<text>没有更多数据了</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-if="!loading && banners.length === 0 && categories.length === 0 && allDishes.length === 0">
			<text class="empty-icon">🍽️</text>
            			<text class="empty-text">暂无数据</text>
		</view>

		<!-- 小助手入口 -->
		<view
			class="assistant-entry"
			:style="{ left: `${assistantPosition.left}px`, top: `${assistantPosition.top}px` }"
			@touchstart.stop="onAssistantTouchStart"
			@touchmove.stop.prevent="onAssistantTouchMove"
			@touchend.stop="onAssistantTouchEnd"
			@touchcancel.stop="onAssistantTouchEnd"
		>
			<view class="assistant-avatar">🤖</view>
			<text class="assistant-text">小助手</text>
		</view>
	</view>
</template>

<script>
	import { getBannerList } from '../../api/banner.js'
	import { getAllDishes } from '../../api/dish.js'
	import { getCategoryList } from '../../api/category.js'
	import { getImageUrl } from '../../utils/util.js'

	export default {
		data() {
			return {
				banners: [],
				categories: [],
				allDishes: [],
				loading: true,
				searchValue: '',
				// 菜品列表相关
				currentSortType: 'collect', // collect-收藏最多, view-浏览最多, latest-最新上架
				sortOptions: [
					{ key: 'collect', name: '收藏最多' },
					{ key: 'view', name: '浏览最多' },
					{ key: 'latest', name: '最新上架' }
				],
				pagination: {
					current: 1,
					size: 10,
					total: 0
				},
				hasMore: true,
				loadingMore: false,
				assistantPosition: {
					left: 0,
					top: 0
				},
				assistantBounds: {
					minLeft: 0,
					maxLeft: 0,
					minTop: 0,
					maxTop: 0
				},
				assistantDragState: {
					touching: false,
					startX: 0,
					startY: 0,
					startLeft: 0,
					startTop: 0,
					moved: false
				}
			}
		},
		onLoad() {
			this.initAssistantPosition()
			this.loadData()
		},
		onResize() {
			this.refreshAssistantBounds()
		},
		onShow() {
			// 每次显示页面时刷新菜品数据以获取最新的浏览量
			if (this.allDishes.length > 0) {
				this.refreshDishData()
			}
		},
		onPullDownRefresh() {
			this.pagination = { ...this.pagination, current: 1 }
			this.allDishes = []
			this.hasMore = true
			this.loadData().then(() => {
				uni.stopPullDownRefresh()
			})
		},
		onReachBottom() {
			if (this.hasMore && !this.loadingMore) {
				this.loadMoreDishes()
			}
		},
		methods: {
			// 加载页面数据
			async loadData() {
				try {
					this.loading = true
					
					const [bannerRes, categoryRes] = await Promise.all([
						getBannerList({ loading: false }),
						getCategoryList({ loading: false })
					])

					this.banners = bannerRes.data || []
					this.categories = categoryRes.data || [] // 显示所有分类
					this.loading = false
					this.pagination = { ...this.pagination, current: 1 }
					this.allDishes = []
					this.hasMore = true
					
					// 加载菜品列表
					await this.loadAllDishes()
					
				} catch (error) {
					this.loading = false
					// 确保数据有默认值，避免页面空白
					if (!this.banners || this.banners.length === 0) this.banners = []
					if (!this.categories || this.categories.length === 0) this.categories = []
					if (!this.allDishes || this.allDishes.length === 0) this.allDishes = []
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				}
			},

			// 加载所有菜品列表
			async loadAllDishes() {
				try {
					const params = {
						sortType: this.currentSortType,
						current: this.pagination.current,
						size: this.pagination.size
					}

					const res = await getAllDishes(params, { loading: false })
					const newDishes = res.data?.records || []

					this.allDishes = this.pagination.current === 1 ? newDishes : [...this.allDishes, ...newDishes]
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
					this.hasMore = newDishes.length === this.pagination.size
				} catch (error) {
					uni.showToast({
						title: '加载菜品失败',
						icon: 'none'
					})
				}
			},

			// 加载更多菜品
			async loadMoreDishes() {
				if (this.loadingMore) return
				
				this.loadingMore = true
				
				try {
					this.pagination = {
						...this.pagination,
						current: this.pagination.current + 1
					}
					
					await this.loadAllDishes()
				} catch (error) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					this.loadingMore = false
				}
			},

			// 刷新菜品数据（保持当前页面状态，只更新数据）
			async refreshDishData() {
				try {
					const params = {
						sortType: this.currentSortType,
						current: 1,
						size: this.allDishes.length || this.pagination.size
					}

					const res = await getAllDishes(params, { loading: false })
					const refreshedDishes = res.data?.records || []

					this.allDishes = refreshedDishes
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
				} catch (error) {
					// 刷新失败，保持当前状态
				}
			},

			// 切换排序方式
			onSortChange(e) {
				const sortType = e.currentTarget.dataset.sort
				if (sortType === this.currentSortType) return
				
				this.currentSortType = sortType
				this.pagination = { ...this.pagination, current: 1 }
				this.allDishes = []
				this.hasMore = true
				
				this.loadAllDishes()
			},

			// Banner点击事件
			onBannerTap(e) {
				const { item } = e.currentTarget.dataset
				if (item.linkType === 'dish' && item.linkValue) {
					uni.navigateTo({
						url: `/pages/dish-detail/dish-detail?id=${item.linkValue}`
					})
				}
			},

			// 分类点击事件
			onCategoryTap(e) {
				const { category } = e.currentTarget.dataset
				if (!category || !category.id) {
					return
				}
				// 由于分类页面是 tabBar 页面，需要使用 switchTab，但 switchTab 不支持参数
				// 所以先存储分类信息，然后跳转
				uni.setStorageSync('selectedCategory', {
					id: category.id,
					name: category.name
				})
				// 跳转到分类页面
				uni.switchTab({
					url: '/pages/category/category'
				})
			},

			// 菜品点击事件
			onDishTap(e) {
				const { dish } = e.currentTarget.dataset
				uni.navigateTo({
					url: `/pages/dish-detail/dish-detail?id=${dish.id}`
				})
			},

			// 搜索输入
			onSearchInput(e) {
				this.searchValue = e.detail.value
			},

			// 搜索确认
			onSearchConfirm(e) {
				const keyword = e.detail.value || this.searchValue
				if (keyword && keyword.trim()) {
					uni.navigateTo({
						url: `/pages/search/search?keyword=${encodeURIComponent(keyword.trim())}`
					})
				}
			},

			// 进入小助手
			openAssistant() {
				uni.navigateTo({
					url: '/pages/assistant/assistant'
				})
			},


			initAssistantPosition() {
				this.refreshAssistantBounds()
				const cache = uni.getStorageSync('assistantEntryPosition') || {}
				const hasValidCache = Number.isFinite(cache.left) && Number.isFinite(cache.top)

				if (hasValidCache) {
					this.assistantPosition = {
						left: this.clampValue(cache.left, this.assistantBounds.minLeft, this.assistantBounds.maxLeft),
						top: this.clampValue(cache.top, this.assistantBounds.minTop, this.assistantBounds.maxTop)
					}
					return
				}

				const left = this.assistantBounds.maxLeft
				const top = this.clampValue(this.assistantBounds.maxTop - 85, this.assistantBounds.minTop, this.assistantBounds.maxTop)
				this.assistantPosition = { left, top }
			},

			refreshAssistantBounds() {
				const info = uni.getSystemInfoSync()
				const margin = 12
				const avatarSize = 52
				const helperHeight = 82
				const navHeight = (info.statusBarHeight || 20) + 44
				const safeBottom = info.safeAreaInsets?.bottom || 0
				const tabBarHeight = 50 + safeBottom

				const maxLeft = Math.max(margin, info.windowWidth - avatarSize - margin)
				const maxTop = Math.max(navHeight + margin, info.windowHeight - helperHeight - tabBarHeight - margin)

				this.assistantBounds = {
					minLeft: margin,
					maxLeft,
					minTop: navHeight + margin,
					maxTop
				}

				this.assistantPosition = {
					left: this.clampValue(this.assistantPosition.left, this.assistantBounds.minLeft, this.assistantBounds.maxLeft),
					top: this.clampValue(this.assistantPosition.top, this.assistantBounds.minTop, this.assistantBounds.maxTop)
				}
			},

			onAssistantTouchStart(e) {
				const touch = e.touches && e.touches[0]
				if (!touch) return

				this.assistantDragState = {
					touching: true,
					startX: touch.clientX,
					startY: touch.clientY,
					startLeft: this.assistantPosition.left,
					startTop: this.assistantPosition.top,
					moved: false
				}
			},

			onAssistantTouchMove(e) {
				const touch = e.touches && e.touches[0]
				if (!touch || !this.assistantDragState.touching) return

				const deltaX = touch.clientX - this.assistantDragState.startX
				const deltaY = touch.clientY - this.assistantDragState.startY
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
				if (distance > 6) {
					this.assistantDragState.moved = true
				}

				this.assistantPosition = {
					left: this.clampValue(
						this.assistantDragState.startLeft + deltaX,
						this.assistantBounds.minLeft,
						this.assistantBounds.maxLeft
					),
					top: this.clampValue(
						this.assistantDragState.startTop + deltaY,
						this.assistantBounds.minTop,
						this.assistantBounds.maxTop
					)
				}
			},

			onAssistantTouchEnd() {
				if (!this.assistantDragState.touching) {
					return
				}

				const moved = this.assistantDragState.moved
				this.assistantDragState.touching = false

				uni.setStorageSync('assistantEntryPosition', {
					left: this.assistantPosition.left,
					top: this.assistantPosition.top
				})

				if (!moved) {
					this.openAssistant()
				}
			},

			clampValue(value, min, max) {
				const safeValue = Number.isFinite(value) ? value : min
				return Math.min(Math.max(safeValue, min), max)
			},
			// 获取图片URL
			getImageUrl(imagePath) {
				return getImageUrl(imagePath)
			},

			// 导航功能
			goToCategory() {
				uni.switchTab({
					url: '/pages/category/category'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import url("./index.scss");
</style>

