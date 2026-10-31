/**
 * run_ui_audit_capture.mjs
 * ---------------------------------------------------------------------------
 * Automated Visual Inspection & Screenshot Capture Script
 * Spawns Express server (port 5000), static SPA server for client/dist (port 3000),
 * and Puppeteer Chromium to capture rendered desktop & mobile screenshots.
 * ---------------------------------------------------------------------------
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve('../docs/screenshots/ui-audit');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForHttp(url, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url);
            if (res.ok || res.status < 500) return true;
        } catch {
            // Wait and retry
        }
        await sleep(300);
    }
    throw new Error(`Timed out waiting for ${url}`);
}

function createSpaServer(distDir, port = 3000) {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp'
    };

    const server = http.createServer((req, res) => {
        let relativePath = req.url.split('?')[0];
        let filePath = path.join(distDir, relativePath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            filePath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
    });

    return new Promise((resolve) => {
        server.listen(port, '0.0.0.0', () => {
            console.log(`   ✅ Static SPA server listening on http://localhost:${port}`);
            resolve(server);
        });
    });
}

(async () => {
    let serverProc = null;
    let spaServer = null;
    let browser = null;

    try {
        console.log("1. Starting Express backend server on port 5000...");
        serverProc = spawn('node', ['src/server.js'], {
            cwd: path.resolve('../server'),
            env: {
                ...process.env,
                PORT: '5000',
                NODE_ENV: 'development',
                CLIENT_URL: 'http://localhost:3000,http://127.0.0.1:3000'
            },
            stdio: 'pipe'
        });

        serverProc.stdout.on('data', d => {
            const msg = d.toString();
            if (msg.includes('Server running') || msg.includes('Connected to MongoDB')) {
                console.log(`   [Express] ${msg.trim()}`);
            }
        });
        serverProc.stderr.on('data', d => {
            const errStr = d.toString().trim();
            if (!errStr.includes('warning') && !errStr.includes('DEP')) {
                console.error(`   [Express] ${errStr}`);
            }
        });

        await waitForHttp('http://localhost:5000/api/v1/health');
        console.log("   ✅ Express backend is responsive at http://localhost:5000");

        console.log("2. Starting in-process static SPA server on port 3000...");
        const distDir = path.resolve('dist');
        spaServer = await createSpaServer(distDir, 3000);

        console.log("3. Launching Puppeteer Chromium...");
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // -------------------------------------------------------------------
        // Desktop Visual Capture (1280x800)
        // -------------------------------------------------------------------
        await page.setViewport({ width: 1280, height: 800 });
        console.log("\n4. Capturing Desktop Views (1280x800)...");

        // 4.1 Login Page
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_login.png') });
        console.log("   📸 01_desktop_login.png");

        // 4.2 Register Page (showing new optional fields)
        await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_register.png') });
        console.log("   📸 02_desktop_register.png");

        // 4.3 404 Not Found Page
        await page.goto('http://localhost:3000/unknown-section-route', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_404.png') });
        console.log("   📸 03_desktop_404.png");

        // 4.4 Register a dedicated test farmer for UI session
        const testTimestamp = Date.now();
        const testEmail = `ui_farmer_${testTimestamp}@example.com`;
        const testPassword = 'password123';
        const testName = 'Devinder Singh';

        console.log(`   Registering test farmer: ${testEmail}...`);
        await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0' });
        await page.type('input[placeholder="Enter your full name"]', testName);
        await page.type('input[placeholder="Enter your email"]', testEmail);
        await page.type('input[placeholder="Choose a strong password"]', testPassword);
        await page.type('input[placeholder="e.g. +91 9876543210"]', '+91 9876543210');
        await page.type('input[placeholder="e.g. Pune, Maharashtra"]', 'Ludhiana, Punjab');

        const registerSubmit = await page.$('button[type="submit"]');
        await registerSubmit.click();
        await sleep(1500);

        // Log in with test farmer
        console.log("   Logging in with test farmer...");
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        await page.type('input[placeholder="Enter your email"]', testEmail);
        await page.type('input[placeholder="Enter your password"]', testPassword);
        const loginSubmit = await page.$('button[type="submit"]');
        await loginSubmit.click();
        await page.waitForSelector('#desktop-logout-btn', { timeout: 10000 });
        console.log("   ✅ Test farmer logged in successfully!");

        // 4.5 Recommendation Page
        await page.goto('http://localhost:3000/recommendation', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_recommendation.png') });
        console.log("   📸 04_desktop_recommendation.png");

        // 4.6 Farms Page & Create a sample farm for UI inspection
        await page.goto('http://localhost:3000/farms', { waitUntil: 'networkidle0' });
        await page.waitForSelector('input[name="farmName"]', { timeout: 5000 });
        await page.type('input[name="farmName"]', 'Golden Wheat Fields');
        await page.type('input[name="area"]', '7.5');
        await page.type('input[name="nitrogen"]', '85');
        await page.type('input[name="phosphorus"]', '45');
        await page.type('input[name="potassium"]', '40');
        await page.type('input[name="pH"]', '6.8');
        await page.type('input[name="latitude"]', '30.9010');
        await page.type('input[name="longitude"]', '75.8573');

        const createFarmBtn = await page.$('#create-farm-btn');
        if (createFarmBtn) {
            await createFarmBtn.click();
            await sleep(1500);
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_farms.png') });
        console.log("   📸 05_desktop_farms.png");

        // 4.7 Crop History Page
        await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_desktop_crop_history.png') });
        console.log("   📸 06_desktop_crop_history.png");

        // 4.8 Market Page
        await page.goto('http://localhost:3000/market', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_desktop_market.png') });
        console.log("   📸 07_desktop_market.png");

        // 4.9 Soil Information Page (Verifying farm dropdown shows 'Golden Wheat Fields')
        await page.goto('http://localhost:3000/soil', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_desktop_soil.png') });
        console.log("   📸 08_desktop_soil.png");

        // 4.10 Disease Detection Page
        await page.goto('http://localhost:3000/disease', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_desktop_disease.png') });
        console.log("   📸 09_desktop_disease.png");

        // 4.11 User Profile Page (Read-Only)
        await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
        await sleep(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_desktop_profile_view.png') });
        console.log("   📸 10_desktop_profile_view.png");

        // 4.12 User Profile Page (Edit Mode)
        const editProfileBtn = await page.$('#edit-profile-btn');
        if (editProfileBtn) {
            await editProfileBtn.click();
            await sleep(500);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_desktop_profile_edit.png') });
            console.log("   📸 11_desktop_profile_edit.png");
        }

        // -------------------------------------------------------------------
        // Mobile Visual Capture (375x667)
        // -------------------------------------------------------------------
        console.log("\n5. Capturing Mobile Views (375x667)...");
        await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

        // 5.1 Mobile Recommendation
        await page.goto('http://localhost:3000/recommendation', { waitUntil: 'networkidle0' });
        await sleep(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_recommendation.png') });
        console.log("   📸 12_mobile_recommendation.png");

        // 5.2 Mobile Navigation Drawer Open
        const menuToggle = await page.$('#mobile-menu-toggle');
        if (menuToggle) {
            await menuToggle.click();
            await sleep(500);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_mobile_nav_drawer.png') });
            console.log("   📸 13_mobile_nav_drawer.png");
            // Close menu
            await menuToggle.click();
            await sleep(300);
        }

        // 5.3 Mobile Farms
        await page.goto('http://localhost:3000/farms', { waitUntil: 'networkidle0' });
        await sleep(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_mobile_farms.png') });
        console.log("   📸 14_mobile_farms.png");

        // 5.4 Mobile Soil
        await page.goto('http://localhost:3000/soil', { waitUntil: 'networkidle0' });
        await sleep(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_mobile_soil.png') });
        console.log("   📸 15_mobile_soil.png");

        // 5.5 Mobile Profile
        await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
        await sleep(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_mobile_profile.png') });
        console.log("   📸 16_mobile_profile.png");

        console.log("\n✅ All 16 visual audit screenshots captured successfully!");

    } catch (err) {
        console.error("❌ Visual capture failed:", err);
    } finally {
        if (browser) await browser.close();
        if (spaServer) {
            spaServer.close();
        }
        if (serverProc) {
            serverProc.kill();
        }
        console.log("Cleaned up all servers and processes.");
    }
})();
