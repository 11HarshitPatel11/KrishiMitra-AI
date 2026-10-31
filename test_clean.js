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
        p("=== Test 1: Register Farmer 1 ===");
        let res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User X ${ts}`, email: `userx${ts}@example.com`, password: "password123" })
        });
        p(res.status);
        p(await res.json());

        p("=== Test 2: Register same again (Duplicate) ===");
        res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User X ${ts}`, email: `userx${ts}@example.com`, password: "password123" })
        });
        p(res.status);
        p(await res.json());

        p("=== Test 3: Login Farmer 1 ===");
        res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `userx${ts}@example.com`, password: "password123" })
        });
        p(res.status);
        const loginDataA = await res.json();
        p(loginDataA);
        const tokenA = loginDataA.data?.token;

        if (!tokenA) { console.error("No token!"); return; }

        p("=== Test 4: Invalid login ===");
        res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `userx${ts}@example.com`, password: "wrong" })
        });
        p(res.status);
        p(await res.json());

        p("=== Test 5: Protected endpoint (Farms API) w/o token ===");
        res = await fetch("http://localhost:5000/api/v1/farms");
        p(res.status);
        p(await res.json());

        p("=== Test 6: Create Farm for User X ===");
        res = await fetch("http://localhost:5000/api/v1/farms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                farmName: "X's Farm", area: 10, areaUnit: "acre", nitrogen: 10, phosphorus: 10, potassium: 10, pH: 6.5
            })
        });
        p(res.status);
        p(await res.json());

        p("=== Test 7: Get User X Farms ===");
        res = await fetch("http://localhost:5000/api/v1/farms", {
            headers: { "Authorization": `Bearer ${tokenA}` }
        });
        p(res.status);
        const farmsAData = await res.json();
        p(farmsAData);
        const farmA_id = farmsAData.data[0]._id;

        p("=== Test 8: User Y Isolation ===");
        res = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User Y ${ts}`, email: `usery${ts}@example.com`, password: "password123" })
        });
        let resB = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `usery${ts}@example.com`, password: "password123" })
        });
        const loginDataB = await resB.json();
        const tokenB = loginDataB.data?.token;

        res = await fetch(`http://localhost:5000/api/v1/farms/${farmA_id}`, {
            headers: { "Authorization": `Bearer ${tokenB}` }
        });
        p(res.status);
        p(await res.json());

    } catch (e) {
        console.error(e);
        output += e.toString();
    }
    fs.writeFileSync('test_output_new.txt', output);
}
runTests();
