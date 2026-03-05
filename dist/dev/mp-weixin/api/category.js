"use strict";
const utils_request = require("../utils/request.js");
const getCategoryList = (options = {}) => {
  return utils_request.get("/api/app/category/list", {}, options);
};
exports.getCategoryList = getCategoryList;
