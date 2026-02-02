"use strict";
const common_vendor = require("../../common/vendor.js");
const api_category = require("../../api/category.js");
const api_dish = require("../../api/dish.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      categories: [],
      dishes: [],
      loading: true,
      currentCategoryId: null,
      currentCategoryName: "",
      type: "category",
      // category 或 hot
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      hasMore: true,
      loadingMore: false
    };
  },
  onLoad(options) {
    if (options.categoryId) {
      this.currentCategoryId = options.categoryId;
      this.currentCategoryName = decodeURIComponent(options.categoryName || "");
      this.type = "dish";
      this.loadDishes();
    } else if (options.type === "hot") {
      this.type = "hot";
      this.loadDishes();
    } else {
      this.loadCategories();
    }
  },
  onShow() {
    const selectedCategory = common_vendor.index.getStorageSync("selectedCategory");
    if (selectedCategory && selectedCategory.id) {
      common_vendor.index.removeStorageSync("selectedCategory");
      this.currentCategoryId = selectedCategory.id;
      this.currentCategoryName = selectedCategory.name || "";
      this.type = "dish";
      this.pagination = { ...this.pagination, current: 1 };
      this.dishes = [];
      this.hasMore = true;
      this.loadDishes();
    } else if (!this.currentCategoryId && this.type === "category") {
      this.loadCategories();
    }
  },
  onReachBottom() {
    if (this.hasMore && !this.loadingMore && (this.currentCategoryId || this.type === "hot")) {
      this.loadMoreDishes();
    }
  },
  methods: {
    // 加载分类列表
    async loadCategories() {
      try {
        this.loading = true;
        const res = await api_category.getCategoryList();
        this.categories = res.data || [];
        this.loading = false;
      } catch (error) {
        this.loading = false;
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载菜品列表
    async loadDishes() {
      var _a, _b;
      try {
        this.loading = true;
        const params = {
          current: this.pagination.current,
          size: this.pagination.size
        };
        if (this.currentCategoryId) {
          params.categoryId = this.currentCategoryId;
        }
        const res = await api_dish.getDishPage(params);
        const newDishes = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.dishes = this.pagination.current === 1 ? newDishes : [...this.dishes, ...newDishes];
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
        this.hasMore = newDishes.length === this.pagination.size;
        this.loading = false;
      } catch (error) {
        this.loading = false;
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载更多菜品
    async loadMoreDishes() {
      if (this.loadingMore)
        return;
      this.loadingMore = true;
      try {
        this.pagination = {
          ...this.pagination,
          current: this.pagination.current + 1
        };
        await this.loadDishes();
      } catch (error) {
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loadingMore = false;
      }
    },
    // 分类点击事件
    onCategoryTap(e) {
      const { category } = e.currentTarget.dataset;
      this.currentCategoryId = category.id;
      this.currentCategoryName = category.name;
      this.type = "dish";
      this.pagination = { ...this.pagination, current: 1 };
      this.dishes = [];
      this.hasMore = true;
      this.loadDishes();
    },
    // 返回分类列表
    onBackToCategories() {
      this.currentCategoryId = null;
      this.currentCategoryName = "";
      this.type = "category";
      this.dishes = [];
      this.loadCategories();
    },
    // 菜品点击事件
    onDishTap(e) {
      const { dish } = e.currentTarget.dataset;
      common_vendor.index.navigateTo({
        url: `/pages/dish-detail/dish-detail?id=${dish.id}`
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
    a: !$data.currentCategoryId && $data.type === "category" && !$data.loading
  }, !$data.currentCategoryId && $data.type === "category" && !$data.loading ? {
    b: common_vendor.f($data.categories, (item, k0, i0) => {
      return common_vendor.e({
        a: $options.getImageUrl(item.icon),
        b: common_vendor.t(item.name),
        c: item.description
      }, item.description ? {
        d: common_vendor.t(item.description)
      } : {}, {
        e: item.id,
        f: common_vendor.o((...args) => $options.onCategoryTap && $options.onCategoryTap(...args), item.id),
        g: item
      });
    })
  } : {}, {
    c: ($data.currentCategoryId || $data.type === "hot") && !$data.loading
  }, ($data.currentCategoryId || $data.type === "hot") && !$data.loading ? common_vendor.e({
    d: $data.currentCategoryId
  }, $data.currentCategoryId ? {
    e: common_vendor.o((...args) => $options.onBackToCategories && $options.onBackToCategories(...args), "fc"),
    f: common_vendor.t($data.currentCategoryName)
  } : {}, {
    g: $data.dishes.length > 0
  }, $data.dishes.length > 0 ? {
    h: common_vendor.f($data.dishes, (item, k0, i0) => {
      return {
        a: $options.getImageUrl(item.image),
        b: common_vendor.t(item.name),
        c: common_vendor.t($options.getDifficultyText(item.difficulty)),
        d: $options.getDifficultyColor(item.difficulty),
        e: common_vendor.t(item.cookingTime),
        f: common_vendor.t(item.viewCount || 0),
        g: common_vendor.t(item.collectCount || 0),
        h: item.id,
        i: common_vendor.o((...args) => $options.onDishTap && $options.onDishTap(...args), item.id),
        j: item
      };
    })
  } : {}, {
    i: $data.loadingMore
  }, $data.loadingMore ? {} : {}, {
    j: !$data.hasMore && $data.dishes.length > 0
  }, !$data.hasMore && $data.dishes.length > 0 ? {} : {}, {
    k: $data.dishes.length === 0
  }, $data.dishes.length === 0 ? {} : {}) : {}, {
    l: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4046d630"]]);
wx.createPage(MiniProgramPage);
