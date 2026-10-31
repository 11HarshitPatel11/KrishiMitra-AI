const fs = require('fs');

const runTests = async () => {
    let output = "";
    const p = (msg) => {
        console.log(msg);
        output += typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg;
        output += '\n';
    };

    try {
        const ts = Date.now();
        // A. Register & Login User
        await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User A ${ts}`, email: `usera${ts}@example.com`, password: "password123" })
        });

        let res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `usera${ts}@example.com`, password: "password123" })
        });
        const tokenA = (await res.json()).data.token;

        // B. Create Farm
        res = await fetch("http://localhost:5000/api/v1/farms", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmName: "A Farm", area: 10, areaUnit: "acre", nitrogen: 90, phosphorus: 42, potassium: 43, pH: 6.5 })
        });
        const farmA_id = (await res.json()).data._id;

        // TEST 1: NO CROP HISTORY
        p("=== TEST 1: Recommendation WITHOUT Crop History ===");
        res = await fetch("http://localhost:5000/api/v1/recommendations/predict", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.87, humidity: 82, pH: 6.5, rainfall: 202.93 })
        });
        const rec1 = await res.json();
        p(rec1);
        p(`History Used: ${rec1.data?.historyUsed}`);
        p(rec1.data?.recommendations);

        const topCrop = rec1.data?.recommendations[0]?.crop;

        // C. Create Crop History matching the Top crop (Same Annual)
        p(`=== Assigning ${topCrop} to history ===`);
        await fetch("http://localhost:5000/api/v1/crop-history", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, crop: topCrop, season: "Kharif", year: 2023 })
        });

        // TEST 2: SAME ANNUAL CROP HISTORY
        p("=== TEST 2: Recommendation WITH SAME Crop History (Annual Penalty) ===");
        res = await fetch("http://localhost:5000/api/v1/recommendations/predict", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.87, humidity: 82, pH: 6.5, rainfall: 202.93 })
        });
        const rec2 = await res.json();
        p(`History Used: ${rec2.data?.historyUsed}`);
        p(rec2.data?.recommendations);

        // TEST 3: Test generic fallback if crop doesn't match
        p("=== Assigning 'mango' (perennial) to history ===");
        await fetch("http://localhost:5000/api/v1/crop-history", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, crop: "mango", season: "Kharif", year: 2024 })
        });

        p("=== TEST 4: Recommendation WITH Mango History (Perennial Neutral) ===");
        res = await fetch("http://localhost:5000/api/v1/recommendations/predict", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.87, humidity: 82, pH: 6.5, rainfall: 202.93 })
        });
        const rec3 = await res.json();
        p(`History Used: ${rec3.data?.historyUsed}`);
        p(rec3.data?.recommendations);

    } catch (e) {
        console.error(e);
        output += e.toString();
    }
    fs.writeFileSync('test_history_recommendation.txt', output);
}
runTests();
