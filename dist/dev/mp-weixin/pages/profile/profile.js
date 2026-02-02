"use strict";
const common_vendor = require("../../common/vendor.js");
const api_user = require("../../api/user.js");
const _sfc_main = {
  data() {
    return {
      hasUserInfo: false,
      userInfo: {},
      userStats: {
        followCount: 0,
        fansCount: 0
      }
    };
  },
  onLoad() {
    this.checkUserInfo();
  },
  onShow() {
    this.checkUserInfo();
  },
  methods: {
    // 检查用户信息
    checkUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.hasUserInfo = true;
        this.userInfo = userInfo;
        this.loadUserStats();
      }
    },
    // 加载用户统计信息
    async loadUserStats() {
      try {
        const res = await api_user.getUserInfo();
        if (res.data) {
          this.userStats = {
            followCount: res.data.followCount || 0,
            fansCount: res.data.fansCount || 0
          };
        }
      } catch (error) {
        console.log("获取用户统计信息失败:", error);
      }
    },
    // 获取用户信息
    async onGetUserProfile() {
      try {
        const loginRes = await common_vendor.index.login();
        if (loginRes.code) {
          const res = await api_user.wxLogin(loginRes.code);
          if (res.data && res.data.token) {
            common_vendor.index.setStorageSync("token", res.data.token);
            common_vendor.index.setStorageSync("userInfo", res.data.userInfo);
            this.hasUserInfo = true;
            this.userInfo = res.data.userInfo;
            common_vendor.index.showToast({
              title: "登录成功",
              icon: "success"
            });
          }
        }
      } catch (error) {
        console.error("登录失败:", error);
        common_vendor.index.showToast({
          title: "登录失败",
          icon: "none"
        });
      }
    },
    // 查看收藏
    onViewFavorites() {
      common_vendor.index.switchTab({
        url: "/pages/favorites/favorites"
      });
    },
    // 测试Token
    testToken() {
      const token = common_vendor.index.getStorageSync("token");
      if (token) {
        common_vendor.index.showModal({
          title: "Token信息",
          content: `Token: ${token.substring(0, 20)}...`,
          showCancel: false
        });
      } else {
        common_vendor.index.showToast({
          title: "未登录",
          icon: "none"
        });
      }
    },
    // 清除缓存
    onClearCache() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要清除所有缓存数据吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.clearStorageSync();
            this.hasUserInfo = false;
            this.userInfo = {};
            common_vendor.index.showToast({
              title: "清除成功",
              icon: "success"
            });
          }
        }
      });
    },
    // 意见反馈
    onFeedback() {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    },
    // 关于我们
    onAbout() {
      common_vendor.index.showModal({
        title: "关于厨小教",
        content: "厨小教 v1.0.0\n零基础学做菜超简单",
        showCancel: false
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.hasUserInfo
  }, $data.hasUserInfo ? {
    b: $data.userInfo.avatarUrl,
    c: common_vendor.t($data.userInfo.nickName),
    d: common_vendor.t($data.userStats.followCount),
    e: common_vendor.t($data.userStats.fansCount)
  } : {
    f: common_vendor.o((...args) => $options.onGetUserProfile && $options.onGetUserProfile(...args), "fe")
  }, {
    g: common_vendor.o((...args) => $options.onViewFavorites && $options.onViewFavorites(...args), "77"),
    h: common_vendor.o((...args) => $options.testToken && $options.testToken(...args), "0b"),
    i: common_vendor.o((...args) => $options.onClearCache && $options.onClearCache(...args), "e4"),
    j: common_vendor.o((...args) => $options.onFeedback && $options.onFeedback(...args), "87"),
    k: common_vendor.o((...args) => $options.onAbout && $options.onAbout(...args), "b7")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
