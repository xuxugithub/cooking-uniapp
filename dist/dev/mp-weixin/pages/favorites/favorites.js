"use strict";
const common_vendor = require("../../common/vendor.js");
const api_user = require("../../api/user.js");
const api_dish = require("../../api/dish.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      favorites: [],
      loading: true
    };
  },
  onLoad() {
    this.loadFavorites();
  },
  onShow() {
    this.loadFavorites();
  },
  methods: {
    // 加载收藏列表
    async loadFavorites() {
      try {
        this.loading = true;
        const localFavorites = common_vendor.index.getStorageSync("favorites") || [];
        this.favorites = localFavorites;
        this.loading = false;
        try {
          const res = await api_user.getUserFavorites();
          if (res.data) {
            this.favorites = res.data;
            common_vendor.index.setStorageSync("favorites", res.data);
          }
        } catch (error) {
          console.log("获取服务器收藏列表失败，使用本地数据:", error);
        }
      } catch (error) {
        console.error("加载收藏列表失败:", error);
        this.loading = false;
      }
    },
    // 菜品点击事件
    onDishTap(e) {
      const { dish } = e.currentTarget.dataset;
      common_vendor.index.navigateTo({
        url: `/pages/dish-detail/dish-detail?id=${dish.id}`
      });
    },
    // 取消收藏
    async onRemoveFavorite(e) {
      const { dish } = e.currentTarget.dataset;
      try {
        this.favorites = this.favorites.filter((item) => item.id !== dish.id);
        const localFavorites = common_vendor.index.getStorageSync("favorites") || [];
        const updatedFavorites = localFavorites.filter((item) => item.id !== dish.id);
        common_vendor.index.setStorageSync("favorites", updatedFavorites);
        try {
          await api_dish.toggleFavorite(dish.id);
          common_vendor.index.showToast({
            title: "已取消收藏",
            icon: "success"
          });
        } catch (error) {
          console.log("后端取消收藏失败，但本地已更新:", error);
          common_vendor.index.showToast({
            title: "已取消收藏",
            icon: "success"
          });
        }
      } catch (error) {
        console.error("取消收藏失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
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
    a: $data.favorites.length > 0
  }, $data.favorites.length > 0 ? {
    b: common_vendor.f($data.favorites, (item, k0, i0) => {
      return common_vendor.e({
        a: $options.getImageUrl(item.image),
        b: common_vendor.t(item.name),
        c: item.description
      }, item.description ? {
        d: common_vendor.t(item.description)
      } : {}, {
        e: common_vendor.t($options.getDifficultyText(item.difficulty)),
        f: $options.getDifficultyColor(item.difficulty),
        g: common_vendor.t(item.cookingTime),
        h: common_vendor.t(item.categoryName),
        i: common_vendor.t(item.viewCount || 0),
        j: common_vendor.t(item.collectCount || 0),
        k: common_vendor.o((...args) => $options.onRemoveFavorite && $options.onRemoveFavorite(...args), item.id),
        l: item,
        m: item.id,
        n: common_vendor.o((...args) => $options.onDishTap && $options.onDishTap(...args), item.id),
        o: item
      });
    })
  } : {}, {
    c: $data.loading
  }, $data.loading ? {} : {}, {
    d: !$data.loading && $data.favorites.length === 0
  }, !$data.loading && $data.favorites.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b8bb0ac5"]]);
wx.createPage(MiniProgramPage);
