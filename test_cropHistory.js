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
        // A. Authenticated User A
        p("=== User A Registration ===");
        await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User A ${ts}`, email: `usera${ts}@example.com`, password: "password123" })
        });

        let res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `usera${ts}@example.com`, password: "password123" })
        });
        const tokenA = (await res.json()).data.token;

        // User B Registration
        p("=== User B Registration ===");
        await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User B ${ts}`, email: `userb${ts}@example.com`, password: "password123" })
        });
        res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `userb${ts}@example.com`, password: "password123" })
        });
        const tokenB = (await res.json()).data.token;

        // Create Farm A 
        p("=== Create Farm A ===");
        res = await fetch("http://localhost:5000/api/v1/farms", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmName: "A Farm", area: 10, areaUnit: "acre", nitrogen: 10, phosphorus: 10, potassium: 10, pH: 6.5 })
        });
        const farmA_id = (await res.json()).data._id;

        // A - Authenticated Create Crop History
        p("=== Test A: Authenticated Create Crop History ===");
        res = await fetch("http://localhost:5000/api/v1/crop-history", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, crop: "Wheat", season: "Rabi", year: 2024, notes: "Good yield" })
        });
        p(res.status);
        const historyData = await res.json();
        p(historyData);
        const historyA_id = historyData.data._id;

        // D - Get history for another user's farm
        p("=== Test D: Test isolation (User B accessing User A Farm History) ===");
        res = await fetch(`http://localhost:5000/api/v1/crop-history/farm/${farmA_id}`, {
            headers: { "Authorization": `Bearer ${tokenB}` }
        });
        p(res.status);
        p(await res.json());

        // B - Get all history (User A)
        p("=== Test B: Get all history ===");
        res = await fetch("http://localhost:5000/api/v1/crop-history", {
            headers: { "Authorization": `Bearer ${tokenA}` }
        });
        p(res.status);
        p(await res.json());

        // E - Update own history
        p("=== Test E: Update own history ===");
        res = await fetch(`http://localhost:5000/api/v1/crop-history/${historyA_id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ notes: "Updated" })
        });
        p(res.status);
        p(await res.json());

        // Validation - Missing crop
        p("=== Test: Missing crop ===");
        res = await fetch("http://localhost:5000/api/v1/crop-history", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
            body: JSON.stringify({ farmId: farmA_id, season: "Rabi", year: 2024 })
        });
        p(res.status);
        p(await res.json());

        // F - Delete own history
        p("=== Test F: Delete own history ===");
        res = await fetch(`http://localhost:5000/api/v1/crop-history/${historyA_id}`, {
            method: "DELETE", headers: { "Authorization": `Bearer ${tokenA}` }
        });
        p(res.status);
        p(await res.json());

    } catch (e) {
        console.error(e);
        output += e.toString();
    }
    fs.writeFileSync('test_history.txt', output);
}
runTests();
