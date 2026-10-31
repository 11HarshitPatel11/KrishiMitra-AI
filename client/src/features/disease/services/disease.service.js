import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

const API_URL = `${API_BASE_URL}/disease`;

export const diseaseService = {
    async predictDisease(imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const token = authService.getToken();

        try {
            const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do not set Content-Type here, browser sets it to multipart/form-data with boundary
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                // If it's a 401, bubble that up distinctly so UI can prompt login
                if (response.status === 401) {
                    throw { status: 401, message: 'Authentication expired. Please log in again.' };
                }

                // Keep the payload message if available, otherwise generic
                throw new Error(data.message || `Error ${response.status}: Failed to get prediction`);
            }

            return data;
        } catch (error) {
            // Re-throw custom objects or standard errors
            if (error.status) throw error;
            if (error instanceof TypeError) {
                // TypeError typically means network down / no response
                throw new Error("Unable to connect to the disease detection service. Please check your connection.");
            }
            throw error;
        }
    }
};
