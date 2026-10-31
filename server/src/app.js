import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import farmRoutes from './routes/farm.routes.js';
import cropHistoryRoutes from './routes/cropHistory.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import marketRoutes from './routes/market.routes.js';
import diseaseRoutes from './routes/disease.routes.js';
import diseaseInfoRoutes from './routes/diseaseInformation.routes.js';
import soilRoutes from './routes/soilInformation.routes.js';
import soilGridsRoutes from './routes/soilGrids.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ---------------------------------------------------------------------------
// Reverse Proxy Trust Configuration (Step 24.24 / BLK-02)
// ---------------------------------------------------------------------------
// Configures Express `trust proxy` setting to allow accurate client IP resolution
// (req.ip) when running behind a reverse proxy (e.g. Nginx, AWS ALB, Render).
//
// Topology Guidelines:
//   - TRUST_PROXY=1 (Recommended for single reverse proxy hop: Nginx, ALB, Cloudflare)
//   - TRUST_PROXY=loopback (For local Nginx running on 127.0.0.1 / ::1)
//   - TRUST_PROXY=false or unset (Direct client connection without reverse proxy)
//
// Security Rule: Avoid unrestricted blind trust ('true') to prevent client IP spoofing.
// ---------------------------------------------------------------------------
if (process.env.TRUST_PROXY) {
    const tp = process.env.TRUST_PROXY.trim();
    if (tp === 'true') {
        // Logged warning in env validator; configure with caution
        app.set('trust proxy', true);
    } else if (tp === 'false' || tp === '0') {
        app.set('trust proxy', false);
    } else if (/^\d+$/.test(tp)) {
        app.set('trust proxy', parseInt(tp, 10));
    } else {
        app.set('trust proxy', tp);
    }
} else {
    // Default: disabled unless explicitly configured in environment
    app.set('trust proxy', false);
}

// ---------------------------------------------------------------------------
// CORS — explicit origin allowlist
// ---------------------------------------------------------------------------
// Read comma-separated origins from the environment, e.g.:
//   ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com
//
// Requests with no Origin header (curl, Postman, server-to-server) are allowed
// through without a CORS response — browsers always send an Origin header for
// cross-origin requests so this does not bypass browser CORS enforcement.
// ---------------------------------------------------------------------------
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (requestOrigin, callback) => {
        // No Origin header → allow (non-browser / same-origin)
        if (!requestOrigin) return callback(null, true);
        if (allowedOrigins.includes(requestOrigin)) {
            return callback(null, true);
        }
        // Log denied origins in development to make misconfiguration obvious
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[CORS] Blocked origin: ${requestOrigin}`);
        }
        return callback(new Error(`Origin ${requestOrigin} is not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // credentials: false — JWT is sent via Authorization header, not cookies.
    // Enabling credentials unnecessarily would widen the attack surface.
    credentials: false,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Backend is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farms', farmRoutes);
app.use('/api/v1/crop-history', cropHistoryRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/disease', diseaseRoutes);
app.use('/api/v1/disease-information', diseaseInfoRoutes);
app.use('/api/v1/soil-information', soilGridsRoutes); // Must be before soilRoutes or they merge cleanly
app.use('/api/v1/soil-information', soilRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

export default app;
