# Step 24.1 — CORS Hardening

## 1. Problem

`server/src/app.js` previously called `app.use(cors())` with no arguments.  
The `cors` npm package defaults to `Access-Control-Allow-Origin: *`, which:

- Grants any website permission to read API responses from a user's browser session.
- Cannot be combined with credentialed requests and signals a lack of intentional configuration.

## 2. What changed

### `server/src/app.js`

Replaced:
```js
app.use(cors());
```

With an explicit origin allowlist driven by the `ALLOWED_ORIGINS` environment variable:

```js
const corsOptions = {
    origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);      // non-browser callers
        if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
        return callback(new Error(`Origin ${requestOrigin} is not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
```

Key decisions:

| Decision | Reason |
|---|---|
| `credentials: false` | Auth uses JWT via `Authorization: Bearer` header. Cookies are not used. Enabling `credentials: true` without a specific need widens the attack surface. |
| No Origin → allowed | CORS is a browser mechanism. Curl/Postman/server-to-server calls never send an `Origin` header; blocking them here provides no security benefit because they are not subject to browser SOP. Authorization/authentication for those callers is enforced by the existing JWT middleware. |
| `allowedHeaders` is explicit | Prevents clients from sending arbitrary custom headers the server does not expect. |

### `server/.env` and `server/.env.example`

Added:
```env
ALLOWED_ORIGINS=http://localhost:3000
```

The `.env.example` also documents multi-origin and production usage patterns.

## 3. Allowed-Origin Configuration

### Local development

The React Vite dev server is configured in `client/vite.config.js` to bind on port **3000**.  
The backend runs on port **5000** (set via `PORT` in `.env`).

Set in `server/.env`:
```
ALLOWED_ORIGINS=http://localhost:3000
```

### Production

Set `ALLOWED_ORIGINS` in your hosting environment (Render, Railway, Fly.io, etc.) to your
deployed frontend URL — for example:

```
ALLOWED_ORIGINS=https://krishimitra.example.com
```

Multiple origins (e.g., a staging URL and production URL) are comma-separated:
```
ALLOWED_ORIGINS=https://krishimitra.example.com,https://staging.krishimitra.example.com
```

**Do not** set `ALLOWED_ORIGINS=*` in production.

## 4. Tests Performed

| Test | Method | Result |
|---|---|---|
| Allowed origin (`http://localhost:3000`) receives `Access-Control-Allow-Origin` | Simulated via curl with `-H "Origin: http://localhost:3000"` | ✅ PASS |
| Blocked origin (`http://evil.example.com`) does NOT receive ACL header | curl with blocked Origin | ✅ PASS — header absent, body contains CORS error |
| Preflight OPTIONS to allowed origin returns `204` | `curl -X OPTIONS` with matching Origin + Access-Control-Request-Method | ✅ PASS |
| No Origin header (Postman / curl without Origin) passes through | curl without Origin | ✅ PASS |
| `/api/v1/health` still returns `{ status: 'success' }` | GET | ✅ PASS |
| Auth login/register still works | POST `/api/v1/auth/login` | ✅ PASS |
| Crop recommendation still works | POST `/api/v1/recommendations` with Bearer token | ✅ PASS |
| Disease image upload still works | POST `/api/v1/disease/predict` with Bearer token | ✅ PASS |
| Existing crop RF artifacts untouched | File presence check | ✅ PASS |

## 5. Behavior Comparison

| Behaviour | Before | After |
|---|---|---|
| Allowed browser origin | ✅ | ✅ |
| Blocked browser origin | ✅ (unintentionally — `*` allowed everything) | ❌ (correctly blocked) |
| `Access-Control-Allow-Origin` value | `*` | Exact allowed origin reflected |
| Credentials support | N/A (`*` forbids credentials) | Not needed — JWT in header |
| Non-browser callers | ✅ | ✅ |

## 6. Remaining Limitations / Deployment Notes

- `ALLOWED_ORIGINS` must be set before starting the server in production. If it is missing, the code falls back to `http://localhost:3000` — safe for local development, incorrect for production.
- CORS is a browser-enforced mechanism. It does not replace authentication. Sensitive endpoints remain protected by the existing JWT `protect` middleware regardless of CORS.
- If the frontend is served from the same origin as the API (e.g., static files served by Express), CORS headers are irrelevant for same-origin requests.
- PlantDoc / real-world disease inference and SoilGrids integrations are server-to-server — unaffected by CORS.
