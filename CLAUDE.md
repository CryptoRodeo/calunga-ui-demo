# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm ci                    # Install deps
npm run start:dev         # Dev server (client:3000)
npm run build             # Build all workspaces
npm run check             # Lint/format check
npm run check:write       # Fix lint/format
npm run test              # Run tests

# Workspace-specific
npm run build -w client
npm run test -w client
npm run coverage -w client
```

## Architecture

### Workspaces
- `common/` - Shared ESM: env config + branding
- `client/` - React 19 + Vite + PatternFly 6
- `server/` - Express: static serve + API proxy

### Env Vars (Unique Pattern)
Server → encodes env → injects as `window._env` via EJS → client decodes

**Why**: Single build works across envs (dev/staging/prod)

**Server-only** (not sent to client): `PORT`, `CALUNGA_API_URL`, `BRANDING`

### Client State Pattern

Feature-scoped Context + composable hooks (no global state):

```typescript
// Local data (client-side filtering/sorting/pagination)
const tableState = useTableControlState({columnNames, sortableColumns, filterCategories, persistTo: "urlParams"});
const derivedState = useLocalTableControlDerivedState({...tableState, items: myData});
const tableControls = useTableControlProps({...tableState, ...derivedState});

// Remote data (server-side filtering/sorting/pagination)
const tableState = useTableControlState({...});
const hubParams = getHubRequestParams(tableState);
const result = await getHubPaginatedResult(`/api/v2/endpoint`, hubParams);
const tableControls = useTableControlProps({...tableState, currentPageItems: result.data, totalItemCount: result.total});
```

Prefer `persistTo: "urlParams"` for shareable URLs.

### Key Dirs
```
client/src/app/
├─ api/rest.ts          - API endpoints, axios helpers
├─ api/models.ts        - HubFilter, HubRequestParams, HubPaginatedResult
├─ components/          - FilterPanel, FilterToolbar, TableControls, HookFormPFFields
├─ hooks/table-controls/ - useTableControlState, useTableControlProps
├─ pages/               - Feature pages (each has own Context)
├─ layout/              - Header, Sidebar, DefaultLayout
└─ env.ts               - Decode window._env
```

### Server
Express does 2 things:
1. Serve static client + inject env via EJS
2. Proxy: `/auth` → OIDC, `/api` → backend API

Cookie → Bearer token conversion (extracts `keycloak_cookie` → sets `Authorization` header)

## Common Tasks

**Add page:**
1. Create `client/src/pages/my-feature/`
2. Add route to `Routes.tsx` + `Paths`
3. Create Provider: `useTableControlState` → `useTableControlProps` → Context
4. Update `layout/sidebar.tsx`

**Modify table:**
- Update `columnNames`, `sortableColumns`, `filterCategories` in `useTableControlState()`

**Integrate API:**
- Add endpoint to `api/rest.ts`
- Use `getHubPaginatedResult()` or axios
- Pass to `useTableControlProps({currentPageItems, totalItemCount})`

## Build

- Client: Vite
- Server: Rollup
- Common: Rollup (ESM + CJS)
- Lint: Biome (double quotes, 2 spaces)

**Dev**: Vite on :3000 proxies `/auth` + `/api`
**Prod**: Express on :8080 serves static + proxies

**GitHub Pages**: `NODE_ENV=development BASE_URL=/calunga-ui-demo/ npm run build`
