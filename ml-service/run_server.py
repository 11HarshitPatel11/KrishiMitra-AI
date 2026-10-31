import os
import sys

# Ensure ml-service root is always in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import uvicorn
from app.main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[ML Service] Starting Uvicorn on http://{host}:{port} (workers=1)...", flush=True)
    uvicorn.run(app, host=host, port=port, workers=1, log_level="info")
