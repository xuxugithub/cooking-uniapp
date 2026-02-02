"use strict";
const common_vendor = require("../../common/vendor.js");
const api_banner = require("../../api/banner.js");
const api_dish = require("../../api/dish.js");
const api_category = require("../../api/category.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      banners: [],
      categories: [],
      allDishes: [],
      loading: true,
      searchValue: "",
      // 菜品列表相关
      currentSortType: "collect",
      // collect-收藏最多, view-浏览最多, latest-最新上架
      sortOptions: [
        { key: "collect", name: "收藏最多" },
        { key: "view", name: "浏览最多" },
        { key: "latest", name: "最新上架" }
      ],
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      hasMore: true,
      loadingMore: false
    };
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    if (this.allDishes.length > 0) {
      this.refreshDishData();
    }
  },
  onPullDownRefresh() {
    this.pagination = { ...this.pagination, current: 1 };
    this.allDishes = [];
    this.hasMore = true;
    this.loadData().then(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  onReachBottom() {
    if (this.hasMore && !this.loadingMore) {
      this.loadMoreDishes();
    }
  },
  methods: {
    // 加载页面数据
    async loadData() {
      try {
        this.loading = true;
        console.log("开始加载数据...");
        const [bannerRes, categoryRes] = await Promise.all([
          api_banner.getBannerList(),
          api_category.getCategoryList()
        ]);
        console.log("Banner数据:", bannerRes);
        console.log("分类数据:", categoryRes);
        this.banners = bannerRes.data || [];
        this.categories = (categoryRes.data || []).slice(0, 8);
        this.loading = false;
        this.pagination = { ...this.pagination, current: 1 };
        this.allDishes = [];
        this.hasMore = true;
        await this.loadAllDishes();
        console.log("数据设置完成:", {
          banners: this.banners.length,
          categories: this.categories.length,
          allDishes: this.allDishes.length
        });
      } catch (error) {
        console.error("加载数据失败:", error);
        this.loading = false;
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载所有菜品列表
    async loadAllDishes() {
      var _a, _b;
      try {
        const params = {
          sortType: this.currentSortType,
          current: this.pagination.current,
          size: this.pagination.size
        };
        const res = await api_dish.getAllDishes(params);
        const newDishes = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.allDishes = this.pagination.current === 1 ? newDishes : [...this.allDishes, ...newDishes];
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
        this.hasMore = newDishes.length === this.pagination.size;
      } catch (error) {
        console.error("加载菜品列表失败:", error);
        common_vendor.index.showToast({
          title: "加载菜品失败",
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
        await this.loadAllDishes();
      } catch (error) {
        console.error("加载更多失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loadingMore = false;
      }
    },
    // 刷新菜品数据（保持当前页面状态，只更新数据）
    async refreshDishData() {
      var _a, _b;
      try {
        const params = {
          sortType: this.currentSortType,
          current: 1,
          size: this.allDishes.length || this.pagination.size
        };
        const res = await api_dish.getAllDishes(params);
        const refreshedDishes = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.allDishes = refreshedDishes;
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
      } catch (error) {
        console.error("刷新菜品数据失败:", error);
      }
    },
    // 切换排序方式
    onSortChange(e) {
      const sortType = e.currentTarget.dataset.sort;
      if (sortType === this.currentSortType)
        return;
      this.currentSortType = sortType;
      this.pagination = { ...this.pagination, current: 1 };
      this.allDishes = [];
      this.hasMore = true;
      this.loadAllDishes();
    },
    // Banner点击事件
    onBannerTap(e) {
      const { item } = e.currentTarget.dataset;
      if (item.linkType === "dish" && item.linkValue) {
        common_vendor.index.navigateTo({
          url: `/pages/dish-detail/dish-detail?id=${item.linkValue}`
        });
      }
    },
    // 分类点击事件
    onCategoryTap(e) {
      const { category } = e.currentTarget.dataset;
      common_vendor.index.navigateTo({
        url: `/pages/category/category?categoryId=${category.id}&categoryName=${category.name}`
      });
    },
    // 菜品点击事件
    onDishTap(e) {
      const { dish } = e.currentTarget.dataset;
      common_vendor.index.navigateTo({
        url: `/pages/dish-detail/dish-detail?id=${dish.id}`
      });
    },
    // 搜索输入
    onSearchInput(e) {
      this.searchValue = e.detail.value;
    },
    // 搜索确认
    onSearchConfirm(e) {
      const keyword = e.detail.value || this.searchValue;
      if (keyword && keyword.trim()) {
        common_vendor.index.navigateTo({
          url: `/pages/search/search?keyword=${encodeURIComponent(keyword.trim())}`
        });
      }
    },
    // 获取图片URL
    getImageUrl(imagePath) {
      return utils_util.getImageUrl(imagePath);
    },
    // 导航功能
    goToCategory() {
      common_vendor.index.switchTab({
        url: "/pages/category/category"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.searchValue = $event.detail.value, (...args) => $options.onSearchInput && $options.onSearchInput(...args)], "08"),
    b: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "c9"),
    c: $data.searchValue,
    d: $data.searchValue
  }, $data.searchValue ? {
    e: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "c6")
  } : {}, {
    f: $data.banners.length > 0
  }, $data.banners.length > 0 ? {
    g: common_vendor.f($data.banners, (item, k0, i0) => {
      return common_vendor.e({
        a: $options.getImageUrl(item.image),
        b: item.title
      }, item.title ? {
        c: common_vendor.t(item.title)
      } : {}, {
        d: item.id,
        e: common_vendor.o((...args) => $options.onBannerTap && $options.onBannerTap(...args), item.id),
        f: item
      });
    })
  } : {}, {
    h: $data.categories.length > 0
  }, $data.categories.length > 0 ? common_vendor.e({
    i: _ctx.index < 6
  }, _ctx.index < 6 ? {
    j: common_vendor.f($data.categories, (item, index, i0) => {
      return {
        a: $options.getImageUrl(item.image),
        b: common_vendor.t(item.name),
        c: item.id,
        d: common_vendor.o((...args) => $options.onCategoryTap && $options.onCategoryTap(...args), item.id),
        e: item
      };
    })
  } : {}, {
    k: common_vendor.o((...args) => $options.goToCategory && $options.goToCategory(...args), "90")
  }) : {}, {
    l: $data.allDishes.length > 0
  }, $data.allDishes.length > 0 ? common_vendor.e({
    m: common_vendor.f($data.sortOptions, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: common_vendor.n($data.currentSortType === item.key ? "active" : ""),
        c: item.key,
        d: common_vendor.o((...args) => $options.onSortChange && $options.onSortChange(...args), item.key),
        e: item.key
      };
    }),
    n: common_vendor.f($data.allDishes, (item, k0, i0) => {
      return {
        a: $options.getImageUrl(item.image),
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.categoryName),
        d: common_vendor.t(item.cookingTime),
        e: common_vendor.t(item.viewCount || 0),
        f: common_vendor.t(item.collectCount || 0),
        g: item.id,
        h: common_vendor.o((...args) => $options.onDishTap && $options.onDishTap(...args), item.id),
        i: item
      };
    }),
    o: $data.loadingMore
  }, $data.loadingMore ? {} : {}, {
    p: !$data.hasMore && $data.allDishes.length > 0
  }, !$data.hasMore && $data.allDishes.length > 0 ? {} : {}) : {}, {
    q: $data.loading
  }, $data.loading ? {} : {}, {
    r: !$data.loading && $data.banners.length === 0 && $data.categories.length === 0 && $data.allDishes.length === 0
  }, !$data.loading && $data.banners.length === 0 && $data.categories.length === 0 && $data.allDishes.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
