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
				loadingMore: false
			}
		},
		onLoad() {
			this.loadData()
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
					
					console.log('开始加载数据...')
					
					const [bannerRes, categoryRes] = await Promise.all([
						getBannerList(),
						getCategoryList()
					])

					console.log('Banner数据:', bannerRes)
					console.log('分类数据:', categoryRes)

					this.banners = bannerRes.data || []
					this.categories = categoryRes.data || [] // 显示所有分类
					this.loading = false
					this.pagination = { ...this.pagination, current: 1 }
					this.allDishes = []
					this.hasMore = true
					
					// 加载菜品列表
					await this.loadAllDishes()
					
					console.log('数据设置完成:', {
						banners: this.banners.length,
						categories: this.categories.length,
						allDishes: this.allDishes.length
					})
				} catch (error) {
					console.error('加载数据失败:', error)
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

					const res = await getAllDishes(params)
					const newDishes = res.data?.records || []

					this.allDishes = this.pagination.current === 1 ? newDishes : [...this.allDishes, ...newDishes]
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
					this.hasMore = newDishes.length === this.pagination.size
				} catch (error) {
					console.error('加载菜品列表失败:', error)
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
					console.error('加载更多失败:', error)
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

					const res = await getAllDishes(params)
					const refreshedDishes = res.data?.records || []

					this.allDishes = refreshedDishes
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
				} catch (error) {
					console.error('刷新菜品数据失败:', error)
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
					console.error('分类数据无效:', category)
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