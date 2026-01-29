"use strict";
const utils_request = require("../utils/request.js");
const wxLogin = (code) => {
  return utils_request.post("/app/user/wx-login", { code });
};
const getUserInfo = () => {
  return utils_request.get("/app/user/info");
};
const getUserFavorites = (params = {}) => {
  return utils_request.get("/app/user/favorites", params);
};
exports.getUserFavorites = getUserFavorites;
exports.getUserInfo = getUserInfo;
exports.wxLogin = wxLogin;
