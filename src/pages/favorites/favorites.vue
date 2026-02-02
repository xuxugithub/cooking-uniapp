<template>
	<view class="container">
		<!-- 收藏列表 -->
		<view class="favorites-list" v-if="favorites.length > 0">
			<view 
				class="favorite-item" 
				v-for="item in favorites" 
				:key="item.id" 
				@tap="onDishTap" 
				:data-dish="item"
			>
				<image class="favorite-image" :src="getImageUrl(item.image)" mode="aspectFill"></image>
				<view class="favorite-info">
					<text class="favorite-name">{{item.name}}</text>
					<text class="favorite-desc" v-if="item.description">{{item.description}}</text>
					<view class="favorite-meta">
						<text class="favorite-difficulty" :style="{color: getDifficultyColor(item.difficulty)}">
							{{getDifficultyText(item.difficulty)}}
						</text>
						<text class="favorite-time">{{item.cookingTime}}分钟</text>
						<text class="favorite-category">{{item.categoryName}}</text>
					</view>
					<view class="favorite-stats">
						<text class="favorite-views">{{item.viewCount || 0}}次浏览</text>
						<text class="favorite-collects">{{item.collectCount || 0}}次收藏</text>
					</view>
				</view>
				<view class="favorite-actions">
					<text class="remove-btn" @tap.stop="onRemoveFavorite" :data-dish="item">取消收藏</text>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-if="!loading && favorites.length === 0">
			<text class="empty-icon">❤️</text>
			<text class="empty-text">暂无收藏</text>
			<text class="empty-tip">去收藏一些喜欢的菜品吧</text>
		</view>
	</view>
</template>

<script>
	import { getUserFavorites } from '../../api/user.js'
	import { toggleFavorite } from '../../api/dish.js'
	import { getImageUrl, getDifficultyText, getDifficultyColor } from '../../utils/util.js'

	export default {
		data() {
			return {
				favorites: [],
				loading: true
			}
		},
		onLoad() {
			this.loadFavorites()
		},
		onShow() {
			this.loadFavorites()
		},
		methods: {
			// 加载收藏列表
			async loadFavorites() {
				try {
					this.loading = true
					// 先从本地存储获取
					const localFavorites = uni.getStorageSync('favorites') || []
					this.favorites = localFavorites
					this.loading = false

					// 尝试从服务器获取
					try {
						const res = await getUserFavorites()
						if (res.data) {
							this.favorites = res.data
							uni.setStorageSync('favorites', res.data)
						}
					} catch (error) {
						// 获取服务器收藏列表失败，使用本地数据
					}
				} catch (error) {
					this.loading = false
				}
			},

			// 菜品点击事件
			onDishTap(e) {
				const { dish } = e.currentTarget.dataset
				uni.navigateTo({
					url: `/pages/dish-detail/dish-detail?id=${dish.id}`
				})
			},

			// 取消收藏
			async onRemoveFavorite(e) {
				const { dish } = e.currentTarget.dataset
				
				try {
					// 先更新本地数据
					this.favorites = this.favorites.filter(item => item.id !== dish.id)
					const localFavorites = uni.getStorageSync('favorites') || []
					const updatedFavorites = localFavorites.filter(item => item.id !== dish.id)
					uni.setStorageSync('favorites', updatedFavorites)

					// 调用后端接口
					try {
						await toggleFavorite(dish.id)
						uni.showToast({
							title: '已取消收藏',
							icon: 'success'
						})
					} catch (error) {
						// 后端取消收藏失败，但本地已更新
						uni.showToast({
							title: '已取消收藏',
							icon: 'success'
						})
					}
				} catch (error) {
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
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
	@import url("./favorites.scss");
</style>