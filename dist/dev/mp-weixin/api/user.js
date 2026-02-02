"use strict";
const utils_request = require("../utils/request.js");
const wxLogin = (code, userInfo = null) => {
  const data = { code };
  if (userInfo) {
    data.userInfo = userInfo;
  }
  return utils_request.post("/api/app/user/wx-login", data);
};
const getUserInfo = () => {
  return utils_request.get("/api/app/user/info");
};
const getUserFavorites = (params = {}) => {
  return utils_request.get("/api/app/favorite/list", params);
};
exports.getUserFavorites = getUserFavorites;
exports.getUserInfo = getUserInfo;
exports.wxLogin = wxLogin;
