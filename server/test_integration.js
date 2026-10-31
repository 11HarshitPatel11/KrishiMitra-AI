
async function runTests() {
    console.log("==================================================");
    console.log("Testing Node.js -> FastAPI End-to-End Integration");
    console.log("==================================================\n");

    const BASE_URL = 'http://localhost:5000/api/v1';

    const validPayload = {
        nitrogen: 90,
        phosphorus: 42,
        potassium: 43,
        temperature: 20.8,
        humidity: 82,
        pH: 6.5,
        rainfall: 203
    };

    // 1. Valid prediction
    console.log("1. Testing valid POST /recommendations/predict");
    try {
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) {
        console.error(e);
    }

    // 2. Missing nitrogen
    console.log("2. Testing invalid: Missing Nitrogen");
    try {
        const inv1 = { ...validPayload };
        delete inv1.nitrogen;
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(inv1),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) { }

    // 3. Negative nitrogen
    console.log("3. Testing invalid: Negative Nitrogen");
    try {
        const inv2 = { ...validPayload, nitrogen: -10 };
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(inv2),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) { }

    // 4. pH > 14
    console.log("4. Testing invalid: pH > 14");
    try {
        const inv3 = { ...validPayload, pH: 15.2 };
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(inv3),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) { }

    // 5. Invalid string string type
    console.log("5. Testing invalid: String instead of numeric");
    try {
        const inv4 = { ...validPayload, temperature: 'hot' };
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(inv4),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) { }

    // 6. Null value
    console.log("6. Testing invalid: Null value");
    try {
        const inv5 = { ...validPayload, humidity: null };
        const res = await fetch(`${BASE_URL}/recommendations/predict`, {
            method: 'POST',
            body: JSON.stringify(inv5),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Response: ${JSON.stringify(data)}\n`);
    } catch (e) { }

    console.log("[SUCCESS] Node.js validation test complete.");
}

runTests();
