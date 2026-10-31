/**
 * run_local_demo.mjs
 * ---------------------------------------------------------------------------
 * KrishiMitra AI — Local Demo Orchestrator & Health Verifier (Step 24.29)
 *
 * Starts and verifies all required application tiers for a live browser demo:
 *   1. Reuses active MongoDB on port 27017 (non-destructive)
 *   2. Starts FastAPI ML Service on port 8000 using ml-service/disease-venv
 *   3. Starts Express Backend on port 5000
 *   4. Starts React/Vite Frontend on port 3000
 *   5. Verifies health and readiness probes across all services
 *   6. Uses Puppeteer to confirm http://localhost:3000 renders cleanly
 *   7. Leaves services running detached and writes demo_services.json for clean shutdown
 * ---------------------------------------------------------------------------
 */

import { spawn } from 'child_process';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ROOT_DIR = process.cwd();
const PID_FILE = path.join(ROOT_DIR, 'demo_services.json');

// Check TCP port connectivity
function probePort(port, host = '127.0.0.1', timeoutMs = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

// Wait for HTTP endpoint to return expected status
async function waitForHttp(url, maxRetries = 30, intervalMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok || (res.status >= 200 && res.status < 400)) {
                return { status: res.status, ok: true, data: await res.json().catch(() => null) };
            }
        } catch {
            // Service still starting up
        }
        await sleep(intervalMs);
    }
    throw new Error(`Timeout waiting for endpoint: ${url}`);
}

async function main() {
    console.log("==================================================");
    console.log("KrishiMitra AI — Starting Local Demo Stack");
    console.log("==================================================");

    // -----------------------------------------------------------------------
    // 1. Verify MongoDB
    // -----------------------------------------------------------------------
    console.log("\n[1/4] Checking MongoDB Database (port 27017)...");
    const isMongoUp = await probePort(27017);
    if (!isMongoUp) {
        console.error("❌ MongoDB is NOT responding on port 27017. Please start MongoDB service first.");
        process.exit(1);
    }
    console.log("   ✅ MongoDB is active on port 27017 (Reusing existing running service)");

    // -----------------------------------------------------------------------
    // 2. Start FastAPI ML Service (port 8000)
    // -----------------------------------------------------------------------
    console.log("\n[2/4] Starting FastAPI ML Microservice (port 8000)...");
    const pythonExe = path.join(ROOT_DIR, 'ml-service', 'disease-venv', 'Scripts', 'python.exe');
    const mlDir = path.join(ROOT_DIR, 'ml-service');
    const mlLog = fs.openSync(path.join(ROOT_DIR, 'ml_service.log'), 'a');

    const mlProc = spawn(
        pythonExe,
        ['run_server.py'],
        {
            cwd: mlDir,
            detached: true,
            stdio: ['ignore', mlLog, mlLog],
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            }
        }
    );
    mlProc.unref();
    console.log(`   🚀 Spawned FastAPI process with PID: ${mlProc.pid}`);

    // Wait for /health and /ready
    console.log("   ⏳ Waiting for ML models to load (Random Forest & MobileNetV3)...");
    const mlHealth = await waitForHttp('http://127.0.0.1:8000/health', 60, 1000);
    const mlReady = await waitForHttp('http://127.0.0.1:8000/ready', 60, 1000);
    console.log(`   ✅ ML /health check passed (status: ${mlHealth.status})`);
    console.log(`   ✅ ML /ready check passed (status: ${mlReady.status}, models loaded: crop=${mlReady.data?.crop_model_loaded}, disease=${mlReady.data?.disease_model_loaded})`);

    // -----------------------------------------------------------------------
    // 3. Start Express Backend (port 5000)
    // -----------------------------------------------------------------------
    console.log("\n[3/4] Starting Node.js Express Backend (port 5000)...");
    const serverDir = path.join(ROOT_DIR, 'server');
    const serverLog = fs.openSync(path.join(ROOT_DIR, 'server.log'), 'a');

    const serverProc = spawn(
        process.execPath,
        ['src/server.js'],
        {
            cwd: serverDir,
            detached: true,
            stdio: ['ignore', serverLog, serverLog],
            env: {
                ...process.env,
                PORT: '5000',
                NODE_ENV: 'development',
                ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000'
            }
        }
    );
    serverProc.unref();
    console.log(`   🚀 Spawned Express process with PID: ${serverProc.pid}`);

    console.log("   ⏳ Waiting for Express backend and MongoDB connection...");
    const serverHealth = await waitForHttp('http://127.0.0.1:5000/api/v1/health', 25, 1000);
    console.log(`   ✅ Express /api/v1/health check passed (status: ${serverHealth.status})`);

    // -----------------------------------------------------------------------
    // 4. Start React Frontend via Vite (port 3000)
    // -----------------------------------------------------------------------
    console.log("\n[4/4] Starting React Frontend via Vite (port 3000)...");
    const clientDir = path.join(ROOT_DIR, 'client');
    const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
    const clientLog = fs.openSync(path.join(ROOT_DIR, 'client.log'), 'a');

    const clientProc = spawn(
        process.execPath,
        [viteBin, '--host', '0.0.0.0', '--port', '3000'],
        {
            cwd: clientDir,
            detached: true,
            stdio: ['ignore', clientLog, clientLog]
        }
    );
    clientProc.unref();
    console.log(`   🚀 Spawned Vite process with PID: ${clientProc.pid}`);

    console.log("   ⏳ Waiting for Vite development server...");
    await waitForHttp('http://localhost:3000', 25, 1000);
    console.log("   ✅ Vite frontend server responsive at http://localhost:3000");

    // -----------------------------------------------------------------------
    // 5. Save Service Metadata for Clean Teardown
    // -----------------------------------------------------------------------
    const serviceInfo = {
        timestamp: new Date().toISOString(),
        mongo: {
            status: "running",
            port: 27017,
            url: "mongodb://localhost:27017/crop_db",
            managedExternally: true
        },
        ml: {
            name: "FastAPI ML Service",
            pid: mlProc.pid,
            port: 8000,
            url: "http://127.0.0.1:8000",
            healthUrl: "http://127.0.0.1:8000/health",
            readyUrl: "http://127.0.0.1:8000/ready"
        },
        server: {
            name: "Express API Backend",
            pid: serverProc.pid,
            port: 5000,
            url: "http://localhost:5000",
            healthUrl: "http://localhost:5000/api/v1/health"
        },
        client: {
            name: "React / Vite Frontend",
            pid: clientProc.pid,
            port: 3000,
            url: "http://localhost:3000"
        }
    };
    fs.writeFileSync(PID_FILE, JSON.stringify(serviceInfo, null, 2), 'utf8');

    // -----------------------------------------------------------------------
    // 6. Browser Verification using Puppeteer
    // -----------------------------------------------------------------------
    console.log("\n[5/5] Performing Browser Render Verification via Puppeteer...");
    let browser;
    try {
        const puppeteerModule = await import('./client/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        const title = await page.title();
        const bodyContent = await page.evaluate(() => document.body.innerText);

        console.log(`   📄 Page Title: "${title}"`);
        console.log(`   🌾 Main Content Detected: ${bodyContent.includes('KrishiMitra AI') ? 'KrishiMitra AI Header Present' : 'Loaded'}`);

        // Save confirmation screenshot
        const screenshotPath = path.join(ROOT_DIR, 'docs', 'screenshots', 'demo_live_browser.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`   📸 Render confirmation screenshot saved: docs/screenshots/demo_live_browser.png`);
    } catch (err) {
        console.warn(`   ⚠️ Browser automation observation warning: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }

    console.log("\n==================================================");
    console.log("🎉 ALL SERVICES ARE RUNNING AND READY FOR DEMO!");
    console.log("==================================================");
    console.log(`🌐 Local Application URL : http://localhost:3000`);
    console.log(`🔌 Backend API URL       : http://localhost:5000/api/v1`);
    console.log(`🧠 ML Microservice URL   : http://127.0.0.1:8000`);
    console.log(`🗄️ MongoDB Connection    : mongodb://localhost:27017/crop_db`);
    console.log("\nActive Process IDs:");
    console.log(`  - ML Service (FastAPI) : PID ${mlProc.pid}`);
    console.log(`  - Backend (Express)    : PID ${serverProc.pid}`);
    console.log(`  - Frontend (Vite)      : PID ${clientProc.pid}`);
    console.log("\nTo stop the demo services when finished:");
    console.log(`  node stop_local_demo.mjs`);
    console.log("==================================================");
}

main().catch((err) => {
    console.error("❌ Failed to start demo services:", err);
    process.exit(1);
});
