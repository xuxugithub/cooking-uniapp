"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "https://cook.xuaq.top";
const request = (options) => {
  return new Promise((resolve, reject) => {
    if (options.loading !== false) {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
    }
    const token = common_vendor.index.getStorageSync("token");
    common_vendor.index.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        ...options.header
      },
      success: (res) => {
        if (options.loading !== false) {
          common_vendor.index.hideLoading();
        }
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
        if (options.loading !== false) {
          common_vendor.index.hideLoading();
        }
        console.error("请求失败:", err);
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
