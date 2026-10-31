/**
 * ML Service Client
 * 
 * 1. Why Node.js communicates with FastAPI: Node.js handles core application logic and web requests brilliantly, but Python is the industry standard for ML. By keeping them separate, we allow each to do what they do best without freezing Node.js event loop with ML computations.
 * 2. Why Node.js does not load the ML model: Node.js is not designed generally for massive matrix computations or Scikit-Learn `.joblib` binary formats, which are native to Python.
 * 3. Why the ML service URL is stored in environment variables: It allows us to deploy the application anywhere (like Cloud Run or AWS) without modifying the source code, because the ML service path might change.
 * 6. Why the frontend should communicate with Node.js instead of directly with FastAPI: Node.js acts as a secure application gateway. If the frontend talked directly to FastAPI, it would bypass authentication, rate-limiting, and logging enforced by Node.js.
 */


export class MLServiceClient {
    /**
     * Sends the canonically formatted payload to the FastAPI service.
     */
    static async predictCrop(features) {
        const rawBaseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
        const url = `${baseUrl}/api/v1/predict`;
        const timeoutMs = parseInt(process.env.ML_TIMEOUT_MS, 10) || 120000;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(features),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Determine if 4xx or 5xx from FastAPI
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { detail: 'Unknown ML Service error' };
                }

                throw new Error(
                    `ML Service responded with status ${response.status}: ${JSON.stringify(errorData)}`
                );
            }

            const data = await response.json();
            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`ML Service request timed out after ${timeoutMs / 1000} seconds`);
            }
            // Bubble network/fetch errors gracefully 
            throw new Error(`ML Service communication failed: ${error.message}`);
        }
    }
}
