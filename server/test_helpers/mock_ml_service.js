/**
 * server/test_helpers/mock_ml_service.js
 * ---------------------------------------------------------------------------
 * In-process Mock HTTP Server for FastAPI Crop & Disease ML Microservices.
 *
 * Implements the external microservice contracts:
 *   - POST /api/v1/predict (Crop recommendation)
 *   - POST /api/v1/disease/predict (Disease detection)
 *
 * Allows integration testing of Node.js gateway validation, error mapping,
 * and 502/503 fallback handling without requiring the Python/PyTorch runtime.
 * ---------------------------------------------------------------------------
 */

import http from 'http';

/**
 * Creates and starts a mock ML microservice HTTP server.
 *
 * @param {number} port - Desired port (default 0 for ephemeral)
 * @returns {Promise<{
 *   url: string,
 *   setMode: (mode: 'normal' | 'uncertain' | 'failure' | 'timeout') => void,
 *   close: () => Promise<void>
 * }>}
 */
export async function createMockMlService(port = 0) {
    let mode = 'normal'; // 'normal' | 'uncertain' | 'failure' | 'timeout'

    const server = http.createServer((req, res) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            if (mode === 'timeout') {
                // Do not respond; let the Node gateway abort timeout fire
                return;
            }

            if (mode === 'failure') {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ detail: 'Simulated ML Service Internal Error' }));
            }

            // Crop Recommendation Endpoint
            if (req.url === '/api/v1/predict' && req.method === 'POST') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    data: {
                        recommendations: [
                            { crop: 'rice', probability: 0.95 },
                            { crop: 'maize', probability: 0.82 },
                            { crop: 'chickpea', probability: 0.70 },
                            { crop: 'kidneybeans', probability: 0.65 },
                            { crop: 'pigeonpeas', probability: 0.60 },
                        ]
                    }
                }));
            }

            // Disease Detection Endpoint
            if (req.url === '/api/v1/disease/predict' && req.method === 'POST') {
                if (mode === 'uncertain') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: true,
                        data: {
                            prediction: {
                                className: 'Tomato___Early_blight',
                                confidence: 0.42,
                                status: 'uncertain'
                            },
                            top3: [
                                { className: 'Tomato___Early_blight', confidence: 0.42 },
                                { className: 'Tomato___Late_blight', confidence: 0.38 },
                                { className: 'Tomato___Target_Spot', confidence: 0.20 }
                            ]
                        }
                    }));
                }

                // Confident mode
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    data: {
                        prediction: {
                            className: 'Tomato___Early_blight',
                            confidence: 0.94,
                            status: 'confident'
                        },
                        top3: [
                            { className: 'Tomato___Early_blight', confidence: 0.94 },
                            { className: 'Tomato___Late_blight', confidence: 0.04 },
                            { className: 'Tomato___Target_Spot', confidence: 0.02 }
                        ]
                    }
                }));
            }

            // Default fallback
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: `Mock route ${req.method} ${req.url} not found` }));
        });
    });

    await new Promise((resolve, reject) => {
        server.listen(port, '127.0.0.1', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    const actualPort = server.address().port;
    const url = `http://127.0.0.1:${actualPort}`;

    return {
        url,
        setMode: (newMode) => { mode = newMode; },
        close: () => new Promise(resolve => server.close(resolve)),
    };
}
