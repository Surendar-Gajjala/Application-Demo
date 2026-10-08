# Demo-Application

A read-only integration over a hosted data platform. The hosted server is the source of truth; the Spring Boot backend calls it with a Bearer token, maps the responses into its own models and serves a clean local API; the React frontend talks only to that local API. Nothing is stored in a database.

Requirements and design rules: [CLAUDE.md](CLAUDE.md).

```text
Browser ──► frontend/ (React, :3000) ──/api proxy──► backend/ (Spring Boot, :8080) ──Bearer token──► hosted server
```

## What it does

| Tab | Shows | Local API |
|---|---|---|
| **Dashboards** | Totals for top-level BOMs, Items, Parts and Sites, each linking to its tab | the list endpoints with `size=1`, plus `/api/item-hierarchy/products` |
| **Item Hierarchy** | Products expanded into BOM child items (with qty) and the parts each item sources | `GET /api/item-hierarchy` |
| **Items** | Paged item table; an item number opens the item's details | `GET /api/items` |
| **Item details** | **Overview** (all item properties in sections, risk reasons included) and **Sources** (the item's sourced parts) | `GET /api/items/{id}/overview`, `GET /api/items/{id}/sources` |
| **Parts** | Paged part table | `GET /api/parts` |
| **Sites** | Paged site table | `GET /api/sites` |

All tables page on the server (`page` from 0, `size` 1–100, default 25) and search within the page on screen.

## Folders

| Folder | Stack | Details |
|---|---|---|
| [backend/](backend) | Java 17, Spring Boot 3.3, Maven | [backend/README.md](backend/README.md): layers, endpoints, hosted calls, error mapping |
| [frontend/](frontend) | React 19, TypeScript, Tailwind CSS 4, Vite 6, TanStack Query, React Router | pages in `src/pages`, shared table pieces in `src/components/table` |

## Configuration

The backend reads these from the environment, or from `backend/.env` (git-ignored). Copy [backend/.env.example](backend/.env.example) to start.

| Variable | Required | Purpose |
|---|---|---|
| `EXTERNAL_API_URL` | yes | Hosted query-config endpoint (Items, Parts, Sites, hierarchy anchors) |
| `EXTERNAL_API_GRAPH_URL` | yes | Hosted graph-match endpoint (Item Hierarchy, item Sources) |
| `EXTERNAL_API_OBJECT_URL` | yes | Hosted single-object endpoint (item Overview); the item id is appended |
| `EXTERNAL_API_TOKEN` | yes | Bearer token. **Secret: only in `backend/.env`, never in `.env.example` or Git** |
| `EXTERNAL_API_CONNECT_TIMEOUT`, `EXTERNAL_API_READ_TIMEOUT` | no | Defaults `5s` and `30s` |
| `SERVER_PORT` | no | Default `8080` |

The backend refuses to start if a required value is missing. The token is never logged, returned or sent to the browser.

> **The hosted token expires after about 24 hours.** When it does, every tab shows "The item data source rejected the request." Put a fresh token in `backend/.env` and restart the backend; it only reads `.env` at startup.

## Run locally

Requires JDK 17+ and Maven for the backend, and Node.js 22.3+ for the frontend.

1. **Backend**, started from `backend/` so it finds `.env`:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
2. **Frontend**, in a second terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:3000.

**Debugging:** in VS Code, use **Debug Item Integration** (starts the backend with breakpoints), or start it with `-Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"` and use **Attach to mvn spring-boot:run (port 5005)**.

## Tests

```bash
cd backend  && mvn test
cd frontend && npm run typecheck && npm run test
```

Backend tests mock the hosted server (`MockRestServiceServer`) and use real response shapes. Frontend tests render each page against mocked API responses (MSW).

## Notes

- **Item Hierarchy speed:** one page of 25 products takes about 6–9 seconds, almost all of it the hosted graph traversal. Responses are gzip-compressed (about 4.4 MB → 400 KB).
- **Sites:** the hosted environment currently has no sites, so the Sites tab shows its empty state.
- **Frontend toolchain:** pinned to Vite 6, Vitest 3 and jsdom 26, which still support Node 22.3. Newer majors need Node 22.12+.
