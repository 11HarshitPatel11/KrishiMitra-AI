/**
 * server/test_helpers/http_client.js
 * ---------------------------------------------------------------------------
 * In-process HTTP integration test client for Express.
 * Uses ephemeral TCP localhost sockets (port 0) with native Node.js fetch,
 * ensuring zero port conflicts, fast execution, and cross-platform reliability.
 * ---------------------------------------------------------------------------
 */

import http from 'http';

/**
 * Creates an in-process test client for the given Express application.
 *
 * @param {import('express').Express} app - Express application instance
 * @returns {Promise<{
 *   baseUrl: string,
 *   get: (path: string, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: any, text: string }>,
 *   post: (path: string, body?: any, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: any, text: string }>,
 *   patch: (path: string, body?: any, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: any, text: string }>,
 *   delete: (path: string, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: any, text: string }>,
 *   postMultipart: (path: string, options: { fieldName?: string, filename?: string, contentType?: string, content: Buffer }, headers?: Record<string, string>) => Promise<{ status: number, headers: Record<string, string>, body: any, text: string }>,
 *   close: () => Promise<void>
 * }>}
 */
export async function createTestClient(app) {
    const server = http.createServer(app);

    await new Promise((resolve, reject) => {
        server.listen(0, '127.0.0.1', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const request = async (method, path, { headers = {}, body = null } = {}) => {
        const reqHeaders = { ...headers };
        let reqBody = undefined;

        if (body !== null && body !== undefined) {
            if (typeof body === 'object' && !(body instanceof FormData) && !Buffer.isBuffer(body)) {
                if (!reqHeaders['Content-Type'] && !reqHeaders['content-type']) {
                    reqHeaders['Content-Type'] = 'application/json';
                }
                reqBody = JSON.stringify(body);
            } else {
                reqBody = body;
            }
        }

        const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        const res = await fetch(url, {
            method,
            headers: reqHeaders,
            body: reqBody,
        });

        const text = await res.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {
            // Non-JSON response
        }

        return {
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            body: json,
            text,
        };
    };

    return {
        baseUrl,
        get: (path, headers) => request('GET', path, { headers }),
        post: (path, body, headers) => request('POST', path, { body, headers }),
        patch: (path, body, headers) => request('PATCH', path, { body, headers }),
        delete: (path, headers) => request('DELETE', path, { headers }),
        postMultipart: async (path, { fieldName = 'file', filename = 'file.jpg', contentType = 'image/jpeg', content = Buffer.alloc(0) } = {}, headers = {}) => {
            const formData = new FormData();
            const blob = new Blob([content], { type: contentType });
            formData.append(fieldName, blob, filename);

            return request('POST', path, {
                body: formData,
                headers,
            });
        },
        close: () => new Promise(resolve => server.close(resolve)),
    };
}
