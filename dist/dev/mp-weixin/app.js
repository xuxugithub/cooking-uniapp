"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/category/category.js";
  "./pages/search/search.js";
  "./pages/favorites/favorites.js";
  "./pages/profile/profile.js";
  "./pages/dish-detail/dish-detail.js";
}
const _sfc_main = {
  onLaunch: function() {
    this.initApp();
  },
  onShow: function() {
  },
  onHide: function() {
  },
  methods: {
    initApp() {
      if (common_vendor.index.canIUse("getUpdateManager")) {
        const updateManager = common_vendor.index.getUpdateManager();
        updateManager.onCheckForUpdate(function(res) {
        });
        updateManager.onUpdateReady(function() {
          common_vendor.index.showModal({
            title: "更新提示",
            content: "新版本已经准备好，是否重启应用？",
            success: function(res) {
              if (res.confirm) {
                updateManager.applyUpdate();
              }
            }
          });
        });
        updateManager.onUpdateFailed(function() {
          common_vendor.index.showModal({
            title: "更新失败",
            content: "新版本下载失败，请检查网络后重试",
            showCancel: false
          });
        });
      }
      common_vendor.index.getSystemInfo({
        success: (res) => {
          this.globalData.systemInfo = res;
        }
      });
    }
  },
  globalData: {
    userInfo: null,
    systemInfo: null,
    baseUrl: "https://cook.xuaq.top"
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.config.globalProperties.$baseUrl = "https://cook.xuaq.top";
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
