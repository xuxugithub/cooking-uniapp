<template>
	<view class="container">
		<!-- 分类列表 -->
		<view class="categories-section" v-if="!currentCategoryId && type === 'category' && !loading">
			<view class="categories-grid">
				<view 
					class="category-item" 
					v-for="item in categories" 
					:key="item.id" 
					@tap="onCategoryTap" 
					:data-category="item"
				>
					<image class="category-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
					<view class="category-info">
						<text class="category-name">{{item.name}}</text>
						<text class="category-desc" v-if="item.description">{{item.description}}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 菜品列表 -->
		<view class="dishes-section" v-if="(currentCategoryId || type === 'hot') && !loading">
			<!-- 返回按钮 -->
			<view class="back-bar" v-if="currentCategoryId">
				<text class="back-btn" @tap="onBackToCategories">← 返回分类</text>
				<text class="current-category">{{currentCategoryName}}</text>
			</view>
			
			<!-- 菜品网格 -->
			<view class="dishes-grid" v-if="dishes.length > 0">
				<view 
					class="dish-item" 
					v-for="item in dishes" 
					:key="item.id" 
					@tap="onDishTap" 
					:data-dish="item"
				>
					<image class="dish-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
					<view class="dish-info">
						<text class="dish-name">{{item.name}}</text>
						<view class="dish-meta">
							<text class="dish-difficulty" :style="{color: getDifficultyColor(item.difficulty)}">
								{{getDifficultyText(item.difficulty)}}
							</text>
							<text class="dish-time">{{item.cookingTime}}分钟</text>
						</view>
						<view class="dish-stats">
							<text class="dish-views">{{item.viewCount || 0}}次浏览</text>
							<text class="dish-collects">{{item.collectCount || 0}}次收藏</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 加载更多 -->
			<view class="load-more" v-if="loadingMore">
				<text>加载中...</text>
			</view>
			
			<!-- 没有更多 -->
			<view class="no-more" v-if="!hasMore && dishes.length > 0">
				<text>没有更多了</text>
			</view>
			
			<!-- 空状态 -->
			<view class="empty" v-if="dishes.length === 0">
				<text class="empty-icon">🍽️</text>
				<text class="empty-text">暂无菜品</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
	import { getCategoryList } from '../../api/category.js'
	import { getDishPage } from '../../api/dish.js'
	import { getImageUrl, getDifficultyText, getDifficultyColor } from '../../utils/util.js'

	export default {
		data() {
			return {
				categories: [],
				dishes: [],
				loading: true,
				currentCategoryId: null,
				currentCategoryName: '',
				type: 'category', // category 或 hot
				pagination: {
					current: 1,
					size: 10,
					total: 0
				},
				hasMore: true,
				loadingMore: false
			}
		},
		onLoad(options) {
			if (options.categoryId) {
				this.currentCategoryId = options.categoryId
				this.currentCategoryName = decodeURIComponent(options.categoryName || '')
				this.type = 'dish'
				this.loadDishes()
			} else if (options.type === 'hot') {
				this.type = 'hot'
				this.loadDishes()
			} else {
				this.loadCategories()
			}
		},
		onReachBottom() {
			if (this.hasMore && !this.loadingMore && (this.currentCategoryId || this.type === 'hot')) {
				this.loadMoreDishes()
			}
		},
		methods: {
			// 加载分类列表
			async loadCategories() {
				try {
					this.loading = true
					const res = await getCategoryList()
					this.categories = res.data || []
					this.loading = false
				} catch (error) {
					console.error('加载分类失败:', error)
					this.loading = false
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				}
			},

			// 加载菜品列表
			async loadDishes() {
				try {
					this.loading = true
					const params = {
						current: this.pagination.current,
						size: this.pagination.size
					}

					if (this.currentCategoryId) {
						params.categoryId = this.currentCategoryId
					}

					const res = await getDishPage(params)
					const newDishes = res.data?.records || []

					this.dishes = this.pagination.current === 1 ? newDishes : [...this.dishes, ...newDishes]
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
					this.hasMore = newDishes.length === this.pagination.size
					this.loading = false
				} catch (error) {
					console.error('加载菜品失败:', error)
					this.loading = false
					uni.showToast({
						title: '加载失败，请重试',
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
					
					await this.loadDishes()
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

			// 分类点击事件
			onCategoryTap(e) {
				const { category } = e.currentTarget.dataset
				this.currentCategoryId = category.id
				this.currentCategoryName = category.name
				this.type = 'dish'
				this.pagination = { ...this.pagination, current: 1 }
				this.dishes = []
				this.hasMore = true
				this.loadDishes()
			},

			// 返回分类列表
			onBackToCategories() {
				this.currentCategoryId = null
				this.currentCategoryName = ''
				this.type = 'category'
				this.dishes = []
				this.loadCategories()
			},

			// 菜品点击事件
			onDishTap(e) {
				const { dish } = e.currentTarget.dataset
				uni.navigateTo({
					url: `/pages/dish-detail/dish-detail?id=${dish.id}`
				})
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
	@import url("./category.scss");
</style>