"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "https://cook.xuaq.top";
const request = (options) => {
  return new Promise((resolve, reject) => {
    let loadingShown = false;
    if (options.loading !== false) {
      try {
        common_vendor.index.showLoading({
          title: "加载中...",
          mask: true
        });
        loadingShown = true;
      } catch (e) {
        console.warn("showLoading failed:", e);
      }
    }
    const safeHideLoading = () => {
      if (loadingShown) {
        try {
          common_vendor.index.hideLoading();
          loadingShown = false;
        } catch (e) {
          console.warn("hideLoading failed:", e);
        }
      }
    };
    const token = common_vendor.index.getStorageSync("token");
    common_vendor.index.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        "token": token || "",
        ...options.header
      },
      success: (res) => {
        safeHideLoading();
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data);
          } else {
            common_vendor.index.showToast({
              title: res.data.message || "请求失败",
              icon: "none"
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("userInfo");
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          reject(res);
        } else {
          common_vendor.index.showToast({
            title: `请求失败 ${res.statusCode}`,
            icon: "none"
          });
          reject(res);
        }
      },
      fail: (err) => {
        safeHideLoading();
        common_vendor.index.showToast({
          title: "网络请求失败",
          icon: "none"
        });
        reject(err);
      }
    });
  });
};
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: "GET",
    data,
    ...options
  });
};
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: "POST",
    data,
    ...options
  });
};
exports.get = get;
exports.post = post;
