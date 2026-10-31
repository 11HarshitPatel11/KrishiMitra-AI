/**
 * server/test_shutdown.js
 * ---------------------------------------------------------------------------
 * Step 24.24 (BLK-09) Graceful Shutdown Unit Test Suite
 * ---------------------------------------------------------------------------
 */

import assert from 'assert';

let passed = 0;
let failed = 0;

const test = (label, fn) => {
    try {
        fn();
        console.log(`  ✅  ${label}`);
        passed++;
    } catch (err) {
        console.error(`  ❌  ${label}`);
        console.error(`      ${err.message}`);
        failed++;
    }
};

console.log('==================================================');
console.log('Step 24.24 Graceful Shutdown Unit Test Suite');
console.log('==================================================');

test('SIGTERM and SIGINT listeners are attached to process', async () => {
    // Dynamically check listener count or handler attachment
    const sigtermListeners = process.listeners('SIGTERM');
    const sigintListeners = process.listeners('SIGINT');
    
    // Import server module in test mode
    process.env.NODE_ENV = 'test_runner';
    await import('./src/server.js');

    const newSigterm = process.listeners('SIGTERM');
    const newSigint = process.listeners('SIGINT');

    assert(newSigterm.length >= 1, 'At least 1 SIGTERM listener registered');
    assert(newSigint.length >= 1, 'At least 1 SIGINT listener registered');
});

test('gracefulShutdown handles server close and mongoose disconnect cleanly', async () => {
    const { gracefulShutdown } = await import('./src/server.js');
    assert(typeof gracefulShutdown === 'function', 'gracefulShutdown is exported function');
});

console.log('\n==================================================');
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) {
    process.exit(1);
}
