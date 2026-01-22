# Ai Dental Node.js API

Lightweight Node.js + Express backend for AI-powered dental image processing (preview/simulation). This README is concise — check the source files for exact behavior: controllers/, services/, views/ , public/, and package.json.

Quick points
- Entry point and scripts: `src/server.js` then `src/app.js`.
- Routes live under src/routes — open those files to see exact route names, parameters and request formats.
- AI integration is implemented in src/controllers/imageController (look controller/ and services/ for related files).
- Uploads  are handled by middleware in app.js.

Quick start (local)
1. Install deps
```bash
npm install
```
2. Create .env from .env.example and fill required values:
```bash
cp .env.example .env
# edit .env with your values
```
3. Start
```bash
# development (if node-dev configured)
npm run dev

# production
npm start
```

Verify scripts and entrypoint
- Open package.json to confirm scripts (start/dev) and the main script path.
- If a `dev` script is absent, run the main file directly: `node server.js` (adjust path as needed).

Minimum environment variables (match with your code; confirm in src/config or process.env usage)
- NODE_ENV (optional) — development/production
- PORT — server port (default commonly 3000)
- API_BASE_URL — used by frontends/Postman
- OPENAI_API_KEY — required if AI provider used
- ALLOWED_ORIGINS  — array of allowed origins
Always prefer .env.example for placeholders and do not commit secrets.

Common endpoints (open src/routes to confirm exact names and params)
- GET /             — homepage/status (may return HTML or JSON)
- GET /health       — health check (expected 200 + small JSON)
- POST /create-image — main image upload/processing endpoint
  - May accept multipart/form-data (file field e.g. `image`) .
  - Query parameters and body fields vary — inspect src/routes/image* and controllers for exact keys.

How to check exact request/response formats
- Open controllers/imageController.js or app.js for required query/body fields.
- Open /controllers/imageController.js (or similar) to see validation, required fields and response shape.

Postman / API testing
- Use Postman with base_url set to http://localhost:<PORT>.
- For file uploads, use multipart/form-data and attach image file to the correct field (see route code).

Troubleshooting
- Server won't start: check node version, check package.json scripts, inspect runtime errors for missing env vars or port collisions.
- 404 on /create-image: confirm route filename and registration in app (look for app.use or router mounts in app.js or server.js).
- AI errors: verify OPENAI_API_KEY and provider URL; look at service code for expected model names and request payloads.

Extending the project
- Add routes under /routes/ or simply in app.js, controllers in /controllers/ and services in /services/.
- Add tests under tests/ and wire them to package.json test script.

If anything in this README conflicts with the code, prefer the code. Open the following files to update docs with exact values:
- package.json
- server.js and app.js
- controllers/*
- services/*
