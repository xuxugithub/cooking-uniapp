"use strict";
const utils_request = require("../utils/request.js");
const wxLogin = (code) => {
  return utils_request.post("/api/app/user/wx-login", { code });
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
