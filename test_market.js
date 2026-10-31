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
        await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `User M ${ts}`, email: `userm${ts}@example.com`, password: "password123" })
        });

        let res = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `userm${ts}@example.com`, password: "password123" })
        });
        const token = (await res.json()).data.token;

        p("=== TEST 1: Unauthenticated request ===");
        res = await fetch("http://localhost:5000/api/v1/market?commodity=rice");
        p(`Status: ${res.status}`);

        p("=== TEST 2: Invalid limit ===");
        res = await fetch("http://localhost:5000/api/v1/market?limit=abc", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        p(`Status: ${res.status}`);
        p(await res.json());

        p("=== TEST 3: Market Source (Depends on API Key state) ===");
        res = await fetch("http://localhost:5000/api/v1/market?commodity=rice", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        p(`Status: ${res.status}`);
        p(await res.json());

    } catch (e) {
        console.error(e);
        output += e.toString();
    }
    fs.writeFileSync('test_market.txt', output);
}
runTests();
