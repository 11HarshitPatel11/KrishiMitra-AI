import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
    let browser;
    try {
        console.log("Starting Puppeteer test...");
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // 1. Go to React App
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        console.log("App loaded.");

        // Wait for login or register
        const titleText = await page.$eval('h1', el => el.textContent).catch(() => '');
        console.log("Page Header: " + titleText);

        const isLoginPage = await page.$eval('h2', el => el.textContent).catch(() => '');
        if (isLoginPage.includes('Login')) {
            console.log("On Login page, registering/logging in...");

            // Switch to register?
            const switchBtn = await page.$('button.text-green-600');
            if (switchBtn) await switchBtn.click();
            await page.waitForTimeout(500);

            // Fill register
            await page.type('input[placeholder="Full Name"]', 'Farmer Bob');
            await page.type('input[placeholder="Email address"]', `farmer_${Date.now()}@example.com`);
            await page.type('input[placeholder="Password"]', 'password123');
            await page.type('input[placeholder="Farm Size (Acres)"]', '10');
            await page.type('input[placeholder="Primary Crop"]', 'Wheat');

            const submitRegister = await page.$('button[type="submit"]');
            await submitRegister.click();
            await page.waitForTimeout(1000); // Wait for switch to login

            // Fill login
            await page.type('input[placeholder="Email address"]', `farmer_${Date.now()}@example.com`); // Wait, I need the exact email!

            console.log("Wait, let's just use axios to register an account and then login via UI to be simpler.");
        }
    } catch (err) {
        console.error("Test failed: ", err);
    } finally {
        if (browser) await browser.close();
    }
})();
