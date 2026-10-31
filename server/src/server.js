import 'dotenv/config';
import dotenv from 'dotenv';
if (process.env.DOTENV_CONFIG_PATH) {
    dotenv.config({ path: process.env.DOTENV_CONFIG_PATH });
}

import { validateStartupEnv } from './config/env.js';

// Fail-fast environment validation before connecting to database or starting server
validateStartupEnv();

import app from './app.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;
let server = null;
let isShuttingDown = false;

/**
 * Handles graceful connection draining and resource cleanup on process termination signals.
 * (Step 24.24 / BLK-09)
 *
 * @param {string} signal - Signal name (e.g. 'SIGTERM', 'SIGINT')
 */
export const gracefulShutdown = async (signal = 'SIGTERM') => {
    if (isShuttingDown) {
        console.warn(`[Shutdown] Already shutting down. Ignoring duplicate ${signal}.`);
        return;
    }
    isShuttingDown = true;
    console.log(`[Shutdown] Received ${signal}. Draining connections and shutting down gracefully...`);

    // Force exit if connections take longer than 10 seconds to drain
    const forceExitTimer = setTimeout(() => {
        console.error('[Shutdown] Forced shutdown timed out after 10s. Forcing exit.');
        process.exit(1);
    }, 10000);
    if (forceExitTimer.unref) {
        forceExitTimer.unref();
    }

    try {
        if (server && server.listening) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) return reject(err);
                    console.log('[Shutdown] HTTP server closed cleanly.');
                    resolve();
                });
            });
        }

        if (mongoose.connection && mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('[Shutdown] MongoDB connection closed cleanly.');
        }

        clearTimeout(forceExitTimer);
        console.log('[Shutdown] Graceful shutdown completed.');
        process.exit(0);
    } catch (err) {
        console.error('[Shutdown] Error during graceful shutdown:', err);
        clearTimeout(forceExitTimer);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Database');
    } catch (error) {
        console.error('Warning: Error connecting to MongoDB. Database dependent routes will fail:', error.message);
    }

    server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    return server;
};

// Start server unless imported by a test harness
if (process.env.NODE_ENV !== 'test_runner') {
    startServer();
}

export { app, startServer };
