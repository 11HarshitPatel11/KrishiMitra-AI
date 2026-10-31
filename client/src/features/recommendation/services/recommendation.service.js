import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

export const recommendationService = {
    /**
     * @param {Object} features 
     * @returns {Promise<Object>} The cleanly normalized recommendation response from Node.js
     */
    predictCrop: async (features) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            const token = authService.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/recommendations/predict`, {
                method: 'POST',
                headers,
                body: JSON.stringify(features)
            });

            const data = await response.json();

            if (!response.ok) {
                // If it's a validation error array or server error, throw it so the UI handles it cleanly
                let errorMsg = data.message || "Failed to generate recommendation";
                if (data.errors && data.errors.length > 0) {
                    errorMsg = data.errors.join(", ");
                }
                throw new Error(errorMsg);
            }

            return data.data; // { recommendations: [...] }
        } catch (error) {
            // Bubble up fetching/network errors natively without stack traces
            throw new Error(error.message || "Network Error: Could not reach the recommendation service");
        }
    }
};
