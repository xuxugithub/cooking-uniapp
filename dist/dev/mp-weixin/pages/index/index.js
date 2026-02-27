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
      loadingMore: false,
      assistantPosition: {
        left: 0,
        top: 0
      },
      assistantBounds: {
        minLeft: 0,
        maxLeft: 0,
        minTop: 0,
        maxTop: 0
      },
      assistantDragState: {
        touching: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        moved: false
      }
    };
  },
  onLoad() {
    this.initAssistantPosition();
    this.loadData();
  },
  onResize() {
    this.refreshAssistantBounds();
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
        const [bannerRes, categoryRes] = await Promise.all([
          api_banner.getBannerList({ loading: false }),
          api_category.getCategoryList({ loading: false })
        ]);
        this.banners = bannerRes.data || [];
        this.categories = categoryRes.data || [];
        this.loading = false;
        this.pagination = { ...this.pagination, current: 1 };
        this.allDishes = [];
        this.hasMore = true;
        await this.loadAllDishes();
      } catch (error) {
        this.loading = false;
        if (!this.banners || this.banners.length === 0)
          this.banners = [];
        if (!this.categories || this.categories.length === 0)
          this.categories = [];
        if (!this.allDishes || this.allDishes.length === 0)
          this.allDishes = [];
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
        const res = await api_dish.getAllDishes(params, { loading: false });
        const newDishes = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.allDishes = this.pagination.current === 1 ? newDishes : [...this.allDishes, ...newDishes];
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
        this.hasMore = newDishes.length === this.pagination.size;
      } catch (error) {
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
        const res = await api_dish.getAllDishes(params, { loading: false });
        const refreshedDishes = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.allDishes = refreshedDishes;
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
      } catch (error) {
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
      if (!category || !category.id) {
        return;
      }
      common_vendor.index.setStorageSync("selectedCategory", {
        id: category.id,
        name: category.name
      });
      common_vendor.index.switchTab({
        url: "/pages/category/category"
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
    // 进入小助手
    openAssistant() {
      common_vendor.index.navigateTo({
        url: "/pages/assistant/assistant"
      });
    },
    initAssistantPosition() {
      this.refreshAssistantBounds();
      const cache = common_vendor.index.getStorageSync("assistantEntryPosition") || {};
      const hasValidCache = Number.isFinite(cache.left) && Number.isFinite(cache.top);
      if (hasValidCache) {
        this.assistantPosition = {
          left: this.clampValue(cache.left, this.assistantBounds.minLeft, this.assistantBounds.maxLeft),
          top: this.clampValue(cache.top, this.assistantBounds.minTop, this.assistantBounds.maxTop)
        };
        return;
      }
      const left = this.assistantBounds.maxLeft;
      const top = this.clampValue(this.assistantBounds.maxTop - 85, this.assistantBounds.minTop, this.assistantBounds.maxTop);
      this.assistantPosition = { left, top };
    },
    refreshAssistantBounds() {
      var _a;
      const info = common_vendor.index.getSystemInfoSync();
      const margin = 12;
      const avatarSize = 52;
      const helperHeight = 82;
      const navHeight = (info.statusBarHeight || 20) + 44;
      const safeBottom = ((_a = info.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
      const tabBarHeight = 50 + safeBottom;
      const maxLeft = Math.max(margin, info.windowWidth - avatarSize - margin);
      const maxTop = Math.max(navHeight + margin, info.windowHeight - helperHeight - tabBarHeight - margin);
      this.assistantBounds = {
        minLeft: margin,
        maxLeft,
        minTop: navHeight + margin,
        maxTop
      };
      this.assistantPosition = {
        left: this.clampValue(this.assistantPosition.left, this.assistantBounds.minLeft, this.assistantBounds.maxLeft),
        top: this.clampValue(this.assistantPosition.top, this.assistantBounds.minTop, this.assistantBounds.maxTop)
      };
    },
    onAssistantTouchStart(e) {
      const touch = e.touches && e.touches[0];
      if (!touch)
        return;
      this.assistantDragState = {
        touching: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startLeft: this.assistantPosition.left,
        startTop: this.assistantPosition.top,
        moved: false
      };
    },
    onAssistantTouchMove(e) {
      const touch = e.touches && e.touches[0];
      if (!touch || !this.assistantDragState.touching)
        return;
      const deltaX = touch.clientX - this.assistantDragState.startX;
      const deltaY = touch.clientY - this.assistantDragState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 6) {
        this.assistantDragState.moved = true;
      }
      this.assistantPosition = {
        left: this.clampValue(
          this.assistantDragState.startLeft + deltaX,
          this.assistantBounds.minLeft,
          this.assistantBounds.maxLeft
        ),
        top: this.clampValue(
          this.assistantDragState.startTop + deltaY,
          this.assistantBounds.minTop,
          this.assistantBounds.maxTop
        )
      };
    },
    onAssistantTouchEnd() {
      if (!this.assistantDragState.touching) {
        return;
      }
      const moved = this.assistantDragState.moved;
      this.assistantDragState.touching = false;
      common_vendor.index.setStorageSync("assistantEntryPosition", {
        left: this.assistantPosition.left,
        top: this.assistantPosition.top
      });
      if (!moved) {
        this.openAssistant();
      }
    },
    clampValue(value, min, max) {
      const safeValue = Number.isFinite(value) ? value : min;
      return Math.min(Math.max(safeValue, min), max);
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
  }, $data.categories.length > 0 ? {
    i: common_vendor.f($data.categories, (item, k0, i0) => {
      return common_vendor.e({
        a: item.icon
      }, item.icon ? {
        b: $options.getImageUrl(item.icon)
      } : {
        c: common_vendor.t(item.name.charAt(0))
      }, {
        d: common_vendor.t(item.name),
        e: item.id,
        f: common_vendor.o((...args) => $options.onCategoryTap && $options.onCategoryTap(...args), item.id),
        g: item
      });
    }),
    j: common_vendor.o((...args) => $options.goToCategory && $options.goToCategory(...args), "c1")
  } : {}, {
    k: $data.allDishes.length > 0
  }, $data.allDishes.length > 0 ? common_vendor.e({
    l: common_vendor.f($data.sortOptions, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: common_vendor.n($data.currentSortType === item.key ? "active" : ""),
        c: item.key,
        d: common_vendor.o((...args) => $options.onSortChange && $options.onSortChange(...args), item.key),
        e: item.key
      };
    }),
    m: common_vendor.f($data.allDishes, (item, k0, i0) => {
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
    n: $data.loadingMore
  }, $data.loadingMore ? {} : {}, {
    o: !$data.hasMore && $data.allDishes.length > 0
  }, !$data.hasMore && $data.allDishes.length > 0 ? {} : {}) : {}, {
    p: $data.loading
  }, $data.loading ? {} : {}, {
    q: !$data.loading && $data.banners.length === 0 && $data.categories.length === 0 && $data.allDishes.length === 0
  }, !$data.loading && $data.banners.length === 0 && $data.categories.length === 0 && $data.allDishes.length === 0 ? {} : {}, {
    r: `${$data.assistantPosition.left}px`,
    s: `${$data.assistantPosition.top}px`,
    t: common_vendor.o((...args) => $options.onAssistantTouchStart && $options.onAssistantTouchStart(...args), "75"),
    v: common_vendor.o((...args) => $options.onAssistantTouchMove && $options.onAssistantTouchMove(...args), "a9"),
    w: common_vendor.o((...args) => $options.onAssistantTouchEnd && $options.onAssistantTouchEnd(...args), "a5"),
    x: common_vendor.o((...args) => $options.onAssistantTouchEnd && $options.onAssistantTouchEnd(...args), "7c")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
