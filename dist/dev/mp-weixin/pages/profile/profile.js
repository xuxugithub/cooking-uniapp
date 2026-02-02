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
  },
  methods: {
    // 检查用户信息
    checkUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.hasUserInfo = true;
        this.userInfo = userInfo;
        this.currentUserId = userInfo.id;
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
        const res = await api_user.wxLogin(loginRes.code, loginData.userInfo);
        if (res.data && res.data.token) {
          common_vendor.index.setStorageSync("token", res.data.token);
          common_vendor.index.setStorageSync("userInfo", res.data.userInfo);
          this.hasUserInfo = true;
          this.userInfo = res.data.userInfo;
          this.loadUserStats();
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
        } else {
          throw new Error("登录接口返回数据异常");
        }
      } catch (error) {
        console.error("登录失败:", error);
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
            console.log("尝试简化登录...");
            const loginRes = await common_vendor.index.login();
            if (loginRes.code) {
              const res = await api_user.wxLogin(loginRes.code);
              if (res.data && res.data.token) {
                common_vendor.index.setStorageSync("token", res.data.token);
                common_vendor.index.setStorageSync("userInfo", res.data.userInfo);
                this.hasUserInfo = true;
                this.userInfo = res.data.userInfo;
                this.loadUserStats();
                common_vendor.index.showToast({
                  title: "登录成功",
                  icon: "success"
                });
                return;
              }
            }
          } catch (fallbackError) {
            console.error("简化登录也失败:", fallbackError);
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
        console.error("获取关注列表失败:", error);
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
        console.error("获取粉丝列表失败:", error);
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
        console.error("操作失败:", error);
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
    b: $data.userInfo.avatarUrl,
    c: common_vendor.t($data.userInfo.nickName),
    d: common_vendor.t($data.userStats.followCount),
    e: common_vendor.o((...args) => $options.onShowFollowList && $options.onShowFollowList(...args), "cb"),
    f: common_vendor.t($data.userStats.fansCount),
    g: common_vendor.o((...args) => $options.onShowFansList && $options.onShowFansList(...args), "61")
  } : {
    h: common_vendor.o((...args) => $options.onGetUserProfile && $options.onGetUserProfile(...args), "63")
  }, {
    i: common_vendor.o((...args) => $options.onViewFavorites && $options.onViewFavorites(...args), "48"),
    j: common_vendor.o((...args) => $options.onClearCache && $options.onClearCache(...args), "17"),
    k: common_vendor.o((...args) => $options.onFeedback && $options.onFeedback(...args), "46"),
    l: common_vendor.o((...args) => $options.onAbout && $options.onAbout(...args), "3f"),
    m: $data.showUserListModal
  }, $data.showUserListModal ? common_vendor.e({
    n: common_vendor.t($data.modalTitle),
    o: common_vendor.o((...args) => $options.closeUserListModal && $options.closeUserListModal(...args), "5b"),
    p: $data.userList.length > 0
  }, $data.userList.length > 0 ? {
    q: common_vendor.f($data.userList, (user, k0, i0) => {
      return common_vendor.e({
        a: user.avatar || "/static/default-avatar.png",
        b: common_vendor.t(user.nickname),
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
    }, "1a"),
    t: common_vendor.o((...args) => $options.closeUserListModal && $options.closeUserListModal(...args), "87")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
