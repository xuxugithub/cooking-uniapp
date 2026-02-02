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
      },
      // 弹窗相关
      showUserListModal: false,
      modalTitle: "",
      userList: [],
      currentUserId: null
    };
  },
  onLoad() {
    this.checkUserInfo();
  },
  onShow() {
    this.checkUserInfo();
    this.$nextTick(() => {
      this.$forceUpdate();
    });
  },
  methods: {
    // 检查用户信息
    checkUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      const token = common_vendor.index.getStorageSync("token");
      if (userInfo && token) {
        this.hasUserInfo = true;
        this.userInfo = userInfo;
        this.currentUserId = userInfo.id;
        this.loadUserStats();
      } else {
        this.hasUserInfo = false;
        this.userInfo = {};
        this.currentUserId = null;
        this.userStats = {
          followCount: 0,
          fansCount: 0
        };
        if (!token) {
          common_vendor.index.removeStorageSync("userInfo");
        }
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
        if (error.message && error.message.includes("未登录")) {
          this.clearUserState();
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("userInfo");
        }
      }
    },
    // 获取用户信息
    async onGetUserProfile() {
      try {
        const userProfileRes = await common_vendor.index.getUserProfile({
          desc: "用于完善用户资料"
        });
        if (!userProfileRes.userInfo) {
          throw new Error("获取用户信息失败");
        }
        const loginRes = await common_vendor.index.login();
        if (!loginRes.code) {
          throw new Error("获取微信登录凭证失败");
        }
        const loginData = {
          code: loginRes.code,
          userInfo: {
            nickName: userProfileRes.userInfo.nickName,
            avatarUrl: userProfileRes.userInfo.avatarUrl,
            gender: userProfileRes.userInfo.gender,
            country: userProfileRes.userInfo.country,
            province: userProfileRes.userInfo.province,
            city: userProfileRes.userInfo.city
          }
        };
        common_vendor.index.showLoading({
          title: "登录中...",
          mask: true
        });
        const res = await api_user.wxLogin(loginRes.code, loginData.userInfo);
        common_vendor.index.hideLoading();
        if (res.data && res.data.token) {
          common_vendor.index.setStorageSync("token", res.data.token);
          common_vendor.index.setStorageSync("userInfo", res.data.userInfo);
          this.hasUserInfo = true;
          this.userInfo = res.data.userInfo;
          this.currentUserId = res.data.userInfo.id;
          this.$forceUpdate();
          this.loadUserStats();
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
        } else {
          throw new Error("登录接口返回数据异常");
        }
      } catch (error) {
        try {
          common_vendor.index.hideLoading();
        } catch (e) {
        }
        if (error.errMsg && error.errMsg.includes("getUserProfile:fail cancel")) {
          common_vendor.index.showToast({
            title: "需要授权才能使用完整功能",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        if (error.errMsg && error.errMsg.includes("getUserProfile:fail")) {
          try {
            const loginRes = await common_vendor.index.login();
            if (loginRes.code) {
              const res = await api_user.wxLogin(loginRes.code, null);
              if (res.data && res.data.token) {
                common_vendor.index.setStorageSync("token", res.data.token);
                common_vendor.index.setStorageSync("userInfo", res.data.userInfo);
                this.hasUserInfo = true;
                this.userInfo = res.data.userInfo;
                this.currentUserId = res.data.userInfo.id;
                this.$forceUpdate();
                this.loadUserStats();
                common_vendor.index.showToast({
                  title: "登录成功",
                  icon: "success"
                });
                return;
              }
            }
          } catch (fallbackError) {
          }
        }
        common_vendor.index.showToast({
          title: error.message || "登录失败",
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
    // 清除缓存
    onClearCache() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要清除所有缓存数据吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.clearStorageSync();
            this.clearUserState();
            common_vendor.index.showToast({
              title: "清除成功",
              icon: "success"
            });
          }
        }
      });
    },
    // 清理用户状态
    clearUserState() {
      this.hasUserInfo = false;
      this.userInfo = {};
      this.currentUserId = null;
      this.userStats = {
        followCount: 0,
        fansCount: 0
      };
      this.$forceUpdate();
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
    },
    // 显示关注列表
    async onShowFollowList() {
      if (!this.hasUserInfo) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      try {
        this.modalTitle = "关注列表";
        this.showUserListModal = true;
        this.userList = [];
        const res = await api_user.getFollowList(this.userInfo.id);
        if (res.data) {
          this.userList = res.data;
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "获取关注列表失败",
          icon: "none"
        });
      }
    },
    // 显示粉丝列表
    async onShowFansList() {
      if (!this.hasUserInfo) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      try {
        this.modalTitle = "粉丝列表";
        this.showUserListModal = true;
        this.userList = [];
        const res = await api_user.getFansList(this.userInfo.id);
        if (res.data) {
          this.userList = res.data;
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "获取粉丝列表失败",
          icon: "none"
        });
      }
    },
    // 关闭用户列表弹窗
    closeUserListModal() {
      this.showUserListModal = false;
      this.userList = [];
      this.modalTitle = "";
    },
    // 切换关注状态
    async toggleFollow(user) {
      if (!this.hasUserInfo) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      try {
        if (user.isFollowed) {
          await api_user.unfollowUser(user.userId);
          user.isFollowed = false;
          common_vendor.index.showToast({
            title: "已取消关注",
            icon: "success"
          });
        } else {
          await api_user.followUser(user.userId);
          user.isFollowed = true;
          common_vendor.index.showToast({
            title: "关注成功",
            icon: "success"
          });
        }
        this.loadUserStats();
      } catch (error) {
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.hasUserInfo
  }, $data.hasUserInfo ? {
    b: $data.userInfo.avatarUrl || "/static/default-avatar.svg",
    c: common_vendor.t($data.userInfo.nickName),
    d: common_vendor.t($data.userStats.followCount),
    e: common_vendor.o((...args) => $options.onShowFollowList && $options.onShowFollowList(...args), "27"),
    f: common_vendor.t($data.userStats.fansCount),
    g: common_vendor.o((...args) => $options.onShowFansList && $options.onShowFansList(...args), "97")
  } : {
    h: common_vendor.o((...args) => $options.onGetUserProfile && $options.onGetUserProfile(...args), "c9")
  }, {
    i: common_vendor.o((...args) => $options.onViewFavorites && $options.onViewFavorites(...args), "07"),
    j: common_vendor.o((...args) => $options.onClearCache && $options.onClearCache(...args), "74"),
    k: common_vendor.o((...args) => $options.onFeedback && $options.onFeedback(...args), "52"),
    l: common_vendor.o((...args) => $options.onAbout && $options.onAbout(...args), "16"),
    m: $data.showUserListModal
  }, $data.showUserListModal ? common_vendor.e({
    n: common_vendor.t($data.modalTitle),
    o: common_vendor.o((...args) => $options.closeUserListModal && $options.closeUserListModal(...args), "bd"),
    p: $data.userList.length > 0
  }, $data.userList.length > 0 ? {
    q: common_vendor.f($data.userList, (user, k0, i0) => {
      return common_vendor.e({
        a: user.avatarUrl || "/static/default-avatar.svg",
        b: common_vendor.t(user.nickName),
        c: user.userId !== $data.currentUserId
      }, user.userId !== $data.currentUserId ? {
        d: common_vendor.t(user.isFollowed ? "已关注" : "关注"),
        e: user.isFollowed ? 1 : "",
        f: common_vendor.o(($event) => $options.toggleFollow(user), user.userId)
      } : {}, {
        g: user.userId
      });
    })
  } : {
    r: common_vendor.t($data.modalTitle === "关注列表" ? "暂无关注" : "暂无粉丝")
  }, {
    s: common_vendor.o(() => {
    }, "b8"),
    t: common_vendor.o((...args) => $options.closeUserListModal && $options.closeUserListModal(...args), "f9")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
