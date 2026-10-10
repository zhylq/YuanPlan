<p align="center">
  <img src="apps/web/public/yuanplan-logo.png" alt="YuanPlan 标志" width="112" />
</p>

# YuanPlan

面向个人与小型团队的自托管项目协作系统，集任务看板、项目 Wiki 与 MCP 集成于一体。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zhylq/YuanPlan/actions/workflows/ci.yml/badge.svg)](https://github.com/zhylq/YuanPlan/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.12-339933.svg)](package.json)

[快速开始](#快速开始) · [Docker 部署](#docker-部署) · [MCP 集成](#mcp-集成) · [文档导航](#文档导航) · [参与贡献](#参与贡献)

YuanPlan 支持通过网页组织项目、跟踪任务与维护文档，也可通过 MCP 让 AI 客户端在项目授权范围内参与协作。业务数据存储于 PostgreSQL，附件保存在实例本地目录。

> 当前源码发布为 **v0.1.1 / MVP**，面向个人及小型团队自托管使用。核心功能、数据库与附件恢复、构建后的服务以及 Codex MCP 运行时已有验证；完整无障碍、Claude Desktop 实际接入和更大规模负载仍待验证。v0.1.1 仅整理仓库内容，应用接口与备份格式保持 0.1.0 兼容。开源版本默认从空数据库初始化；上线前仍应验证自己的代理、邮件与备份环境。开源整改与验证结果见[开源发布检查](docs/qa/open-source-readiness-2026-10-10.md)。

## 为什么使用 YuanPlan

- **项目资料集中管理**：任务、讨论、附件与 Wiki 在同一项目中维护，支持双向关联。
- **多种任务视图**：列表、看板、日历与时间线适应不同工作方式，项目概览帮助查看进展。
- **自己掌握数据**：PostgreSQL 保存业务数据，本地目录保存附件，可按部署指南备份与恢复。
- **AI 参与协作**：MCP 凭据限定项目与读写范围，操作沿用业务权限并记录审计。

项目采用单实例部署，依赖在线服务与 PostgreSQL。当前没有离线同步、MCP OAuth 或经过验证的大规模高可用部署方案。

## 功能概览

| 模块 | 功能 |
| --- | --- |
| 项目与团队 | 项目管理、团队成员、邀请链接、项目角色与访问控制 |
| 任务协作 | 列表与看板、拖拽排序、状态与优先级、负责人、日期、标签、一级子任务及我的任务 |
| 日期与概览 | 任务日历与时间线、未排期任务、可保存布局的项目概览及任务范围筛选 |
| 站内通知 | 任务分配与评论通知、未读数量及已读状态 |
| 讨论与追踪 | 评论、活动时间线、变更历史、任务与文档双向关联 |
| 项目 Wiki | 层级目录、同级排序、富文本、图片与表格、自动保存、本地草稿、版本恢复与冲突处理 |
| 资源管理 | 附件上传、归档、回收站与恢复、孤立附件清理 |
| 账号管理 | 实例初始化、登录、账号停用、邮件找回、管理员及主机端恢复 |
| AI 集成 | MCP 项目范围凭据、任务与文档读写、评论和历史查询、凭据撤销及操作审计 |

网页和 MCP 共用业务权限与审计逻辑。写入操作使用版本检查与幂等标识，处理并发修改和请求重试。

手机浏览器使用相同的网页地址。窄屏导航优先展示“我的任务”和“我的项目”，其他入口在“更多”中；项目任务默认以列表展示，也可切换到看板。手机端保持联网使用，复杂文档编辑与批量管理建议在电脑端进行。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React、TypeScript、Vite、Mantine、Tiptap、dnd-kit |
| 后端 | Node.js、Hono、Better Auth、Zod |
| 数据存储 | PostgreSQL、Drizzle ORM、本地附件目录 |
| AI 协议 | Model Context Protocol SDK / Streamable HTTP |
| 开发与验证 | npm Workspaces、Vitest、Playwright、esbuild |

## 快速开始

本地开发按以下步骤安装；自托管运行也可直接使用后面的 [Docker 部署](#docker-部署)。

### 环境要求

- Node.js **22.12 或更高版本**，以及 npm。
- PostgreSQL；推荐 **17**（与容器配置及部署验收一致），并已创建可连接的数据库与用户。其他版本需自行验证。
- Git。

### 1. 获取代码与安装依赖

```bash
git clone https://github.com/zhylq/YuanPlan.git
cd YuanPlan
npm ci
```

### 2. 配置环境变量

Linux / macOS：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`，设置数据库连接及两个独立的随机密钥：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | 应用运行时 PostgreSQL 连接地址 |
| `MIGRATION_DATABASE_URL` | 数据库迁移连接地址；本地开发可与运行时连接相同 |
| `AUTH_SECRET` | 身份认证密钥，至少 32 个随机字符 |
| `SETUP_TOKEN` | 首次初始化令牌，至少 24 个随机字符 |
| `APP_URL` | 浏览器访问的完整地址，开发默认为 `http://localhost:5173` |
| `PORT` | 后端监听端口，默认 `18420` |
| `UPLOAD_DIR` | 附件目录，默认 `.data/uploads` |
| `WEB_DIST` | 前端构建目录，默认 `apps/web/dist` |
| `NODE_ENV` | 运行环境：`development`、`production` 或 `test` |

分别运行两次以下命令，为两个密钥生成独立随机值：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

模板中的数据库端口为 `55432`，请按实际 PostgreSQL 配置修改；常见默认端口为 `5432`。迁移命令创建表结构，但不会创建数据库本身。

可选配置：

| 变量 | 说明 |
| --- | --- |
| `MAX_UPLOAD_BYTES` | 单文件上传上限，默认 20 MiB，最大 100 MiB |
| `SMTP_HOST` / `SMTP_PORT` | 邮件服务主机与端口，端口默认 `587` |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 邮件认证信息及发件人 |
| `VITE_API_URL` | 开发代理目标地址；仅连接独立 API 服务时覆盖，默认跟随 `PORT` |
| `TEST_DATABASE_URL` | 集成测试专用数据库，数据库名必须以 `_test` 结尾 |

不要将真实密钥、数据库密码或本地 `.env` 提交到仓库。

### 3. 执行迁移并启动

```bash
npm run db:migrate
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)，使用 `SETUP_TOKEN` 完成首次初始化并创建实例管理员，然后创建项目、邀请成员。

前端启动时会等待 API 与数据库就绪，最长 30 秒。健康检查地址为 [http://localhost:5173/api/health](http://localhost:5173/api/health)，正常时返回包含 `status: "ok"` 的 JSON。修改 `.env` 后需重启开发进程。

## 开发与测试

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 同时启动前后端开发服务 |
| `npm run check:release` | 检查公共文件、示例部署地址与文档链接 |
| `npm run licenses:generate` | 生成第三方许可通知 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | PostgreSQL 集成测试 |
| `npm run build` | 构建前端及后端 |
| `npm start` | 启动已构建的服务 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run bundle:report` | 构建后统计首屏 JavaScript 体积 |
| `npm run benchmark:tasks` | 在测试库中执行任务查询基准 |
| `npm run ops -- files-clean` | 预览孤立附件清理候选 |

集成测试依赖真实 PostgreSQL。先创建专用测试库，再设置连接地址；测试会自动执行迁移并写入测试数据。不要使用包含重要数据的数据库。

Linux / macOS：

```bash
export TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/yuanplan_test'
npm run typecheck
npm test
npm run build
```

Windows PowerShell：

```powershell
$env:TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/yuanplan_test'
npm run typecheck
npm test
npm run build
```

测试仍需有效的 `.env` 配置。测试入口将运行时数据库连接替换为 `TEST_DATABASE_URL`，并拒绝数据库名不以 `_test` 结尾的连接。

浏览器验证需先启动本地开发服务，再执行：

```bash
node scripts/browser-smoke.mjs
node scripts/browser-features.mjs
node scripts/browser-management.mjs
node scripts/browser-recovery.mjs
node scripts/browser-ux.mjs
```

脚本默认使用 Windows 下的 Chrome 路径；其他环境需通过 `CHROME_PATH` 指定浏览器可执行文件。冒烟脚本可初始化未配置的开发实例，并将账号保存到 `.data/preview-account.json`；若实例已初始化，需先在该文件配置本地测试账号。浏览器脚本会创建测试业务数据，仅用于本地验证。

性能基准需使用已迁移的 `_test` 数据库，结果只代表本机 SQL 查询对比，不代表生产并发容量。详见[性能基线](docs/plans/2026-09-18-performance-baseline.md)。

### 与 GitHub CI 相同的隔离验证

需要 Docker Engine / Compose v2；以下命令从排除本地配置和数据的源码构建验证容器，执行干净安装、依赖审计、发布检查、类型检查、集成测试、构建与服务冒烟检查：

```bash
docker compose -f compose.ci.yaml -p yuanplan-ci-local run --build --rm verify
docker compose -f compose.ci.yaml -p yuanplan-ci-local down --volumes
```

测试数据库位于独立服务的临时文件系统，不连接开发或生产数据库。GitHub Fork PR 使用相同流程，作业只授予读取源码权限，不提供部署凭据。

## 部署

### Docker 部署

需要 Docker Engine 与 Docker Compose v2；首次构建会下载基础镜像与 npm 依赖。在仓库根目录执行：

```bash
cp deploy/.env.example deploy/.env
# 编辑 deploy/.env，设置 APP_URL 并替换全部密钥和数据库密码占位值
docker compose --env-file deploy/.env build
docker compose --env-file deploy/.env up -d app
docker compose --env-file deploy/.env ps -a
```

Windows PowerShell 使用 `Copy-Item deploy/.env.example deploy/.env` 复制配置。用前面的随机密钥生成命令分别生成每个密钥及密码，数据库密码建议使用十六进制，避免连接 URL 转义问题。

Compose 会等待数据库就绪，先执行迁移，再启动应用。应用端口默认只绑定宿主机 `127.0.0.1:18420`；需要在宿主机配置 HTTPS 反向代理，并将 `APP_URL` 设置为用户访问的地址。生产登录使用安全 Cookie，需通过 HTTPS 访问。等待 `app` 健康后访问该地址，用 `SETUP_TOKEN` 创建管理员。MCP 路由的代理需支持流式响应。

数据库、附件和备份分别保存在命名卷中。升级前备份数据库与附件，并保留恢复所需的原始 `AUTH_SECRET`。完整步骤见[容器部署、升级与一致备份](docs/deployment/docker-and-backup.md)，不要使用 `docker compose down --volumes` 作为重启命令。

### Node.js 部署

当前部署方式为一个 Node.js 进程、一个 PostgreSQL 实例，以及 Nginx / Caddy 等 HTTPS 反向代理。构建后，Node.js 同时提供 API 和前端静态资源。

以下以 Linux / macOS 为例，在仓库根目录执行：

```bash
npm ci
cp .env.example .env
# 编辑 .env：设置生产数据库、随机密钥和 HTTPS APP_URL
npm run db:migrate
npm run build
NODE_ENV=production npm start
```

生产配置要求：

- 将 `APP_URL` 设置为实际 HTTPS 地址，反向代理转发到 Node.js 的 `PORT`。
- 使用独立的迁移账号与运行时数据库账号，并按最小权限配置授权。
- 持久化 `UPLOAD_DIR`，将 PostgreSQL 数据与附件目录共同纳入备份和恢复方案。
- 妥善保管认证密钥、初始化令牌和 SMTP 凭据。
- 使用进程管理工具管理服务，并在目标环境验证邮件投递与恢复流程。

仓库已提供 Dockerfile、Docker Compose、独立迁移与运行账号、维护模式一致备份及空环境恢复命令。推荐按[容器部署与备份指南](docs/deployment/docker-and-backup.md)安装；公开源码不包含实例数据、生产配置或内部运维记录。TLS 代理需自行配置，部署方应在自身环境验证 SMTP、备份目标与业务恢复。

账号找回、主机紧急恢复及文件清理详见[账号恢复与附件维护](docs/deployment/recovery-and-files.md)。

### 注册与后台建号

首次初始化后，系统管理员在“系统管理 → 系统设置”选择注册方式：仅限邀请、开放注册（邮件验证）或开放注册（无需邮箱验证）。邮件验证模式需要配置 `SMTP_HOST` 和 `SMTP_FROM`；无需邮箱验证模式不需要 SMTP，用户注册后即可登录。自行注册的账号默认是普通用户，不自动加入已有项目或团队。邮箱在无需验证模式下仅作登录标识，不代表已验证归属。

系统管理员也可以在“系统管理 → 成员管理 → 添加用户”填写姓名和邮箱。创建后会显示一次性设置密码链接，需通过受控渠道交给本人；链接 30 分钟内有效。该账号同样是普通用户，不自动加入项目或团队。未验证邮箱不能使用邮件找回密码，可由系统管理员在成员管理中签发重置链接。

## MCP 集成

登录后，在“AI 与集成”创建项目范围凭据。在支持 Streamable HTTP 及自定义认证头的 MCP 客户端中配置：

```text
URL: https://your-domain.example/api/mcp
Authorization: Bearer <项目范围凭据>
```

服务提供项目及成员查询、任务与一级子任务读写、评论、Wiki 文档读写及历史查询等工具。文档工具使用受支持的 Markdown，并检查版本冲突与转换限制。

凭据仅在创建时完整显示一次，撤销后立即失效。MCP 操作受项目权限控制并记录审计；客户端写入需按工具定义提供版本号及幂等操作标识。不同客户端的配置格式各异，实际兼容范围以验收记录为准。

仓库提供本地 stdio 桥接，可由桌面客户端直接启动 `packages/mcp-stdio/dist/index.js`。Codex 的 HTTP/stdio 实际运行时验证已通过；Claude Desktop 仍待实际客户端验收。配置、构建与复现方式见 [MCP 客户端接入](docs/user/mcp-clients.md)及[兼容验收记录](docs/architecture/mcp-compatibility.md)。

## 项目结构

```text
YuanPlan/
├── apps/
│   ├── server/             # Hono API、认证、业务模块及运维 CLI
│   │   └── migrations/     # SQL 数据库迁移
│   └── web/                # React 网页应用
├── packages/
│   ├── contracts/          # 共享类型与校验契约
│   ├── editor-schema/      # 编辑器结构及 Markdown 转换
│   └── mcp-stdio/          # 桌面客户端 stdio → HTTP 桥接
├── docs/
│   ├── deployment/         # 部署、恢复与维护
│   ├── user/               # MCP 客户端接入
│   ├── architecture/       # 架构及兼容性说明
│   ├── qa/                 # 验收记录和发布检查
│   └── plans/              # 设计记录、开发进度与验证基线
├── scripts/                # 浏览器回归与性能检查脚本
├── tests/                  # PostgreSQL 集成测试
└── .env.example            # 环境变量模板
```

## 文档导航

| 文档 | 用途 |
| --- | --- |
| [容器部署与备份](docs/deployment/docker-and-backup.md) | 安装、权限、备份、恢复与升级 |
| [账号恢复与附件维护](docs/deployment/recovery-and-files.md) | 密码恢复、维护与孤立文件清理 |
| [MCP 客户端接入](docs/user/mcp-clients.md) | HTTP 和 stdio 配置、复现及排错 |
| [MCP 兼容验收](docs/architecture/mcp-compatibility.md) | 已验证链路与客户端限制 |
| [贡献指南](CONTRIBUTING.md) | 开发流程、测试与 Pull Request 要求 |
| [安全反馈](SECURITY.md) | 漏洞报告方式及信息保护 |
| [开源维护与发布](docs/deployment/open-source-release.md) | 公共仓库设置、维护与首次发布 |
| [开源发布检查](docs/qa/open-source-readiness-2026-10-10.md) | 本次检查结论、阻塞项及发布清单 |

## 常见问题

**前端启动失败或接口返回 502**

检查 PostgreSQL 是否可连接、数据库是否已迁移，以及终端中的 API 监听端口与前端代理目标是否一致。若端口被占用，停止旧开发进程后再启动。开发热重载期间可使用页面中的“重试连接”。

**测试提示需要独立数据库或连接被拒绝**

检查 `TEST_DATABASE_URL`、数据库名的 `_test` 后缀、数据库服务及端口。测试不会自动启动 PostgreSQL。备份恢复测试另需测试账号具备 CREATEDB 权限，且 PATH 中可运行 `pg_dump`、`pg_restore`；临时数据库在测试结束后清理。

**无法收到账号恢复邮件**

检查 SMTP 配置及服务器投递能力。未配置邮件时，可联系实例管理员签发恢复链接；实例管理员无法登录时，参阅主机端紧急恢复指南。

## 参与贡献

欢迎通过 [Issues](https://github.com/zhylq/YuanPlan/issues) 提交缺陷与建议，或通过 Pull Request 改进代码和文档。

1. Fork 仓库并创建独立分支。
2. 描述问题、预期行为与变更范围；缺陷报告请附复现步骤和运行环境。
3. 为业务行为变更补充必要测试，执行类型检查、相关测试与构建。
4. 提交 Pull Request，说明实现方案、验证结果及已知限制。

请勿在 Issue、日志或提交中包含密码、令牌、真实数据库连接或用户隐私数据。数据库结构调整应新增迁移文件，不修改已执行的历史迁移。

提交前请阅读[贡献指南](CONTRIBUTING.md)。安全漏洞请按 [SECURITY.md](SECURITY.md) 私密反馈，避免在公开 Issue 中披露可利用细节。

## 开发计划

后续重点包括完整权限与故障验收、键盘无障碍、更多实际 MCP 客户端兼容性，以及性能、历史数据增长和持续备份恢复验证。

详细范围见[开发任务](docs/plans/2026-09-17-development-tasks.md)、[开发进度](docs/plans/2026-09-17-core-development-progress.md)与[体验和权限矩阵](docs/plans/2026-09-18-ux-permission-matrix.md)。设计记录反映对应开发阶段，当前行为以代码和验证结果为准。

## 许可证

YuanPlan 使用 [MIT License](LICENSE)。第三方依赖的版权及许可证归各自权利人所有，详见 [第三方通知](THIRD_PARTY_NOTICES.md)。构建同时提供 `/third-party-notices.txt`，保留当前平台安装依赖的原始许可文本。
