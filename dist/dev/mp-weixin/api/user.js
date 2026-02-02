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
const getFollowList = (userId) => {
  return utils_request.get("/api/app/follow/list", { userId });
};
const getFansList = (userId) => {
  return utils_request.get("/api/app/follow/fans", { userId });
};
const followUser = (followUserId) => {
  return utils_request.post("/api/app/follow/add", { followUserId });
};
const unfollowUser = (followUserId) => {
  return utils_request.post("/api/app/follow/remove", { followUserId });
};
exports.followUser = followUser;
exports.getFansList = getFansList;
exports.getFollowList = getFollowList;
exports.getUserFavorites = getUserFavorites;
exports.getUserInfo = getUserInfo;
exports.unfollowUser = unfollowUser;
exports.wxLogin = wxLogin;
