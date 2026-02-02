<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input-wrapper">
				<input 
					class="search-input" 
					placeholder="搜索菜品、食材..." 
					v-model="keyword" 
					@input="onSearchInput"
					@confirm="onSearchConfirm"
					:focus="true"
					confirm-type="search" 
				/>
				<text class="search-btn" @tap="onSearchConfirm">搜索</text>
			</view>
		</view>

		<!-- 搜索建议区域 -->
		<view class="search-suggestions" v-if="!hasSearched">
			<!-- 搜索历史 -->
			<view class="history-section" v-if="searchHistory.length > 0">
				<view class="section-header">
					<text class="section-title">搜索历史</text>
					<text class="clear-btn" @tap="onClearHistory">清空</text>
				</view>
				<view class="keywords-list">
					<text 
						class="keyword-item" 
						v-for="item in searchHistory" 
						:key="item"
						@tap="onHistoryTap" 
						:data-keyword="item"
					>{{item}}</text>
				</view>
			</view>

			<!-- 热门搜索 -->
			<view class="hot-section">
				<view class="section-title">热门搜索</view>
				<view class="keywords-list">
					<text 
						class="keyword-item hot" 
						v-for="item in hotKeywords" 
						:key="item"
						@tap="onHotKeywordTap" 
						:data-keyword="item"
					>{{item}}</text>
				</view>
			</view>
		</view>

		<!-- 搜索结果 -->
		<view class="search-results" v-if="hasSearched">
			<!-- 结果统计 -->
			<view class="results-header" v-if="!loading">
				<text class="results-count">找到 {{pagination.total}} 个相关菜品</text>
			</view>

			<!-- 结果列表 -->
			<view class="results-list" v-if="searchResults.length > 0">
				<view 
					class="result-item" 
					v-for="item in searchResults" 
					:key="item.id" 
					@tap="onDishTap" 
					:data-dish="item"
				>
					<image class="result-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
					<view class="result-info">
						<text class="result-name">{{item.name}}</text>
						<text class="result-desc" v-if="item.description">{{item.description}}</text>
						<view class="result-meta">
							<text class="result-difficulty" :style="{color: getDifficultyColor(item.difficulty)}">
								{{getDifficultyText(item.difficulty)}}
							</text>
							<text class="result-time">{{item.cookingTime}}分钟</text>
							<text class="result-category">{{item.categoryName}}</text>
						</view>
						<view class="result-stats">
							<text class="result-views">{{item.viewCount || 0}}次浏览</text>
							<text class="result-collects">{{item.collectCount || 0}}次收藏</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view class="load-more" v-if="loadingMore">
				<text>加载中...</text>
			</view>

			<!-- 没有更多 -->
			<view class="no-more" v-if="!hasMore && searchResults.length > 0">
				<text>没有更多了</text>
			</view>

			<!-- 空结果 -->
			<view class="empty-results" v-if="!loading && searchResults.length === 0">
				<text class="empty-icon">🔍</text>
				<text class="empty-text">没有找到相关菜品</text>
				<text class="empty-tip">试试其他关键词吧</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>搜索中...</text>
		</view>
	</view>
</template>

<script>
	import { searchDish } from '../../api/dish.js'
	import { getImageUrl, getDifficultyText, getDifficultyColor, debounce } from '../../utils/util.js'

	export default {
		data() {
			return {
				keyword: '',
				searchHistory: [],
				hotKeywords: ['红烧肉', '宫保鸡丁', '麻婆豆腐', '糖醋排骨', '鱼香肉丝', '回锅肉'],
				searchResults: [],
				loading: false,
				hasSearched: false,
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
			if (options.keyword) {
				this.keyword = decodeURIComponent(options.keyword)
				this.performSearch()
			}
			this.loadSearchHistory()
		},
		onShow() {
			this.loadSearchHistory()
		},
		onReachBottom() {
			if (this.hasMore && !this.loadingMore && this.hasSearched) {
				this.loadMoreResults()
			}
		},
		methods: {
			// 搜索输入
			onSearchInput(e) {
				this.keyword = e.detail.value
				// 实时搜索（防抖）
				this.debouncedSearch()
			},

			// 防抖搜索
			debouncedSearch: debounce(function() {
				if (this.keyword.trim()) {
					this.performSearch()
				}
			}, 500),

			// 搜索确认
			onSearchConfirm() {
				if (this.keyword.trim()) {
					this.performSearch()
				}
			},

			// 执行搜索
			async performSearch() {
				const keyword = this.keyword.trim()
				if (!keyword) return

				try {
					this.loading = true
					this.hasSearched = true
					this.pagination = { ...this.pagination, current: 1 }
					this.searchResults = []
					this.hasMore = true

					const params = {
						current: 1,
						size: this.pagination.size
					}

					const res = await searchDish(keyword, params)
					const results = res.data?.records || []

					this.searchResults = results
					this.pagination = {
						...this.pagination,
						total: res.data?.total || 0
					}
					this.hasMore = results.length === this.pagination.size
					this.loading = false

					// 保存搜索历史
					this.saveSearchHistory(keyword)

				} catch (error) {
					this.loading = false
					uni.showToast({
						title: '搜索失败，请重试',
						icon: 'none'
					})
				}
			},

			// 加载更多搜索结果
			async loadMoreResults() {
				if (this.loadingMore) return

				this.loadingMore = true

				try {
					const newPagination = {
						...this.pagination,
						current: this.pagination.current + 1
					}

					const params = {
						current: newPagination.current,
						size: newPagination.size
					}

					const res = await searchDish(this.keyword, params)
					const newResults = res.data?.records || []

					this.searchResults = [...this.searchResults, ...newResults]
					this.pagination = newPagination
					this.hasMore = newResults.length === this.pagination.size
					this.loadingMore = false

				} catch (error) {
					this.loadingMore = false
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},

			// 热门关键词点击
			onHotKeywordTap(e) {
				const { keyword } = e.currentTarget.dataset
				this.keyword = keyword
				this.performSearch()
			},

			// 搜索历史点击
			onHistoryTap(e) {
				const { keyword } = e.currentTarget.dataset
				this.keyword = keyword
				this.performSearch()
			},

			// 清空搜索历史
			onClearHistory() {
				uni.showModal({
					title: '提示',
					content: '确定要清空搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.searchHistory = []
							uni.removeStorageSync('searchHistory')
							uni.showToast({
								title: '已清空',
								icon: 'success'
							})
						}
					}
				})
			},

			// 菜品点击事件
			onDishTap(e) {
				const { dish } = e.currentTarget.dataset
				uni.navigateTo({
					url: `/pages/dish-detail/dish-detail?id=${dish.id}`
				})
			},

			// 加载搜索历史
			loadSearchHistory() {
				const history = uni.getStorageSync('searchHistory') || []
				this.searchHistory = history
			},

			// 保存搜索历史
			saveSearchHistory(keyword) {
				let history = uni.getStorageSync('searchHistory') || []
				
				// 移除重复项
				history = history.filter(item => item !== keyword)
				
				// 添加到开头
				history.unshift(keyword)
				
				// 限制历史记录数量
				if (history.length > 10) {
					history = history.slice(0, 10)
				}
				
				uni.setStorageSync('searchHistory', history)
				this.searchHistory = history
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
	@import url("./search.scss");
</style>