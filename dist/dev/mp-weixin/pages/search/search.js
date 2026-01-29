"use strict";
const common_vendor = require("../../common/vendor.js");
const api_dish = require("../../api/dish.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      keyword: "",
      searchHistory: [],
      hotKeywords: ["红烧肉", "宫保鸡丁", "麻婆豆腐", "糖醋排骨", "鱼香肉丝", "回锅肉"],
      searchResults: [],
      loading: false,
      hasSearched: false,
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
    if (options.keyword) {
      this.keyword = decodeURIComponent(options.keyword);
      this.performSearch();
    }
    this.loadSearchHistory();
  },
  onShow() {
    this.loadSearchHistory();
  },
  onReachBottom() {
    if (this.hasMore && !this.loadingMore && this.hasSearched) {
      this.loadMoreResults();
    }
  },
  methods: {
    // 搜索输入
    onSearchInput(e) {
      this.keyword = e.detail.value;
      this.debouncedSearch();
    },
    // 防抖搜索
    debouncedSearch: utils_util.debounce(function() {
      if (this.keyword.trim()) {
        this.performSearch();
      }
    }, 500),
    // 搜索确认
    onSearchConfirm() {
      if (this.keyword.trim()) {
        this.performSearch();
      }
    },
    // 执行搜索
    async performSearch() {
      var _a, _b;
      const keyword = this.keyword.trim();
      if (!keyword)
        return;
      try {
        this.loading = true;
        this.hasSearched = true;
        this.pagination = { ...this.pagination, current: 1 };
        this.searchResults = [];
        this.hasMore = true;
        const params = {
          current: 1,
          size: this.pagination.size
        };
        const res = await api_dish.searchDish(keyword, params);
        const results = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.searchResults = results;
        this.pagination = {
          ...this.pagination,
          total: ((_b = res.data) == null ? void 0 : _b.total) || 0
        };
        this.hasMore = results.length === this.pagination.size;
        this.loading = false;
        this.saveSearchHistory(keyword);
      } catch (error) {
        console.error("搜索失败:", error);
        this.loading = false;
        common_vendor.index.showToast({
          title: "搜索失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载更多搜索结果
    async loadMoreResults() {
      var _a;
      if (this.loadingMore)
        return;
      this.loadingMore = true;
      try {
        const newPagination = {
          ...this.pagination,
          current: this.pagination.current + 1
        };
        const params = {
          current: newPagination.current,
          size: newPagination.size
        };
        const res = await api_dish.searchDish(this.keyword, params);
        const newResults = ((_a = res.data) == null ? void 0 : _a.records) || [];
        this.searchResults = [...this.searchResults, ...newResults];
        this.pagination = newPagination;
        this.hasMore = newResults.length === this.pagination.size;
        this.loadingMore = false;
      } catch (error) {
        console.error("加载更多失败:", error);
        this.loadingMore = false;
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    // 热门关键词点击
    onHotKeywordTap(e) {
      const { keyword } = e.currentTarget.dataset;
      this.keyword = keyword;
      this.performSearch();
    },
    // 搜索历史点击
    onHistoryTap(e) {
      const { keyword } = e.currentTarget.dataset;
      this.keyword = keyword;
      this.performSearch();
    },
    // 清空搜索历史
    onClearHistory() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            common_vendor.index.removeStorageSync("searchHistory");
            common_vendor.index.showToast({
              title: "已清空",
              icon: "success"
            });
          }
        }
      });
    },
    // 菜品点击事件
    onDishTap(e) {
      const { dish } = e.currentTarget.dataset;
      common_vendor.index.navigateTo({
        url: `/pages/dish-detail/dish-detail?id=${dish.id}`
      });
    },
    // 加载搜索历史
    loadSearchHistory() {
      const history = common_vendor.index.getStorageSync("searchHistory") || [];
      this.searchHistory = history;
    },
    // 保存搜索历史
    saveSearchHistory(keyword) {
      let history = common_vendor.index.getStorageSync("searchHistory") || [];
      history = history.filter((item) => item !== keyword);
      history.unshift(keyword);
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      common_vendor.index.setStorageSync("searchHistory", history);
      this.searchHistory = history;
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
    a: common_vendor.o([($event) => $data.keyword = $event.detail.value, (...args) => $options.onSearchInput && $options.onSearchInput(...args)], "41"),
    b: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "f2"),
    c: $data.keyword,
    d: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "42"),
    e: !$data.hasSearched
  }, !$data.hasSearched ? common_vendor.e({
    f: $data.searchHistory.length > 0
  }, $data.searchHistory.length > 0 ? {
    g: common_vendor.o((...args) => $options.onClearHistory && $options.onClearHistory(...args), "cc"),
    h: common_vendor.f($data.searchHistory, (item, k0, i0) => {
      return {
        a: common_vendor.t(item),
        b: item,
        c: common_vendor.o((...args) => $options.onHistoryTap && $options.onHistoryTap(...args), item),
        d: item
      };
    })
  } : {}, {
    i: common_vendor.f($data.hotKeywords, (item, k0, i0) => {
      return {
        a: common_vendor.t(item),
        b: item,
        c: common_vendor.o((...args) => $options.onHotKeywordTap && $options.onHotKeywordTap(...args), item),
        d: item
      };
    })
  }) : {}, {
    j: $data.hasSearched
  }, $data.hasSearched ? common_vendor.e({
    k: !$data.loading
  }, !$data.loading ? {
    l: common_vendor.t($data.pagination.total)
  } : {}, {
    m: $data.searchResults.length > 0
  }, $data.searchResults.length > 0 ? {
    n: common_vendor.f($data.searchResults, (item, k0, i0) => {
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
        k: item.id,
        l: common_vendor.o((...args) => $options.onDishTap && $options.onDishTap(...args), item.id),
        m: item
      });
    })
  } : {}, {
    o: $data.loadingMore
  }, $data.loadingMore ? {} : {}, {
    p: !$data.hasMore && $data.searchResults.length > 0
  }, !$data.hasMore && $data.searchResults.length > 0 ? {} : {}, {
    q: !$data.loading && $data.searchResults.length === 0
  }, !$data.loading && $data.searchResults.length === 0 ? {} : {}) : {}, {
    r: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cdfa925e"]]);
wx.createPage(MiniProgramPage);
