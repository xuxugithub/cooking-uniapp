"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chat = require("../../api/chat.js");
const _sfc_main = {
  data() {
    return {
      pageLoading: true,
      sending: false,
      currentConversationId: null,
      conversationTitle: "最近会话",
      messages: [],
      inputText: "",
      scrollIntoView: "",
      localMessageSeed: 0,
      currentStreamPromise: null
    };
  },
  computed: {
    canSend() {
      return !this.pageLoading && !this.sending && !!this.inputText.trim();
    }
  },
  onLoad() {
    this.initLatestConversation();
  },
  onUnload() {
    this.stopCurrentStream();
  },
  onPullDownRefresh() {
    this.reloadMessages().finally(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  methods: {
    async initLatestConversation() {
      var _a, _b;
      if (!this.ensureLogin()) {
        this.pageLoading = false;
        return;
      }
      try {
        this.pageLoading = true;
        const listRes = await api_chat.getConversationList({ loading: false });
        const conversations = listRes.data || [];
        const latestConversation = conversations[0];
        if (latestConversation == null ? void 0 : latestConversation.id) {
          this.currentConversationId = latestConversation.id;
          this.conversationTitle = latestConversation.title || "最近会话";
        } else {
          const createRes = await api_chat.createConversation("小助手会话", { loading: false });
          this.currentConversationId = ((_a = createRes.data) == null ? void 0 : _a.id) || null;
          this.conversationTitle = ((_b = createRes.data) == null ? void 0 : _b.title) || "小助手会话";
        }
        await this.reloadMessages();
      } catch (error) {
        common_vendor.index.showToast({
          title: "会话加载失败",
          icon: "none"
        });
      } finally {
        this.pageLoading = false;
      }
    },
    async reloadMessages() {
      if (!this.currentConversationId) {
        this.messages = [];
        return;
      }
      try {
        const res = await api_chat.getConversationMessages(this.currentConversationId, { loading: false });
        const rawMessages = res.data || [];
        this.messages = rawMessages.map((item) => this.normalizeMessage(item));
        this.scrollToBottom();
      } catch (error) {
        common_vendor.index.showToast({
          title: "聊天记录加载失败",
          icon: "none"
        });
      }
    },
    async onSend() {
      const question = this.inputText.trim();
      if (!question || !this.currentConversationId || this.sending) {
        return;
      }
      this.sending = true;
      this.inputText = "";
      const userMessage = this.normalizeMessage({
        sender: "USER",
        content: question
      });
      this.messages.push(userMessage);
      this.scrollToBottom();
      const assistantMessage = this.normalizeMessage({
        sender: "AI",
        content: ""
      });
      this.messages.push(assistantMessage);
      this.scrollToBottom();
      let answer = "";
      let shouldPersistAssistant = false;
      try {
        await api_chat.saveConversationMessage({
          conversationId: this.currentConversationId,
          sender: "USER",
          content: question,
          messageType: "TEXT"
        }, { loading: false });
        const streamPromise = api_chat.streamChat(
          question,
          this.currentConversationId,
          {
            onMessage: (_chunk, fullContent) => {
              answer = fullContent;
              this.updateMessageContent(assistantMessage.localId, answer);
              this.scrollToBottom();
            }
          },
          { loading: false }
        );
        this.currentStreamPromise = streamPromise;
        const streamRes = await streamPromise;
        answer = ((streamRes == null ? void 0 : streamRes.content) || answer || "").trim();
        if (!answer) {
          throw new Error("stream empty response");
        }
        shouldPersistAssistant = true;
        this.updateMessageContent(assistantMessage.localId, answer);
        this.scrollToBottom();
      } catch (error) {
        answer = (answer || "").trim();
        if (answer) {
          shouldPersistAssistant = true;
          this.updateMessageContent(assistantMessage.localId, answer);
        } else {
          const errorMessage = (error == null ? void 0 : error.message) || "";
          const hint = errorMessage.includes("stream empty response") ? "未收到流式内容，请重试。" : "请求失败，请稍后重试。";
          this.updateMessageContent(assistantMessage.localId, hint);
        }
      } finally {
        if (shouldPersistAssistant) {
          try {
            await api_chat.saveConversationMessage({
              conversationId: this.currentConversationId,
              sender: "AI",
              content: answer,
              messageType: "TEXT"
            }, { loading: false });
          } catch (error) {
          }
        }
        this.currentStreamPromise = null;
        this.sending = false;
        this.scrollToBottom();
      }
    },
    updateMessageContent(localId, content) {
      const index = this.messages.findIndex((item) => item.localId === localId);
      if (index < 0) {
        return;
      }
      this.messages.splice(index, 1, {
        ...this.messages[index],
        content
      });
    },
    stopCurrentStream() {
      if (this.currentStreamPromise && typeof this.currentStreamPromise.abort === "function") {
        this.currentStreamPromise.abort();
      }
      this.currentStreamPromise = null;
    },
    normalizeMessage(message) {
      const sender = String((message == null ? void 0 : message.sender) || "AI").toUpperCase();
      return {
        localId: `msg-${Date.now()}-${this.localMessageSeed++}`,
        id: message == null ? void 0 : message.id,
        content: (message == null ? void 0 : message.content) || "",
        sender,
        isUser: sender === "USER",
        sendTime: (message == null ? void 0 : message.sendTime) || ""
      };
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage == null ? void 0 : lastMessage.localId) {
          this.scrollIntoView = lastMessage.localId;
        }
      });
    },
    ensureLogin() {
      const token = common_vendor.index.getStorageSync("token");
      if (token) {
        return true;
      }
      common_vendor.index.showModal({
        title: "请先登录",
        content: "登录后才能使用小助手能力",
        success: ({ confirm }) => {
          if (confirm) {
            common_vendor.index.switchTab({
              url: "/pages/profile/profile"
            });
          }
        }
      });
      return false;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.conversationTitle),
    b: $data.pageLoading
  }, $data.pageLoading ? {} : $data.messages.length === 0 ? {} : {}, {
    c: $data.messages.length === 0,
    d: common_vendor.f($data.messages, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.content),
        b: common_vendor.n(item.isUser ? "user" : "assistant"),
        c: item.localId,
        d: item.localId
      };
    }),
    e: $data.sending
  }, $data.sending ? {} : {}, {
    f: $data.scrollIntoView,
    g: $data.pageLoading || $data.sending,
    h: $data.inputText,
    i: common_vendor.o(($event) => $data.inputText = $event.detail.value, "cc"),
    j: !$options.canSend ? 1 : "",
    k: !$options.canSend,
    l: common_vendor.o((...args) => $options.onSend && $options.onSend(...args), "d2")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5dcccbfc"]]);
wx.createPage(MiniProgramPage);
