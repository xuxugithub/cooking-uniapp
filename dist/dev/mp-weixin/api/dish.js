"use strict";
const utils_request = require("../utils/request.js");
const getDishPage = (params) => {
  return utils_request.get("/api/app/dish/page", params);
};
const getDishById = (id) => {
  return utils_request.get(`/api/app/dish/${id}`);
};
const getDishSteps = (dishId) => {
  return utils_request.get(`/api/app/dish-step/list/${dishId}`);
};
const getDishIngredients = (dishId) => {
  return utils_request.get(`/api/app/dish-ingredient/list/${dishId}`);
};
const searchDish = (keyword, params = {}) => {
  return utils_request.get("/api/app/dish/search", { keyword, ...params });
};
const increaseViewCount = (dishId) => {
  return utils_request.post(`/api/app/dish/${dishId}/view`);
};
const toggleFavorite = (dishId) => {
  return utils_request.post(`/api/app/dish/${dishId}/favorite`);
};
const recordViewHistory = (dishId) => {
  return utils_request.post(`/api/app/dish/${dishId}/view-history`);
};
const getAllDishes = (params = {}) => {
  return utils_request.get("/api/app/dish/all", params);
};
exports.getAllDishes = getAllDishes;
exports.getDishById = getDishById;
exports.getDishIngredients = getDishIngredients;
exports.getDishPage = getDishPage;
exports.getDishSteps = getDishSteps;
exports.increaseViewCount = increaseViewCount;
exports.recordViewHistory = recordViewHistory;
exports.searchDish = searchDish;
exports.toggleFavorite = toggleFavorite;
