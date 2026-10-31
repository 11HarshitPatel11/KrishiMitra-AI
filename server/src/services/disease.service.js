import axios from 'axios';
import FormData from 'form-data';

export class DiseaseService {
    static async predictDisease(fileBuffer, originalName, mimeType) {
        const rawBaseUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
        const url = `${baseUrl}/api/v1/disease/predict`;
        const timeoutMs = parseInt(process.env.ML_TIMEOUT_MS, 10) || 120000;

        try {
            const formData = new FormData();
            formData.append('file', fileBuffer, {
                filename: originalName || 'image.jpg',
                contentType: mimeType
            });

            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: timeoutMs
            });

            return response.data;

        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw { status: 504, message: `Disease ML Service request timed out after ${timeoutMs / 1000} seconds` };
            }
            if (error.response) {
                // If it's 400 or 422 from FastAPI
                if (error.response.status === 400 || error.response.status === 422) {
                    const errorData = error.response.data;
                    throw { status: 400, message: `FastAPI Image Validation Error: ${errorData?.detail || JSON.stringify(errorData)}` };
                }
                throw { status: 502, message: `Disease ML Service failure (HTTP ${error.response.status})` };
            }
            throw { status: 503, message: `Disease detection service is currently unavailable.` };
        }
    }
}
