# Demo-Application

Read-only Item integration: the hosted server is the source of truth, the backend fetches and maps Item data in one call, and the frontend shows it. Requirements: [CLAUDE.md](CLAUDE.md).

```text
frontend/  React + Tailwind UI (port 3000)  ->  /api proxy  ->  backend/  Spring Boot API (port 8080)  ->  hosted server
```

| Folder | Stack | Details |
|---|---|---|
| [backend/](backend) | Java 17, Spring Boot 3, Maven | [backend/README.md](backend/README.md) |
| [frontend/](frontend) | React 19, TypeScript, Tailwind 4, Vite 6, TanStack Query | below |

## Run locally

1. Backend: create `backend/.env` from [backend/.env.example](backend/.env.example) with the hosted URL and token, then:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
2. Frontend (Node 22.3+):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:3000/items.

To debug the backend in VS Code, use **Debug Item Integration** in Run and Debug.

## Tests

```bash
cd backend && mvn test
cd frontend && npm run typecheck && npm run test
```
