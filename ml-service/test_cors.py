"""
test_cors.py
---------------------------------------------------------------------------
Automated Verification Suite for Step 24.10 (GAP-14):
FastAPI CORS Hardening & Environment Configuration

Mode: Synchronous Middleware & Origin Parser Verification Suite
- Tests production parsing helper (app/cors_config.py).
- Tests actual Starlette/FastAPI CORSMiddleware class methods directly.
- Completely isolated: Zero heavy ML model weights or PyTorch loading.
- Fast execution: Runs synchronously in <1 second without loopback TCP sockets.
- Clearly distinguished from live deployment-level network testing.

Verifies:
  1. Elimination of wildcard CORS in app/main.py.
  2. Disabling of credentials (allow_credentials=False).
  3. Restriction of HTTP methods to GET, POST, OPTIONS.
  4. Restriction of HTTP headers to Content-Type, Authorization, Accept.
  5. Precedence of ML_ALLOWED_ORIGINS over ALLOWED_ORIGINS.
  6. Safe rejection of wildcard '*' in origin lists.
  7. Empty and whitespace-only environment value handling.
  8. Trimming and normalization of trailing slashes.
  9. Production default policy (empty list [] for strict server-to-server isolation).
  10. Development default policy (http://localhost:3000, http://127.0.0.1:3000).
  11. Allowed origin matching and Access-Control-Allow-Origin generation.
  12. Unlisted origin rejection without CORS permission.
  13. OPTIONS preflight behavior for allowed methods and headers.
  14. Rejection of disallowed preflight methods (e.g. DELETE).
  15. Server-to-server calls without Origin header pass unimpeded.
---------------------------------------------------------------------------
"""

import os
import sys

# Ensure ml-service root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.cors_config import (
    get_allowed_origins,
    DEFAULT_DEV_ORIGINS,
    ALLOWED_METHODS,
    ALLOWED_HEADERS,
)
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import Headers, MutableHeaders

passed = 0
failed = 0

def assert_test(condition, label, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}{f' ({detail})' if detail else ''}")
        failed += 1

print("==================================================")
print("Step 24.10 FastAPI CORS Hardening Test Suite")
print("==================================================")
print("Mode: Synchronous In-Process Verification (Zero Sockets / Zero ML Lifespan Overhead)\n")

# ---------------------------------------------------------------------------
# 1. Source Code Inspection of app/main.py
# ---------------------------------------------------------------------------
print("1. Source Code Inspection of app/main.py")

main_path = os.path.join(os.path.dirname(__file__), "app", "main.py")
with open(main_path, "r", encoding="utf-8") as f:
    main_code = f.read()

assert_test(
    'allow_origins=["*"]' not in main_code and "allow_origins=['*']" not in main_code,
    "Wildcard allow_origins=['*'] is completely absent from app/main.py"
)

assert_test(
    "allow_credentials=True" not in main_code,
    "Insecure allow_credentials=True is completely absent from app/main.py"
)

assert_test(
    "allow_credentials=False" in main_code,
    "allow_credentials=False is explicitly configured"
)

assert_test(
    "get_allowed_origins" in main_code,
    "app/main.py imports and uses get_allowed_origins from app.cors_config"
)

assert_test(
    "ALLOWED_METHODS" in main_code,
    "app/main.py uses ALLOWED_METHODS constant"
)

assert_test(
    "ALLOWED_HEADERS" in main_code,
    "app/main.py uses ALLOWED_HEADERS constant"
)

# ---------------------------------------------------------------------------
# 2. Origin Parsing & Environment Precedence Logic (app/cors_config.py)
# ---------------------------------------------------------------------------
print("\n2. Origin Parsing & Environment Precedence Logic")

# 2.1 Default development policy
dev_defaults = get_allowed_origins(raw_origins=None, env="development")
assert_test(
    dev_defaults == ["http://localhost:3000", "http://127.0.0.1:3000"],
    "Development mode with no env var defaults to local Vite dev origins"
)

# 2.2 Default production policy (strict server-to-server isolation)
prod_defaults = get_allowed_origins(raw_origins=None, env="production")
assert_test(
    prod_defaults == [],
    "Production mode with no env var defaults to empty list [] (zero browser access by default)"
)

# 2.3 Single explicit origin
single = get_allowed_origins(raw_origins="https://krishimitra.example.com", env="production")
assert_test(
    single == ["https://krishimitra.example.com"],
    "Explicit single origin parsed correctly"
)

# 2.4 Multiple comma-separated origins with whitespace
multi = get_allowed_origins(
    raw_origins="  https://krishimitra.example.com , https://admin.example.com  ",
    env="production"
)
assert_test(
    multi == ["https://krishimitra.example.com", "https://admin.example.com"],
    "Multiple comma-separated origins parsed with whitespace trimmed"
)

# 2.5 Normalization: Trailing slashes stripped
slashes = get_allowed_origins(
    raw_origins="http://localhost:3000/, https://krishimitra.example.com/",
    env="development"
)
assert_test(
    slashes == ["http://localhost:3000", "https://krishimitra.example.com"],
    "Trailing slashes normalized (browser Origin headers never include trailing slashes)"
)

# 2.6 Wildcard rejection: Standalone wildcard '*'
wildcard_only = get_allowed_origins(raw_origins="*", env="development")
assert_test(
    wildcard_only == [],
    "Standalone wildcard '*' is rejected and stripped"
)

# 2.7 Wildcard rejection: Mixed wildcard 'http://localhost:3000,*'
mixed_wildcard = get_allowed_origins(raw_origins="http://localhost:3000, *", env="development")
assert_test(
    mixed_wildcard == ["http://localhost:3000"],
    "Mixed wildcard in 'http://localhost:3000, *' is safely stripped, preserving valid origin"
)

# 2.8 Empty string handling
empty_str = get_allowed_origins(raw_origins="", env="development")
assert_test(
    empty_str == [],
    "Empty string raw_origins produces empty list []"
)

# 2.9 Whitespace-only string handling
whitespace_only = get_allowed_origins(raw_origins="   ", env="development")
assert_test(
    whitespace_only == [],
    "Whitespace-only raw_origins produces empty list []"
)

# 2.10 Precedence: ML_ALLOWED_ORIGINS takes precedence over ALLOWED_ORIGINS
os.environ["ML_ALLOWED_ORIGINS"] = "https://ml.example.com"
os.environ["ALLOWED_ORIGINS"] = "https://fallback.example.com"
precedence_res = get_allowed_origins()
assert_test(
    precedence_res == ["https://ml.example.com"],
    "ML_ALLOWED_ORIGINS takes precedence over ALLOWED_ORIGINS"
)

# 2.11 Precedence: Empty ML_ALLOWED_ORIGINS takes precedence over ALLOWED_ORIGINS
os.environ["ML_ALLOWED_ORIGINS"] = ""
empty_prec_res = get_allowed_origins()
assert_test(
    empty_prec_res == [],
    "Explicitly empty ML_ALLOWED_ORIGINS overrides ALLOWED_ORIGINS without falling back"
)

# Clean up env modifications
del os.environ["ML_ALLOWED_ORIGINS"]
del os.environ["ALLOWED_ORIGINS"]

# 2.12 Method and header constants
assert_test(
    ALLOWED_METHODS == ["GET", "POST", "OPTIONS"],
    "ALLOWED_METHODS strictly defines ['GET', 'POST', 'OPTIONS']"
)
assert_test(
    ALLOWED_HEADERS == ["Content-Type", "Authorization", "Accept"],
    "ALLOWED_HEADERS strictly defines ['Content-Type', 'Authorization', 'Accept']"
)

# ---------------------------------------------------------------------------
# 3. Direct CORSMiddleware In-Process Evaluation
# ---------------------------------------------------------------------------
print("\n3. Direct CORSMiddleware In-Process Evaluation")

# 3.1 Development CORSMiddleware Instance
dev_cm = CORSMiddleware(
    app=None,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)

assert_test(dev_cm.allow_all_origins is False, "dev_cm: allow_all_origins is False")
assert_test("*" not in dev_cm.allow_methods, "dev_cm: allow_methods does not contain wildcard '*'")
assert_test(dev_cm.allow_all_headers is False, "dev_cm: allow_all_headers is False")
assert_test(dev_cm.allow_credentials is False, "dev_cm: allow_credentials is False")

# Origin matching checks
assert_test(
    dev_cm.is_allowed_origin("http://localhost:3000") is True,
    "dev_cm: matches allowed origin 'http://localhost:3000'"
)
assert_test(
    dev_cm.is_allowed_origin("http://127.0.0.1:3000") is True,
    "dev_cm: matches allowed origin 'http://127.0.0.1:3000'"
)
assert_test(
    dev_cm.is_allowed_origin("http://evil-attacker.example.com") is False,
    "dev_cm: rejects unlisted origin 'http://evil-attacker.example.com'"
)

# Preflight response tests
preflight_valid_headers = Headers({
    "origin": "http://localhost:3000",
    "access-control-request-method": "POST",
    "access-control-request-headers": "content-type",
})
pf_res = dev_cm.preflight_response(preflight_valid_headers)
assert_test(pf_res.status_code == 200, "OPTIONS preflight for allowed origin returns 200 OK")
assert_test(
    pf_res.headers.get("access-control-allow-origin") == "http://localhost:3000",
    "Preflight response sets exact Access-Control-Allow-Origin: http://localhost:3000"
)
assert_test(
    pf_res.headers.get("access-control-allow-origin") != "*",
    "Preflight response does NOT return wildcard '*'"
)
assert_test(
    pf_res.headers.get("access-control-allow-credentials") is None,
    "Preflight response does NOT allow credentials"
)
assert_test(
    "POST" in pf_res.headers.get("access-control-allow-methods", ""),
    "Preflight response allows POST method"
)

# Preflight disallowed origin
preflight_disallowed_origin = Headers({
    "origin": "http://evil-attacker.example.com",
    "access-control-request-method": "POST",
})
pf_disallowed_res = dev_cm.preflight_response(preflight_disallowed_origin)
assert_test(
    "access-control-allow-origin" not in pf_disallowed_res.headers,
    "Preflight for unlisted origin does NOT include Access-Control-Allow-Origin"
)
assert_test(pf_disallowed_res.status_code == 400, "Disallowed preflight returns status 400")

# Preflight disallowed method
preflight_disallowed_method = Headers({
    "origin": "http://localhost:3000",
    "access-control-request-method": "DELETE",
})
pf_bad_method_res = dev_cm.preflight_response(preflight_disallowed_method)
assert_test(pf_bad_method_res.status_code == 400, "Disallowed preflight method (DELETE) returns status 400")
assert_test(
    "DELETE" not in pf_bad_method_res.headers.get("access-control-allow-methods", ""),
    "Disallowed method is NOT reflected in access-control-allow-methods"
)

# Simple response header injection simulation (testing dev_cm.send logic)
def simulate_response_headers(cm, request_origin):
    """Simulates CORSMiddleware header transformation on http.response.start."""
    message = {
        "type": "http.response.start",
        "status": 200,
        "headers": [(b"content-type", b"application/json")],
    }
    headers = MutableHeaders(scope=message)
    if request_origin is not None:
        headers.update(cm.simple_headers)
        if not cm.allow_all_origins and cm.is_allowed_origin(origin=request_origin):
            cm.allow_explicit_origin(headers, request_origin)
        else:
            headers["Vary"] = ", ".join([*headers.getlist("Vary"), "Origin"])
    return {k.lower(): v for k, v in headers.items()}

# Allowed simple GET
simple_allowed = simulate_response_headers(dev_cm, "http://localhost:3000")
assert_test(
    simple_allowed.get("access-control-allow-origin") == "http://localhost:3000",
    "Simple GET with allowed origin injects Access-Control-Allow-Origin: http://localhost:3000"
)

# Disallowed simple GET
simple_blocked = simulate_response_headers(dev_cm, "http://evil-attacker.example.com")
assert_test(
    "access-control-allow-origin" not in simple_blocked,
    "Simple GET with unlisted origin does NOT inject Access-Control-Allow-Origin (browser SOP blocks read)"
)

# Server-to-server call (no Origin header)
simple_s2s = simulate_response_headers(dev_cm, None)
assert_test(
    "access-control-allow-origin" not in simple_s2s,
    "Server-to-server call without Origin header receives no CORS headers (clean passthrough)"
)

# ---------------------------------------------------------------------------
# 4. Production Default Mode Isolation
# ---------------------------------------------------------------------------
print("\n4. Production Default Mode Isolation")

prod_cm = CORSMiddleware(
    app=None,
    allow_origins=get_allowed_origins(raw_origins=None, env="production"),  # empty list []
    allow_credentials=False,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)

assert_test(prod_cm.allow_origins == [], "prod_cm: allow_origins is strictly empty []")
assert_test(prod_cm.allow_all_origins is False, "prod_cm: allow_all_origins is False")
assert_test(
    prod_cm.is_allowed_origin("http://localhost:3000") is False,
    "prod_cm: rejects localhost origin under production default"
)
assert_test(
    prod_cm.is_allowed_origin("https://any-domain.com") is False,
    "prod_cm: rejects any domain under production default"
)

# Production preflight receives no permission
prod_pf = prod_cm.preflight_response(preflight_valid_headers)
assert_test(
    "access-control-allow-origin" not in prod_pf.headers,
    "Production default preflight contains no Access-Control-Allow-Origin header"
)

# Production server-to-server receives clean response
prod_s2s = simulate_response_headers(prod_cm, None)
assert_test(
    "access-control-allow-origin" not in prod_s2s,
    "Production server-to-server traffic is unimpeded"
)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n==================================================")
print(f"Results: {passed} PASSED, {failed} FAILED")
print("==================================================")

if failed > 0:
    sys.exit(1)
else:
    sys.exit(0)
