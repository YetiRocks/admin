<p align="center">
  <img src="https://cdn.prod.website-files.com/68e09cef90d613c94c3671c0/697e805a9246c7e090054706_logo_horizontal_grey.png" alt="Yeti" width="200" />
</p>

---

# Yeti Admin

[![Yeti](https://img.shields.io/badge/Yeti-Application-blue)](https://yetirocks.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-type--safe-ff4154)](https://tanstack.com/router)
[![TanStack Table](https://img.shields.io/badge/TanStack_Table-headless-ff4154)](https://tanstack.com/table)

Unified admin panel for Yeti. Consolidates application management, authentication, telemetry, vector search, and benchmarks into a single authenticated interface.

## Features

### Applications
- **Application Mmanagement** — List, Manage, Add, and Delete Applications, their configs, their code, and their data
- **Git Integration** — Clone repos, pull updates, check status
- **SSH Key Management** — Generate ED25519 deploy keys for private repos

### Auth
- **User Management** — Create, edit, and delete users
- **Role Management** — Configure roles and permissions
- **OAuth Providers** — Manage OAuth provider configurations

### Telemetry
- **Logs** — Real-time log streaming via SSE with level filtering (TRACE through ERROR) and search
- **Spans** — Distributed trace span viewer with live updates
- **Metrics** — Real-time metrics display
- **Connectors** — Configure telemetry export to Grafana, Datadog, OTLP, Splunk, Elasticsearch, or custom endpoints

### Vectors
- **Model Management** — Manage vector models and search status

### Benchmarks
- **Test Grid** — Card-based UI for 11 benchmark tests (REST, GraphQL, Vector, WebSocket, SSE, Blob)
- **History** — View past run results with throughput and latency metrics

## Installation

```bash
# Clone into your Yeti applications folder
cd ~/yeti/applications
git clone https://github.com/yetirocks/yeti-admin.git

# Restart Yeti to load the application
# The admin panel will be available at /admin/
```

## Web UI

Open your browser to:
```
https://localhost:9996/admin/
```

A login page is presented on first access. Authenticate with your Yeti credentials to enter the admin panel.

### Navigation

The top nav bar provides access to five sections:

| Section | Description |
|---|---|
| **Applications** | Application management (grid, data browser, config, files, git) |
| **Auth** | User, role, and OAuth provider management |
| **Telemetry** | Live logs, spans, and metrics with connector configuration |
| **Vectors** | Vector search status |
| **Benchmarks** | Performance benchmarking suite |

### Routes

| Route | View |
|---|---|
| `#/` | Redirects to Applications |
| `#/applications` | Card grid — all apps sorted by extension status then alphabetically |
| `#/applications/{appId}` | Auto-redirects to first data route (or config if no tables) |
| `#/applications/{appId}/data/{database}/{table}` | Paginated table browser |
| `#/applications/{appId}/config` | Readonly JSON config view |
| `#/auth` | Auth dashboard with user/role/provider counts |
| `#/auth/users` | User management |
| `#/auth/roles` | Role management |
| `#/auth/oauth` | OAuth provider management |
| `#/telemetry` | Live telemetry viewer (logs, spans, metrics tabs) |
| `#/vectors` | Vector search status |
| `#/benchmarks` | Benchmark test grid with run history |

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]  Applications  Auth  Telemetry  Vectors  Bench  ⏏│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Content area (varies by section)                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

- **[TanStack Router](https://tanstack.com/router)** — File-based, type-safe routing with hash history
- **[TanStack Table](https://tanstack.com/table)** — Headless table with server-side pagination
- **React 18** + **TypeScript** + **Vite**
- **SSE** — Server-Sent Events for real-time telemetry streaming

## API Endpoints

### Applications

```bash
# List all applications
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/admin/apps

# Get application details
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/admin/apps/my-app

# Create from template
curl -sk -X POST https://localhost:9996/admin/apps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "new-app", "name": "New App", "template": true}'

# Create blank
curl -sk -X POST https://localhost:9996/admin/apps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "new-app", "name": "New App", "template": false}'

# Update config (YAML merge — only specified keys are changed)
curl -sk -X PUT https://localhost:9996/admin/apps/my-app \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"config": {"enabled": false}}'

# Delete application (removes directory and clears plugin cache)
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://localhost:9996/admin/apps/my-app
```

### File Browser

```bash
# List directory contents
curl -sk -H "Authorization: Bearer $TOKEN" \
  "https://localhost:9996/admin/files?app=my-app&path=/"

# Read a file
curl -sk -H "Authorization: Bearer $TOKEN" \
  "https://localhost:9996/admin/files?app=my-app&path=/config.yaml"

# Create/update a file
curl -sk -X POST https://localhost:9996/admin/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"app": "my-app", "path": "/resources/hello.rs", "content": "..."}'

# Delete a file
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" \
  "https://localhost:9996/admin/files?app=my-app&path=/resources/old.rs"
```

### Schemas

```bash
# Get schema info for an app (tables, fields, database, REST URLs)
curl -sk -H "Authorization: Bearer $TOKEN" \
  https://localhost:9996/admin/schemas/my-app
```

### Git Operations

```bash
# Check if a repo URL is accessible
curl -sk -X POST https://localhost:9996/admin/repos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "check", "url": "https://github.com/yetirocks/my-app.git"}'

# Clone a repository
curl -sk -X POST https://localhost:9996/admin/repos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "clone", "url": "https://github.com/yetirocks/my-app.git", "id": "my-app"}'

# Pull latest changes
curl -sk -X POST https://localhost:9996/admin/repos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "pull", "id": "my-app"}'

# Check git status
curl -sk -X POST https://localhost:9996/admin/repos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "status", "id": "my-app"}'
```

### SSH Deploy Keys

```bash
# List all deploy keys
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/admin/keys

# Generate a new ED25519 key pair
curl -sk -X POST https://localhost:9996/admin/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "github-deploy"}'

# Delete a key
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://localhost:9996/admin/keys/key-1
```

### Auth (via yeti-auth)

```bash
# List users
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/yeti-auth/users

# List roles
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/yeti-auth/roles

# List OAuth providers
curl -sk -H "Authorization: Bearer $TOKEN" https://localhost:9996/yeti-auth/oauth_providers
```

### Telemetry (via yeti-telemetry)

Telemetry data is streamed in real-time via SSE. The admin panel consumes endpoints from the `yeti-telemetry` extension for logs, spans, and metrics.

### Benchmarks (via yeti-benchmarks)

```bash
# Get best results across all tests
curl -sk https://localhost:9996/yeti-benchmarks/best-results

# Get runner state
curl -sk https://localhost:9996/yeti-benchmarks/runner

# Start a benchmark test
curl -sk -X POST https://localhost:9996/yeti-benchmarks/runner \
  -H "Content-Type: application/json" \
  -d '{"test": "rest-read"}'
```

Available benchmark tests: `rest-read`, `rest-write`, `rest-update`, `rest-join`, `graphql-read`, `graphql-mutation`, `vector-embed`, `vector-search`, `ws`, `sse`, `blob-retrieval`.

## Access Control

yeti-admin uses yeti-auth for access control. All API endpoints require a Bearer token obtained via login. Configure OAuth rules in config.yaml:

```yaml
extensions:
  - yeti-auth:
      oauth:
        rules:
          - strategy: provider
            pattern: "google"
            role: admin
```

## Project Structure

```
yeti-admin/
├── config.yaml              # App config (route_prefix: /admin)
├── schema.graphql           # AppValidation table schema
├── resources/
│   ├── apps.rs              # Application CRUD (list, get, create, update, delete)
│   ├── files.rs             # File browser/editor with path traversal protection
│   ├── schemas.rs           # Schema parser (extracts @table directives)
│   ├── repos.rs             # Git operations (check, clone, pull, status)
│   └── keys.rs              # SSH deploy key management (ED25519)
├── source/                  # React/Vite/TanStack source
│   ├── vite.config.ts       # Vite config with TanStack Router plugin
│   └── src/
│       ├── main.tsx         # Entry point — RouterProvider
│       ├── router.tsx       # createRouter with hash history
│       ├── routeTree.gen.ts # Auto-generated route tree
│       ├── api.ts           # Fetch wrapper with auth token management
│       ├── types.ts         # TypeScript interfaces
│       ├── index.css        # All styles
│       ├── hooks/
│       │   ├── useToast.tsx # Toast notifications
│       │   └── useSSE.ts   # Server-Sent Events hook for telemetry
│       ├── components/
│       │   ├── AppCard.tsx           # App card for home grid
│       │   ├── DatabaseNav.tsx       # Left sidebar db/table tree with counts
│       │   ├── DataTable.tsx         # TanStack Table with server pagination
│       │   ├── NewAppModal.tsx       # New application creation modal
│       │   ├── auth/                 # Auth management components
│       │   │   ├── DashboardPage.tsx # Auth overview with counts
│       │   │   ├── UsersPage.tsx     # User CRUD
│       │   │   ├── RolesPage.tsx     # Role management
│       │   │   ├── OAuthPage.tsx     # OAuth provider management
│       │   │   └── ...
│       │   ├── telemetry/            # Telemetry viewer components
│       │   │   ├── LogsPanel.tsx     # Live log stream with filtering
│       │   │   ├── SpansPanel.tsx    # Distributed trace spans
│       │   │   ├── MetricsPanel.tsx  # Metrics display
│       │   │   ├── Sidebar.tsx       # Telemetry navigation
│       │   │   ├── configs/          # Connector config forms
│       │   │   │   ├── GrafanaForm.tsx
│       │   │   │   ├── DatadogForm.tsx
│       │   │   │   ├── OtlpForm.tsx
│       │   │   │   ├── SplunkForm.tsx
│       │   │   │   ├── ElasticForm.tsx
│       │   │   │   └── CustomForm.tsx
│       │   │   └── ...
│       │   └── benchmarks/
│       │       └── BenchmarksPanel.tsx  # Benchmark test grid with history
│       └── routes/
│           ├── __root.tsx               # Root layout (login gate, nav bar, outlet)
│           ├── index.tsx                # Redirect to /applications
│           ├── applications/
│           │   ├── index.tsx            # Card grid
│           │   └── $appId/
│           │       ├── route.tsx        # App layout (header, subnav, sidebar)
│           │       ├── index.tsx        # Redirect to first data or config
│           │       ├── config.tsx       # Config textarea
│           │       └── data/
│           │           └── $database.$table.tsx  # Paginated data view
│           ├── auth/
│           │   ├── index.tsx            # Auth dashboard
│           │   ├── users.tsx            # User management
│           │   ├── roles.tsx            # Role management
│           │   └── oauth.tsx            # OAuth provider management
│           ├── telemetry/
│           │   └── index.tsx            # Logs/Spans/Metrics tabs
│           ├── vectors/
│           │   └── index.tsx            # Vector search status
│           └── benchmarks/
│               └── index.tsx            # Benchmark test grid
└── web/                     # Built static SPA
    └── index.html
```

## Learn More

- [Yeti Documentation](https://yetirocks.com/docs)
- [Application Configuration](https://yetirocks.com/docs/reference/app-config)
- [Schema Directives](https://yetirocks.com/docs/reference/schema-directives)

---

Built with [Yeti](https://yetirocks.com) - The fast, declarative database platform.
