import os

DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
ALLOWED_METHODS = ["GET", "POST", "OPTIONS"]
ALLOWED_HEADERS = ["Content-Type", "Authorization", "Accept"]

def get_allowed_origins(raw_origins: str = None, env: str = None) -> list:
    """
    Parses and normalizes allowed CORS origins.
    
    Precedence:
    1. If raw_origins argument is explicitly provided, it is parsed directly.
    2. Else checks ML_ALLOWED_ORIGINS environment variable.
    3. If ML_ALLOWED_ORIGINS is not set (None), falls back to ALLOWED_ORIGINS.
    4. If neither is set:
       - In 'production' environment: returns [] (strict server-to-server isolation).
       - In other environments (e.g. 'development'): returns DEFAULT_DEV_ORIGINS.
       
    Rules:
    - Strips whitespace.
    - Strips trailing slashes from origins (browser Origin headers never include trailing slashes).
    - Strictly rejects wildcard '*' to prevent accidental exposure.
    """
    if raw_origins is None:
        raw_origins = os.getenv("ML_ALLOWED_ORIGINS")
        if raw_origins is None:
            raw_origins = os.getenv("ALLOWED_ORIGINS")

    if env is None:
        env = os.getenv("ENVIRONMENT", "development").lower()
    else:
        env = env.lower()

    if raw_origins is not None:
        # Explicit environment variable or parameter provided
        cleaned = []
        for origin in raw_origins.split(","):
            trimmed = origin.strip().rstrip("/")
            # Reject empty strings and wildcard '*' entries
            if trimmed and trimmed != "*":
                cleaned.append(trimmed)
        return cleaned

    # No environment variable set: determine default based on environment
    if env == "production":
        return []

    return list(DEFAULT_DEV_ORIGINS)
