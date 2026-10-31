/**
 * stop_local_demo.mjs
 * ---------------------------------------------------------------------------
 * KrishiMitra AI — Local Demo Teardown Script (Step 24.29)
 *
 * Reads demo_services.json and cleanly terminates only the processes
 * started for the demo session (ML, Express, Vite).
 * Leaves MongoDB and unrelated system processes untouched.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PID_FILE = path.join(process.cwd(), 'demo_services.json');

if (!fs.existsSync(PID_FILE)) {
    console.log("No active demo session found (demo_services.json does not exist).");
    process.exit(0);
}

try {
    const info = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    console.log("Stopping KrishiMitra AI demo services...");

    const targets = [
        { name: "Frontend (Vite)", pid: info.client?.pid },
        { name: "Backend (Express)", pid: info.server?.pid },
        { name: "ML Service (FastAPI)", pid: info.ml?.pid }
    ];

    for (const t of targets) {
        if (t.pid) {
            try {
                // Windows taskkill /F /T /PID terminates the process tree
                execSync(`taskkill /F /T /PID ${t.pid}`, { stdio: 'ignore' });
                console.log(`   🛑 Stopped ${t.name} (PID: ${t.pid})`);
            } catch (err) {
                console.log(`   ℹ️ Process ${t.name} (PID: ${t.pid}) was already stopped.`);
            }
        }
    }

    fs.unlinkSync(PID_FILE);
    console.log("✅ All demo services stopped cleanly. MongoDB remains untouched.");
} catch (err) {
    console.error("Error stopping services:", err.message);
    process.exit(1);
}
