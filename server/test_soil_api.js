import axios from 'axios';
import mongoose from 'mongoose';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
let tokenA, tokenB, farmA_id, farmB_id, soilA_id;

async function setup() {
    const emailA = `usera_${Date.now()}@example.com`;
    const emailB = `userb_${Date.now()}@example.com`;

    const resA = await axios.post(`${BASE_URL}/auth/register`, { name: 'User A', email: emailA, password: 'password', farmSize: 5, primaryCrop: 'Wheat' });
    const resB = await axios.post(`${BASE_URL}/auth/register`, { name: 'User B', email: emailB, password: 'password', farmSize: 5, primaryCrop: 'Oats' });

    tokenA = (await axios.post(`${BASE_URL}/auth/login`, { email: emailA, password: 'password' })).data.data.token;
    tokenB = (await axios.post(`${BASE_URL}/auth/login`, { email: emailB, password: 'password' })).data.data.token;

    const farmARes = await axios.post(`${BASE_URL}/farms`, {
        farmName: 'Farm A', area: 10, areaUnit: 'acre', nitrogen: 10, phosphorus: 10, potassium: 10, pH: 6.5
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    farmA_id = farmARes.data.data._id;

    const farmBRes = await axios.post(`${BASE_URL}/farms`, {
        farmName: 'Farm B', area: 5, areaUnit: 'hectare', nitrogen: 20, phosphorus: 20, potassium: 20, pH: 7.0
    }, { headers: { Authorization: `Bearer ${tokenB}` } });
    farmB_id = farmBRes.data.data._id;
}

async function runTests() {
    await setup();
    console.log("Setup complete. Tokens and farms initialized.");

    // 1. Unauth request rejected
    try {
        await axios.post(`${BASE_URL}/soil-information`, { farmId: farmA_id, pH: 6.5 });
        throw new Error("Should have failed unauth");
    } catch (err) { if (err.response.status !== 401) throw new Error("Expected 401"); }
    console.log("✅ Unauthenticated request rejected");

    // 2. Invalid pH rejected (negative)
    try {
        await axios.post(`${BASE_URL}/soil-information`, { farmId: farmA_id, pH: -1 }, { headers: { Authorization: `Bearer ${tokenA}` } });
        throw new Error("Should have failed validation");
    } catch (err) { if (err.response.status !== 400 || !err.response.data.errors) throw new Error("Expected 400 validation error"); }
    console.log("✅ Invalid pH rejected");

    // Negative N rejected
    try {
        await axios.post(`${BASE_URL}/soil-information`, { farmId: farmA_id, nitrogen: -5 }, { headers: { Authorization: `Bearer ${tokenA}` } });
        throw new Error("Should have failed validation");
    } catch (err) { if (err.response.status !== 400 || !err.response.data.errors) throw new Error("Expected 400 validation error"); }
    console.log("✅ Negative N rejected");

    // 3. User A cannot create soil for User B's farm
    try {
        await axios.post(`${BASE_URL}/soil-information`, { farmId: farmB_id, pH: 7 }, { headers: { Authorization: `Bearer ${tokenA}` } });
        throw new Error("Should have failed IDOR");
    } catch (err) { if (err.response.status !== 404) throw new Error("Expected 404 not found/unauthorized"); }
    console.log("✅ IDOR: User A cannot create soil for User B's farm");

    // 4. Create successful soil info
    const createRes = await axios.post(`${BASE_URL}/soil-information`, {
        farmId: farmA_id,
        soilType: 'Loamy',
        pH: 6.8,
        nitrogen: 10.5,
        phosphorus: 5,
        potassium: 3,
        moisture: 20
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    soilA_id = createRes.data.data._id;
    if (createRes.data.data.source !== 'manual') throw new Error("Source should be manual");
    console.log("✅ Soil info created successfully. Source is manual.");

    // 5. User A cannot access User B's soil record
    try {
        await axios.get(`${BASE_URL}/soil-information/${soilA_id}`, { headers: { Authorization: `Bearer ${tokenB}` } });
        throw new Error("Should have failed IDOR");
    } catch (err) { if (err.response.status !== 404) throw new Error("Expected 404 not found/unauthorized for B checking A's record"); }
    console.log("✅ IDOR: User B cannot access User A's record");

    // 6. Duplicate soil record gracefully rejected (400)
    try {
        await axios.post(`${BASE_URL}/soil-information`, {
            farmId: farmA_id,
            soilType: 'Sandy'
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        throw new Error("Should have rejected duplicate");
    } catch (err) { if (err.response.status !== 400) throw new Error(`Expected 400 for duplicate, got ${err.response.status}`); }
    console.log("✅ Duplicate current soil record rejected");

    // 7. Update successful
    const patchRes = await axios.patch(`${BASE_URL}/soil-information/${soilA_id}`, {
        soilType: 'Clay'
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    if (patchRes.data.data.soilType !== 'Clay') throw new Error("Patch failed");
    // Assert source override (throws 400 in our service instead)
    console.log("Wait, we throw 400 on explicit manual rewrite to external! Testing...");

    try {
        await axios.patch(`${BASE_URL}/soil-information/${soilA_id}`, {
            source: 'external'
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        throw new Error("Should have rejected external rewrite");
    } catch (err) { if (err.response?.status !== 400) throw new Error("Expected 400 on rewriting to external"); }
    console.log("✅ Update enforced manual source limits gracefully");

    // 8. Delete
    await axios.delete(`${BASE_URL}/soil-information/${soilA_id}`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log("✅ Delete successful");

    console.log("ALL SOIL ENDPOINT TESTS PASSED 🎉");
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
