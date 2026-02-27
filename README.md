# cooking-uniapp（厨小教）

厨小教 - 零基础学做菜超简单（uni-app + Vue3）。

## 环境要求

- **Node.js**: `>= 18.0.0`（因为项目使用 `vite@5`）
- **npm**: 建议使用随 Node 安装的 npm（或你习惯的 pnpm/yarn，但本仓库当前未提供 lock 文件）

建议使用 LTS 版本（例如 Node 16/18）以获得更稳定的依赖安装体验。

## 安装依赖

```bash
npm install
```

## 目录结构约定（重要）

- 本项目源码目录为 `src/`（`src/manifest.json`、`src/pages.json`、`src/main.js`、`src/App.vue` 等均在此目录下）
- 已提供 `vite.config.js`（非 HBuilderX 环境下运行 `uni` 命令需要该文件）

## 运行（开发）

```bash
# 微信小程序（开发环境）
npm run dev:mp-weixin:dev

# 微信小程序（生产环境）
npm run dev:mp-weixin:prod

# H5
npm run dev:h5

# App（app-plus）
npm run dev:app-plus
```

## 构建（生产）

```bash
# 微信小程序（开发环境）
npm run build:mp-weixin:dev

# 微信小程序（生产环境）
npm run build:mp-weixin:prod

# H5
npm run build:h5

# App（app-plus）
npm run build:app-plus
```

## 环境说明

- `dev`：开发环境，接口地址 `http://localhost:8080`
- `prod`：生产环境，接口地址 `https://cook.xuaq.top`
- 默认环境为 `prod`

## 依赖版本说明

- 本项目 `package.json` 中的依赖版本**已锁定为具体版本号**（不使用 `^`/`~` 等可升级符号），以保证不同环境下安装结果更一致。
- 如果你希望升级依赖，建议先本地验证再提交，并配套生成 lock 文件（例如 `package-lock.json`）以进一步提高可复现性。

## 常见问题

### 安装时报 Node 版本不兼容

请先确认 Node 版本满足 `package.json` 的 `engines.node` 要求：

```bash
node -v
```

如需切换 Node，建议使用 nvm（或 fnm）管理多个 Node 版本。

