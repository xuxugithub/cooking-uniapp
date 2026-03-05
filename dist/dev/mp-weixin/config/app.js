"use strict";
const COMPILE_ENV = String(
  "dev"
).toLowerCase();
const NORMALIZED_ENV = COMPILE_ENV === "test" ? "dev" : COMPILE_ENV;
const APP_ENV = NORMALIZED_ENV === "prod" ? "prod" : "dev";
const API_BASE_URL_MAP = {
  dev: "http://localhost:8080",
  prod: "https://cook.xuaq.top"
};
const API_BASE_URL = API_BASE_URL_MAP[APP_ENV];
const FILE_PREVIEW_BASE_URL = `${API_BASE_URL}/api/admin/file/preview`;
exports.API_BASE_URL = API_BASE_URL;
exports.APP_ENV = APP_ENV;
exports.FILE_PREVIEW_BASE_URL = FILE_PREVIEW_BASE_URL;
