"use strict";
const utils_request = require("../utils/request.js");
const getCategoryList = () => {
  return utils_request.get("/app/category/list");
};
exports.getCategoryList = getCategoryList;
