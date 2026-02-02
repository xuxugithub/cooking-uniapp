"use strict";
require("../common/vendor.js");
const getImageUrl = (imagePath) => {
  if (!imagePath)
    return "";
  if (imagePath.startsWith("http"))
    return imagePath;
  return `https://cook.xuaq.top/api/admin/file/preview/${imagePath}`;
};
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
const getDifficultyText = (difficulty) => {
  const map = { 1: "简单", 2: "中等", 3: "困难" };
  return map[difficulty] || "未知";
};
const getDifficultyColor = (difficulty) => {
  const map = { 1: "#67c23a", 2: "#e6a23c", 3: "#f56c6c" };
  return map[difficulty] || "#909399";
};
exports.debounce = debounce;
exports.getDifficultyColor = getDifficultyColor;
exports.getDifficultyText = getDifficultyText;
exports.getImageUrl = getImageUrl;
