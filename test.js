const fs = require('fs');

const runTests = async () => {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg;
        output += '\n';
    };

    try {
        log("=== Test 1: Register Farmer 1 ===");
        let res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "User E", email: "usere@example.com", password: "password123" })
        });
        log(res.status);
        log(await res.json());

        log("=== Test 2: Register same again (Duplicate) ===");
        res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "User E", email: "usere@example.com", password: "password123" })
        });
        log(res.status);
        log(await res.json());

        log("=== Test 3: Login Farmer 1 ===");
        res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "usere@example.com", password: "password123" })
        });
        log(res.status);
        const loginDataA = await res.json();
        log(loginDataA);
        const tokenA = loginDataA.data?.token;

        if (!tokenA) { console.error("No token!"); return; }

        log("=== Test 4: Invalid login ===");
        res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "usere@example.com", password: "wrong" })
        });
        log(res.status);
        log(await res.json());

        log("=== Test 5: Protected endpoint (Farms API) w/o token ===");
        res = await fetch("http://localhost:5000/api/v1/farms");
        log(res.status);
        log(await res.json());

        log("=== Test 6: Create Farm for User E ===");
        res = await fetch("http://localhost:5000/api/v1/farms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                farmName: "C's Farm", area: 10, areaUnit: "acre", nitrogen: 10, phosphorus: 10, potassium: 10, pH: 6.5
            })
        });
        log(res.status);
        log(await res.json());

        log("=== Test 7: Get User E Farms ===");
        res = await fetch("http://localhost:5000/api/v1/farms", {
            headers: { "Authorization": `Bearer ${tokenA}` }
        });
        log(res.status);
        const farmsAData = await res.json();
        log(farmsAData);
        const farmA_id = farmsAData.data[0]._id;

        log("=== Test 8: User F Isolation ===");
        res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "User F", email: "userf@example.com", password: "password123" })
        });
        let resB = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "userf@example.com", password: "password123" })
        });
        const loginDataB = await resB.json();
        const tokenB = loginDataB.data?.token;

        res = await fetch(`http://localhost:5000/api/v1/farms/${farmA_id}`, {
            headers: { "Authorization": `Bearer ${tokenB}` }
        });
        log(res.status);
        log(await res.json());

    } catch (e) {
        console.error(e);
        output += e.toString();
    }
    fs.writeFileSync('test_output2.txt', output);
}
runTests();
