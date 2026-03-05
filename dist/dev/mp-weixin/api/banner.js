"use strict";
const utils_request = require("../utils/request.js");
const getBannerList = (options = {}) => {
  return utils_request.get("/api/app/banner/list", {}, options);
};
exports.getBannerList = getBannerList;
