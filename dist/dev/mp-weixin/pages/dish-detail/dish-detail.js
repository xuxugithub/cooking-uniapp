"use strict";
const common_vendor = require("../../common/vendor.js");
const api_dish = require("../../api/dish.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      dishId: null,
      dish: null,
      steps: [],
      ingredients: [],
      loading: true,
      isFavorite: false,
      // 浏览记录相关
      skipInitialOnShow: true,
      hasRecordedView: false,
      viewTimer: null
    };
  },
  onLoad(options) {
    if (options.id) {
      this.dishId = options.id;
      this.hasRecordedView = false;
      this.loadDishDetail();
      this.checkFavoriteStatus();
    }
  },
  onShow() {
    if (this.skipInitialOnShow) {
      this.skipInitialOnShow = false;
      return;
    }
    if (this.dishId) {
      this.hasRecordedView = false;
      this.loadDishDetail();
    }
  },
  onHide() {
    this.clearViewTimer();
  },
  onUnload() {
    this.clearViewTimer();
  },
  onShareAppMessage() {
    var _a, _b;
    return {
      title: `推荐一道美味的${(_a = this.dish) == null ? void 0 : _a.name}`,
      path: `/pages/dish-detail/dish-detail?id=${this.dishId}`,
      imageUrl: utils_util.getImageUrl((_b = this.dish) == null ? void 0 : _b.image)
    };
  },
  methods: {
    // 加载菜品详情
    async loadDishDetail() {
      var _a;
      try {
        this.loading = true;
        const [dishRes, stepsRes, ingredientsRes] = await Promise.all([
          api_dish.getDishById(this.dishId),
          api_dish.getDishSteps(this.dishId),
          api_dish.getDishIngredients(this.dishId)
        ]);
        this.dish = dishRes.data;
        this.steps = stepsRes.data || [];
        this.ingredients = ingredientsRes.data || [];
        if (dishRes.data && dishRes.data.isFavorite !== void 0) {
          this.isFavorite = dishRes.data.isFavorite;
        } else {
          this.isFavorite = false;
          this.checkFavoriteStatus();
        }
        if (!this.dish) {
          common_vendor.index.showToast({
            title: "菜品不存在",
            icon: "none"
          });
        }
        this.loading = false;
        if ((_a = dishRes.data) == null ? void 0 : _a.name) {
          common_vendor.index.setNavigationBarTitle({
            title: dishRes.data.name
          });
        }
        this.startViewTimer();
      } catch (error) {
        this.loading = false;
        this.dish = null;
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      }
    },
    // 开始浏览计时
    startViewTimer() {
      if (this.hasRecordedView || !this.dishId)
        return;
      this.clearViewTimer();
      this.viewTimer = setTimeout(() => {
        this.viewTimer = null;
        this.recordValidView();
      }, 5e3);
    },
    // 清除浏览计时器
    clearViewTimer() {
      if (this.viewTimer) {
        clearTimeout(this.viewTimer);
        this.viewTimer = null;
      }
    },
    // 记录有效浏览
    async recordValidView() {
      if (this.hasRecordedView || !this.dishId)
        return;
      this.hasRecordedView = true;
      try {
        try {
          await api_dish.recordViewHistory(this.dishId);
          const dishRes = await api_dish.getDishById(this.dishId);
          if (dishRes.data) {
            this.dish.viewCount = dishRes.data.viewCount;
          }
        } catch (error) {
          await api_dish.increaseViewCount(this.dishId);
          if (this.dish) {
            this.dish.viewCount = (this.dish.viewCount || 0) + 1;
          }
          this.recordLocalViewHistory();
        }
      } catch (error) {
      }
    },
    // 记录本地浏览历史
    recordLocalViewHistory() {
      try {
        const viewHistory = common_vendor.index.getStorageSync("viewHistory") || [];
        const dishId = this.dishId;
        const dish = this.dish;
        if (!dish)
          return;
        const existingIndex = viewHistory.findIndex((item) => item.id == dishId);
        const historyItem = {
          id: dish.id,
          name: dish.name,
          image: dish.image,
          description: dish.description,
          difficulty: dish.difficulty,
          cookingTime: dish.cookingTime,
          categoryName: dish.categoryName,
          viewTime: (/* @__PURE__ */ new Date()).toISOString(),
          viewCount: 1
        };
        if (existingIndex >= 0) {
          viewHistory[existingIndex] = {
            ...viewHistory[existingIndex],
            viewTime: historyItem.viewTime,
            viewCount: (viewHistory[existingIndex].viewCount || 0) + 1
          };
        } else {
          viewHistory.unshift(historyItem);
        }
        if (viewHistory.length > 100) {
          viewHistory.splice(100);
        }
        common_vendor.index.setStorageSync("viewHistory", viewHistory);
      } catch (error) {
      }
    },
    // 检查收藏状态
    checkFavoriteStatus() {
      const favorites = common_vendor.index.getStorageSync("favorites") || [];
      const isFavorite = favorites.some((item) => item.id == this.dishId);
      this.isFavorite = isFavorite;
    },
    // 收藏/取消收藏
    async onToggleFavorite() {
      if (!this.dish)
        return;
      try {
        let backendResult = null;
        try {
          const response = await api_dish.toggleFavorite(this.dishId);
          backendResult = response.data;
        } catch (error) {
          if (error.needLogin) {
            common_vendor.index.showModal({
              title: "提示",
              content: "收藏功能需要登录，是否前往登录？",
              success: (res) => {
                if (res.confirm) {
                  common_vendor.index.switchTab({
                    url: "/pages/profile/profile"
                  });
                }
              }
            });
          } else {
            common_vendor.index.showToast({
              title: error.message || "操作失败",
              icon: "none"
            });
          }
          return;
        }
        if (backendResult) {
          this.isFavorite = backendResult.isFavorite;
          if (backendResult.collectCount !== void 0) {
            this.dish.collectCount = backendResult.collectCount;
          }
          let favorites = common_vendor.index.getStorageSync("favorites") || [];
          if (this.isFavorite) {
            const favoriteItem = {
              id: this.dish.id,
              name: this.dish.name,
              image: this.dish.image,
              description: this.dish.description,
              difficulty: this.dish.difficulty,
              cookingTime: this.dish.cookingTime,
              categoryName: this.dish.categoryName,
              viewCount: this.dish.viewCount,
              collectCount: this.dish.collectCount,
              createTime: (/* @__PURE__ */ new Date()).toISOString()
            };
            favorites = favorites.filter((item) => item.id != this.dishId);
            favorites.unshift(favoriteItem);
          } else {
            favorites = favorites.filter((item) => item.id != this.dishId);
          }
          common_vendor.index.setStorageSync("favorites", favorites);
          common_vendor.index.showToast({
            title: backendResult.message || (this.isFavorite ? "收藏成功" : "取消收藏成功"),
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    },
    // 预览图片
    onPreviewImage(e) {
      const { url } = e.currentTarget.dataset;
      common_vendor.index.previewImage({
        current: url,
        urls: [url]
      });
    },
    // 获取图片URL
    getImageUrl(imagePath) {
      return utils_util.getImageUrl(imagePath);
    },
    // 获取难度文本
    getDifficultyText(difficulty) {
      return utils_util.getDifficultyText(difficulty);
    },
    // 获取难度颜色
    getDifficultyColor(difficulty) {
      return utils_util.getDifficultyColor(difficulty);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.dish
  }, $data.dish ? {
    b: $options.getImageUrl($data.dish.image),
    c: common_vendor.t($data.dish.name),
    d: common_vendor.t($options.getDifficultyText($data.dish.difficulty)),
    e: $options.getDifficultyColor($data.dish.difficulty),
    f: common_vendor.t($data.dish.cookingTime),
    g: common_vendor.t($data.dish.servings)
  } : {}, {
    h: $data.dish
  }, $data.dish ? {
    i: common_vendor.t($data.dish.description || "暂无简介"),
    j: common_vendor.t($data.dish.viewCount || 0),
    k: common_vendor.t($data.dish.collectCount || 0),
    l: common_vendor.t($data.dish.shareCount || 0)
  } : {}, {
    m: $data.ingredients.length > 0
  }, $data.ingredients.length > 0 ? {
    n: common_vendor.f($data.ingredients, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: common_vendor.t(item.amount),
        c: common_vendor.t(item.unit),
        d: item.id
      };
    })
  } : {}, {
    o: $data.steps.length > 0
  }, $data.steps.length > 0 ? {
    p: common_vendor.f($data.steps, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item.description),
        c: item.image
      }, item.image ? {
        d: $options.getImageUrl(item.image),
        e: common_vendor.o((...args) => $options.onPreviewImage && $options.onPreviewImage(...args), item.id),
        f: $options.getImageUrl(item.image)
      } : {}, {
        g: item.id
      });
    })
  } : {}, {
    q: $data.dish
  }, $data.dish ? {
    r: common_vendor.t($data.isFavorite ? "❤️" : "🤍"),
    s: $data.isFavorite ? 1 : "",
    t: common_vendor.t($data.isFavorite ? "已收藏" : "收藏"),
    v: common_vendor.o((...args) => $options.onToggleFavorite && $options.onToggleFavorite(...args), "48")
  } : {}, {
    w: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c783fa68"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
