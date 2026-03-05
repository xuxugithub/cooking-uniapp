<template>
	<view class="assistant-page">
		<view class="assistant-header">
			<view class="assistant-header-avatar">🤖</view>
			<view class="assistant-header-text">
				<text class="assistant-title">小助手</text>
				<text class="assistant-subtitle">{{ conversationTitle }}</text>
			</view>
		</view>

		<scroll-view
			class="message-list"
			scroll-y
			:scroll-with-animation="true"
			:scroll-into-view="scrollIntoView"
		>
			<view class="state-block" v-if="pageLoading">
				<text class="state-text">正在加载会话...</text>
			</view>

			<view class="state-block" v-else-if="messages.length === 0">
				<text class="state-text">你好，我是小助手，来聊聊今天做什么菜吧。</text>
			</view>

			<view
				class="message-row"
				:class="item.isUser ? 'user' : 'assistant'"
				v-for="item in messages"
				:key="item.localId"
				:id="item.localId"
			>
				<view class="bubble">
					<text class="bubble-text">{{ item.content }}</text>
				</view>
			</view>

			<view class="state-block" v-if="sending">
				<text class="state-text">小助手思考中...</text>
			</view>
		</scroll-view>

		<view class="input-area">
			<textarea
				class="chat-input"
				v-model="inputText"
				placeholder="输入你想问的问题"
				:maxlength="500"
				:disabled="pageLoading || sending"
				:auto-height="true"
				:show-confirm-bar="false"
			/>
			<button
				class="send-btn"
				:class="{ disabled: !canSend }"
				:disabled="!canSend"
				@tap="onSend"
			>
				发送
			</button>
		</view>
	</view>
</template>

<script>
	import {
		getConversationList,
		createConversation,
		getConversationMessages,
		saveConversationMessage,
		streamChat
	} from '../../api/chat.js'

	export default {
		data() {
			return {
				pageLoading: true,
				sending: false,
				currentConversationId: null,
				conversationTitle: '最近会话',
				messages: [],
				inputText: '',
				scrollIntoView: '',
				localMessageSeed: 0,
				currentStreamPromise: null
			}
		},
		computed: {
			canSend() {
				return !this.pageLoading && !this.sending && !!this.inputText.trim()
			}
		},
		onLoad() {
			this.initLatestConversation()
		},
		onUnload() {
			this.stopCurrentStream()
		},
		onPullDownRefresh() {
			this.reloadMessages().finally(() => {
				uni.stopPullDownRefresh()
			})
		},
		methods: {
			async initLatestConversation() {
				if (!this.ensureLogin()) {
					this.pageLoading = false
					return
				}

				try {
					this.pageLoading = true
					const listRes = await getConversationList({ loading: false })
					const conversations = listRes.data || []
					const latestConversation = conversations[0]

					if (latestConversation?.id) {
						this.currentConversationId = latestConversation.id
						this.conversationTitle = latestConversation.title || '最近会话'
					} else {
						const createRes = await createConversation('小助手会话', { loading: false })
						this.currentConversationId = createRes.data?.id || null
						this.conversationTitle = createRes.data?.title || '小助手会话'
					}

					await this.reloadMessages()
				} catch (error) {
					uni.showToast({
						title: '会话加载失败',
						icon: 'none'
					})
				} finally {
					this.pageLoading = false
				}
			},

			async reloadMessages() {
				if (!this.currentConversationId) {
					this.messages = []
					return
				}

				try {
					const res = await getConversationMessages(this.currentConversationId, { loading: false })
					const rawMessages = res.data || []
					this.messages = rawMessages.map((item) => this.normalizeMessage(item))
					this.scrollToBottom()
				} catch (error) {
					uni.showToast({
						title: '聊天记录加载失败',
						icon: 'none'
					})
				}
			},

			async onSend() {
				const question = this.inputText.trim()
				if (!question || !this.currentConversationId || this.sending) {
					return
				}

				this.sending = true
				this.inputText = ''

				const userMessage = this.normalizeMessage({
					sender: 'USER',
					content: question
				})
				this.messages.push(userMessage)
				this.scrollToBottom()

				const assistantMessage = this.normalizeMessage({
					sender: 'AI',
					content: ''
				})
				this.messages.push(assistantMessage)
				this.scrollToBottom()

				let answer = ''
				let shouldPersistAssistant = false

				try {
					await saveConversationMessage({
						conversationId: this.currentConversationId,
						sender: 'USER',
						content: question,
						messageType: 'TEXT'
					}, { loading: false })

					const streamPromise = streamChat(
						question,
						this.currentConversationId,
						{
							onMessage: (_chunk, fullContent) => {
								answer = fullContent
								this.updateMessageContent(assistantMessage.localId, answer)
								this.scrollToBottom()
							}
						},
						{ loading: false }
					)
					this.currentStreamPromise = streamPromise
					const streamRes = await streamPromise

					answer = (streamRes?.content || answer || '').trim()
					if (!answer) {
						throw new Error('stream empty response')
					}

					shouldPersistAssistant = true
					this.updateMessageContent(assistantMessage.localId, answer)
					this.scrollToBottom()
				} catch (error) {
					answer = (answer || '').trim()
					if (answer) {
						shouldPersistAssistant = true
						this.updateMessageContent(assistantMessage.localId, answer)
					} else {
						const errorMessage = error?.message || ''
						const hint = errorMessage.includes('stream empty response')
							? '未收到流式内容，请重试。'
							: '请求失败，请稍后重试。'
						this.updateMessageContent(assistantMessage.localId, hint)
					}
				} finally {
					if (shouldPersistAssistant) {
						try {
							await saveConversationMessage({
								conversationId: this.currentConversationId,
								sender: 'AI',
								content: answer,
								messageType: 'TEXT'
							}, { loading: false })
						} catch (error) {
							// Keep UI state even if persistence fails.
						}
					}

					this.currentStreamPromise = null
					this.sending = false
					this.scrollToBottom()
				}
			},

			updateMessageContent(localId, content) {
				const index = this.messages.findIndex((item) => item.localId === localId)
				if (index < 0) {
					return
				}

				this.messages.splice(index, 1, {
					...this.messages[index],
					content
				})
			},

			stopCurrentStream() {
				if (this.currentStreamPromise && typeof this.currentStreamPromise.abort === 'function') {
					this.currentStreamPromise.abort()
				}
				this.currentStreamPromise = null
			},

			normalizeMessage(message) {
				const sender = String(message?.sender || 'AI').toUpperCase()
				return {
					localId: `msg-${Date.now()}-${this.localMessageSeed++}`,
					id: message?.id,
					content: message?.content || '',
					sender,
					isUser: sender === 'USER',
					sendTime: message?.sendTime || ''
				}
			},

			scrollToBottom() {
				this.$nextTick(() => {
					const lastMessage = this.messages[this.messages.length - 1]
					if (lastMessage?.localId) {
						this.scrollIntoView = lastMessage.localId
					}
				})
			},

			ensureLogin() {
				const token = uni.getStorageSync('token')
				if (token) {
					return true
				}

				uni.showModal({
					title: '请先登录',
					content: '登录后才能使用小助手能力',
					success: ({ confirm }) => {
						if (confirm) {
							uni.switchTab({
								url: '/pages/profile/profile'
							})
						}
					}
				})

				return false
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import url("./assistant.scss");
</style>
