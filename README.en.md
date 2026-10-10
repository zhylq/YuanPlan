<p align="center">
  <img src="apps/web/public/yuanplan-logo.png" alt="YuanPlan logo" width="112" />
</p>

# YuanPlan

[简体中文](README.md) · **English**

A self-hosted project collaboration system for individuals and small teams, combining task boards, a project Wiki, and MCP integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zhylq/YuanPlan/actions/workflows/ci.yml/badge.svg)](https://github.com/zhylq/YuanPlan/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.12-339933.svg)](package.json)

[Screenshots](#screenshots) · [Architecture](#architecture) · [Quick start](#quick-start) · [Docker deployment](#docker-deployment) · [MCP integration](#mcp-integration) · [Documentation](#documentation) · [Contributing](#contributing)

Use the web interface to organize projects, track tasks, and maintain documentation. Through MCP, AI clients can participate within their authorized project scope. Business data is stored in PostgreSQL, and attachments are stored in the instance's local filesystem.

> The current source release is **v0.1.1 / MVP**, intended for individuals and small teams running their own instances. Core features, database and attachment recovery, the built service, and Codex MCP runtime integration have been verified. Comprehensive accessibility, actual Claude Desktop integration, and larger workloads still need validation. v0.1.1 only reorganizes repository content; application interfaces and backup formats remain compatible with 0.1.0. New installations initialize an empty database. Verify your own proxy, email, and backup environment before going live. See the [open-source release checks](docs/qa/open-source-readiness-2026-10-10.md) for changes and validation results.

## Why YuanPlan?

- **Keep project context together**: manage tasks, discussions, attachments, and Wiki pages in the same project, with links in both directions between tasks and documents.
- **Choose a task view**: switch between lists, boards, calendars, and timelines, and review progress in the project overview.
- **Control your data**: PostgreSQL stores business data, and local directories store attachments. Deployment guides cover backup and recovery.
- **Bring AI into the workflow**: MCP credentials restrict project access and read/write scope. Operations follow business permissions and are audited.

YuanPlan uses a single-instance deployment and requires an online service and PostgreSQL. It currently has no offline synchronization, MCP OAuth, or validated large-scale high-availability deployment.

## Features

| Area | Features |
| --- | --- |
| Projects and teams | Project management, team membership, invitation links, project roles, and access control |
| Task collaboration | Lists and boards, drag-and-drop ordering, status and priority, assignees, dates, labels, one level of subtasks, and My Tasks |
| Scheduling and overview | Task calendars and timelines, unscheduled tasks, a project overview with saved layouts, and task-scope filters |
| In-app notifications | Task assignment and comment notifications, unread counts, and read status |
| Discussion and history | Comments, activity timelines, change history, and links in both directions between tasks and documents |
| Project Wiki | Hierarchical pages, sibling ordering, rich text, images and tables, autosave, local drafts, version restoration, and conflict handling |
| Resource management | Attachment uploads, archiving, trash and restoration, and orphaned attachment cleanup |
| Account management | Instance initialization, sign-in, account deactivation, email-based recovery, and administrator or host-side recovery |
| AI integration | Project-scoped MCP credentials, task and document read/write operations, comments and history queries, credential revocation, and operation auditing |

The web interface and MCP share business permissions and audit logic. Writes use version checks and idempotency identifiers to handle concurrent changes and request retries.

Mobile browsers use the same address. On narrow screens, navigation prioritizes My Tasks and My Projects, with other entries under More. Project tasks default to a list, with a board view also available. Mobile use requires a connection; complex document editing and bulk management are best done on a desktop.

## Screenshots

These screenshots were captured from a running YuanPlan demo instance on October 10, 2026. All projects, members, tasks, and documents are synthetic; they contain no real business data or server connection details. New installations start with an empty database and do not include this demo content. The screenshots show the Chinese interface; the English descriptions below explain each view.

### Task board

Move work through To Do, In Progress, Awaiting Review, and Done. View priorities, assignees, labels, and due dates, or switch to a list, calendar, or timeline.

![Task board organized by status, with assignees, priorities, and due dates](docs/images/screenshots/task-board.png)

<details>
<summary>Project overview: progress, overdue tasks, and items needing attention</summary>

The overview brings together task statuses, priorities of unfinished tasks, pending tasks by assignee, and items needing attention. Layouts can be configured and saved.

![Project overview showing progress, status distribution, priorities, and tasks needing attention](docs/images/screenshots/project-overview.png)

The demo project has 12 top-level tasks and 2 subtasks. The overview counts currently unarchived top-level tasks without counting subtasks again. Completion rates are based on task counts; pending task counts do not represent hours worked or performance.

</details>

<details>
<summary>Project Wiki: hierarchical pages linked to tasks</summary>

Organize requirements, acceptance criteria, and usage guides in a page hierarchy. Rich text, autosave, version history, and restoration are supported. Open linked tasks from a document or related documents from a task.

![Project Wiki with a page hierarchy, rich-text content, and linked tasks](docs/images/screenshots/project-wiki.png)

</details>

<details>
<summary>Task timeline: date ranges and schedules</summary>

View task date ranges at daily or weekly scales. Unscheduled tasks have a separate entry. This is a task date view; it does not provide complex dependency analysis or automatic resource scheduling.

![Task timeline displaying the date range of each task](docs/images/screenshots/task-timeline.png)

</details>

<details>
<summary>Mobile: browse projects and tasks in your browser</summary>

Mobile and desktop browsers use the same address and project data. Narrow screens prioritize My Tasks and My Projects, and tasks default to a list.

<p align="center">
  <img src="docs/images/screenshots/mobile-tasks.png" alt="Project task list in a mobile browser" width="360" />
</p>

Mobile use requires a connection. Complex document editing and bulk management are best done on a desktop.

</details>

## Architecture

The web interface and external AI clients access the same application over HTTPS. REST and MCP share business services, project permissions, version checks, idempotency handling, and audit logic. Business data is stored in PostgreSQL, with attachments persisted separately.

<p align="center">
  <img src="docs/images/architecture/yuanplan-architecture.en.png" alt="YuanPlan architecture: browsers and external AI clients connect through an HTTPS proxy to shared business services, with separate persistence for database records and attachments" width="800" />
</p>

- **Web entry point**: the Node.js / Hono application serves React static assets and REST APIs. Better Auth handles sign-in and sessions.
- **MCP entry point**: project-scoped credentials restrict read/write access. Clients connect through Streamable HTTP or an optional stdio bridge.
- **Storage and operations**: PostgreSQL stores business data, versions, and audit records. Attachments reside in a persistent directory. The operations CLI provides migrations, maintenance mode, consistent backups, and recovery.

AI models run on the external client side. Operators configure HTTPS certificates and the reverse proxy. The current deployment is a single instance. See [MCP integration](docs/user/mcp-clients.md) and [deployment and backups](docs/deployment/docker-and-backup.md) for details. The diagram is available as [PNG](docs/images/architecture/yuanplan-architecture.en.png) and [editable SVG](docs/images/architecture/yuanplan-architecture.en.svg).

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Mantine, Tiptap, dnd-kit |
| Backend | Node.js, Hono, Better Auth, Zod |
| Storage | PostgreSQL, Drizzle ORM, local attachment directories |
| AI protocol | Model Context Protocol SDK / Streamable HTTP |
| Development and validation | npm Workspaces, Vitest, Playwright, esbuild |

## Quick start

Follow these steps for local development, or use [Docker deployment](#docker-deployment) to run a self-hosted instance.

### Requirements

- Node.js **22.12 or later** and npm.
- PostgreSQL with an existing database and a user that can connect to it. Version **17** is recommended to match container configuration and deployment validation. Validate other versions yourself.
- Git.

### 1. Clone and install dependencies

```bash
git clone https://github.com/zhylq/YuanPlan.git
cd YuanPlan
npm ci
```

### 2. Configure environment variables

Linux / macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` to configure database connections and two independent random secrets:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL for the running application |
| `MIGRATION_DATABASE_URL` | Database connection URL for migrations; it may match the runtime connection during local development |
| `AUTH_SECRET` | Authentication secret, at least 32 random characters |
| `SETUP_TOKEN` | Initial setup token, at least 24 random characters |
| `APP_URL` | Full browser-facing URL; defaults to `http://localhost:5173` in development |
| `PORT` | Backend listening port; defaults to `18420` |
| `UPLOAD_DIR` | Attachment directory; defaults to `.data/uploads` |
| `WEB_DIST` | Frontend build directory; defaults to `apps/web/dist` |
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` |

Run this command twice to generate independent values for the two secrets:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The template uses database port `55432`. Adjust it to your PostgreSQL configuration; the usual default is `5432`. Migrations create the schema, not the database itself.

Optional settings:

| Variable | Purpose |
| --- | --- |
| `MAX_UPLOAD_BYTES` | Per-file upload limit; defaults to 20 MiB, with a maximum of 100 MiB |
| `SMTP_HOST` / `SMTP_PORT` | Mail server host and port; the port defaults to `587` |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Mail authentication and sender settings |
| `VITE_API_URL` | Development proxy target; override only when connecting to a separate API service. By default, it follows `PORT` |
| `TEST_DATABASE_URL` | Dedicated integration-test database; its name must end in `_test` |

Do not commit real secrets, database passwords, or local `.env` files.

### 3. Run migrations and start development servers

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use `SETUP_TOKEN` to initialize the instance and create its administrator, then create a project and invite members.

The frontend waits up to 30 seconds for the API and database to become ready. The health endpoint is [http://localhost:5173/api/health](http://localhost:5173/api/health), which returns JSON containing `status: "ok"` when healthy. Restart development processes after changing `.env`.

## Development and testing

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend development servers together |
| `npm run check:release` | Check public files, example deployment hosts, and documentation links |
| `npm run licenses:generate` | Generate third-party license notices |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run PostgreSQL integration tests |
| `npm run build` | Build the frontend and backend |
| `npm start` | Start the built service |
| `npm run db:migrate` | Run database migrations |
| `npm run bundle:report` | Report initial JavaScript bundle size after a build |
| `npm run benchmark:tasks` | Benchmark task queries against a test database |
| `npm run ops -- files-clean` | Preview orphaned attachment cleanup candidates |

Integration tests require a real PostgreSQL database. Create a dedicated test database and set its connection URL. Tests run migrations and write test data. Do not use a database containing important data.

Linux / macOS:

```bash
export TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/yuanplan_test'
npm run typecheck
npm test
npm run build
```

Windows PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/yuanplan_test'
npm run typecheck
npm test
npm run build
```

Tests still require valid `.env` settings. The test entry point replaces the runtime database connection with `TEST_DATABASE_URL` and rejects connections whose database name does not end in `_test`.

For browser validation, start the local development servers first, then run:

```bash
node scripts/browser-smoke.mjs
node scripts/browser-features.mjs
node scripts/browser-management.mjs
node scripts/browser-recovery.mjs
node scripts/browser-ux.mjs
```

Scripts default to a Chrome path on Windows. On other systems, set `CHROME_PATH` to the browser executable. The smoke script can initialize an unconfigured development instance and save its account to `.data/preview-account.json`. If the instance is already initialized, configure a local test account in that file first. Browser scripts create test business data and are intended only for local validation.

Benchmarks require a migrated `_test` database. Results compare local SQL queries and do not establish production concurrency capacity. See the [performance baseline](docs/plans/2026-09-18-performance-baseline.md).

### Isolated validation matching GitHub CI

Docker Engine and Compose v2 are required. These commands build a validation container from source that excludes local configuration and data, then run a clean installation, dependency audits, release checks, type checking, integration tests, builds, and service smoke checks:

```bash
docker compose -f compose.ci.yaml -p yuanplan-ci-local run --build --rm verify
docker compose -f compose.ci.yaml -p yuanplan-ci-local down --volumes
```

The test database runs in a separate service's temporary filesystem and does not connect to development or production databases. GitHub pull requests from forks use the same workflow with read-only source permissions and no deployment credentials.

## Deployment

### Docker deployment

Docker Engine and Docker Compose v2 are required. The initial build downloads base images and npm dependencies. Run these commands at the repository root:

```bash
cp deploy/.env.example deploy/.env
# Edit deploy/.env: set APP_URL and replace every secret and database password placeholder
docker compose --env-file deploy/.env build
docker compose --env-file deploy/.env up -d app
docker compose --env-file deploy/.env ps -a
```

On Windows PowerShell, copy the configuration with `Copy-Item deploy/.env.example deploy/.env`. Use the random-value command above separately for each secret and password. Hexadecimal database passwords are recommended to avoid connection-URL escaping issues.

Compose waits for the database, runs migrations, and then starts the application. By default, the application port binds only to the host's `127.0.0.1:18420`. Configure an HTTPS reverse proxy on the host and set `APP_URL` to the browser-facing address. Production sign-in uses secure cookies and requires HTTPS. Once `app` is healthy, open that address and use `SETUP_TOKEN` to create the administrator. The proxy must support streaming responses for the MCP route.

The database, attachments, and backups use separate named volumes. Before upgrading, back up the database and attachments and retain the original `AUTH_SECRET` required for recovery. See [container deployment, upgrades, and consistent backups](docs/deployment/docker-and-backup.md) for the full procedure. Do not use `docker compose down --volumes` to restart an instance.

### Node.js deployment

The current deployment consists of one Node.js process, one PostgreSQL instance, and an HTTPS reverse proxy such as Nginx or Caddy. After a build, Node.js serves both the API and frontend static assets.

For Linux / macOS, run at the repository root:

```bash
npm ci
cp .env.example .env
# Edit .env: configure the production database, random secrets, and HTTPS APP_URL
npm run db:migrate
npm run build
NODE_ENV=production npm start
```

Production requirements:

- Set `APP_URL` to the actual HTTPS address and forward proxy requests to the Node.js `PORT`.
- Use separate migration and runtime database accounts with least-privilege grants.
- Persist `UPLOAD_DIR` and include PostgreSQL data and attachments in the same backup and recovery plan.
- Protect authentication secrets, setup tokens, and SMTP credentials.
- Use a process manager and validate email delivery and recovery in the target environment.

The repository includes a Dockerfile, Docker Compose configuration, separate migration and runtime accounts, maintenance-mode consistent backups, and recovery commands for an empty environment. Installation using the [container deployment and backup guide](docs/deployment/docker-and-backup.md) is recommended. Public source contains no instance data, production configuration, or internal operations records. Configure your own TLS proxy and validate SMTP, backup destinations, and business-data recovery in your environment.

See [account recovery and attachment maintenance](docs/deployment/recovery-and-files.md) for account recovery, host-side emergency recovery, and file cleanup.

### Registration and administrator-created accounts

After initialization, the instance administrator chooses a registration mode under **System Administration → System Settings** (`系统管理 → 系统设置`): invitation only, open registration with email verification, or open registration without email verification. Email verification requires `SMTP_HOST` and `SMTP_FROM`. Registration without verification does not require SMTP, and users can sign in after registering. Self-registered accounts are regular users and do not automatically join existing projects or teams. In unverified mode, an email address is only a login identifier; ownership has not been verified.

Administrators can also enter a name and email under **System Administration → Member Management → Add User** (`系统管理 → 成员管理 → 添加用户`). Creation displays a one-time password setup link that must be shared privately with the intended user; it expires after 30 minutes. The account is a regular user and does not automatically join projects or teams. Unverified email addresses cannot use email-based password recovery; administrators can issue reset links from member management.

## MCP integration

After signing in, create a project-scoped credential under **AI & Integrations** (`AI 与集成`). Configure an MCP client that supports Streamable HTTP and custom authentication headers:

```text
URL: https://your-domain.example/api/mcp
Authorization: Bearer <project-scoped credential>
```

Tools support project and member queries, task and first-level subtask read/write operations, comments, Wiki document read/write operations, and history queries. Document tools use supported Markdown and check version conflicts and conversion limits.

Credentials are shown in full only once, when created, and become invalid immediately upon revocation. MCP operations follow project permissions and are audited. Client writes must supply version numbers and idempotency operation identifiers as required by each tool definition. Configuration differs between clients; verified compatibility is documented in the validation records.

The repository includes a local stdio bridge. Desktop clients can start `packages/mcp-stdio/dist/index.js` directly. Codex HTTP/stdio runtime validation has passed; actual Claude Desktop integration still needs validation. See [MCP client integration](docs/user/mcp-clients.md) and the [compatibility validation record](docs/architecture/mcp-compatibility.md) for configuration, builds, and reproduction steps.

## Repository structure

```text
YuanPlan/
├── apps/
│   ├── server/             # Hono API, authentication, business modules, and operations CLI
│   │   └── migrations/     # SQL database migrations
│   └── web/                # React web application
├── packages/
│   ├── contracts/          # Shared types and validation contracts
│   ├── editor-schema/      # Editor structure and Markdown conversion
│   └── mcp-stdio/          # Desktop client stdio-to-HTTP bridge
├── docs/
│   ├── deployment/         # Deployment, recovery, and maintenance
│   ├── user/               # MCP client integration
│   ├── architecture/       # Architecture and compatibility notes
│   ├── qa/                 # Validation records and release checks
│   └── plans/              # Design records, development progress, and validation baselines
├── scripts/                # Browser regression and performance checks
├── tests/                  # PostgreSQL integration tests
└── .env.example            # Environment variable template
```

## Documentation

The linked detailed guides are currently in Chinese. This English README covers the main setup, deployment, and integration steps.

| Document | Purpose |
| --- | --- |
| [Container deployment and backups](docs/deployment/docker-and-backup.md) | Installation, permissions, backups, recovery, and upgrades |
| [Account recovery and attachment maintenance](docs/deployment/recovery-and-files.md) | Password recovery, maintenance, and orphaned file cleanup |
| [MCP client integration](docs/user/mcp-clients.md) | HTTP and stdio configuration, reproduction steps, and troubleshooting |
| [MCP compatibility validation](docs/architecture/mcp-compatibility.md) | Verified integration paths and client limitations |
| [Contributing guide](CONTRIBUTING.md) | Development workflow, tests, and pull request requirements |
| [Security reporting](SECURITY.md) | Vulnerability reporting and information protection |
| [Open-source maintenance and releases](docs/deployment/open-source-release.md) | Public repository settings, maintenance, and initial release procedures |
| [Open-source release checks](docs/qa/open-source-readiness-2026-10-10.md) | Check results, blockers, and the release checklist |

## Troubleshooting

**The frontend fails to start or an API request returns 502**

Check PostgreSQL connectivity, migration status, and whether the API listening port matches the frontend proxy target. If a port is occupied, stop the old development process before restarting. During development hot reloads, use the page's Retry Connection (`重试连接`) action.

**Tests require a dedicated database or report connection refused**

Check `TEST_DATABASE_URL`, the `_test` database-name suffix, the database service, and its port. Tests do not start PostgreSQL automatically. Backup/recovery tests also require CREATEDB permission for the test account and `pg_dump` / `pg_restore` on PATH. Temporary databases are cleaned up after testing.

**Account recovery email does not arrive**

Check SMTP settings and server delivery capability. If email is not configured, contact the instance administrator for a recovery link. If the administrator cannot sign in, consult the host-side emergency recovery guide.

## Contributing

Report bugs and suggestions through [Issues](https://github.com/zhylq/YuanPlan/issues), or improve code and documentation with a pull request.

1. Fork the repository and create a separate branch.
2. Describe the problem, expected behavior, and scope. Include reproduction steps and the environment for bug reports.
3. Add appropriate tests for business behavior changes, then run type checking, relevant tests, and builds.
4. Submit a pull request describing the implementation, validation results, and known limitations.

Do not include passwords, tokens, real database connections, or private user data in issues, logs, or commits. Add new migrations for schema changes; do not alter migrations that have already run.

Read the [contributing guide](CONTRIBUTING.md) before submitting. Report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md), rather than disclosing exploitable details in public issues.

## Development plans

Upcoming areas of work include comprehensive permission and failure-case validation, keyboard accessibility, compatibility with more actual MCP clients, performance, historical data growth, and ongoing backup/recovery validation.

See [development tasks](docs/plans/2026-09-17-development-tasks.md), [development progress](docs/plans/2026-09-17-core-development-progress.md), and the [UX and permissions matrix](docs/plans/2026-09-18-ux-permission-matrix.md). Design records reflect their respective development stages; current behavior is defined by code and validation results.

## License

YuanPlan is licensed under the [MIT License](LICENSE). Third-party dependencies retain their respective copyrights and licenses; see [third-party notices](THIRD_PARTY_NOTICES.md). Builds also provide `/third-party-notices.txt` with the original license texts of dependencies installed for the build platform.
