"use strict";
const utils_request = require("../utils/request.js");
const getBannerList = () => {
  return utils_request.get("/app/banner/list");
};
exports.getBannerList = getBannerList;
