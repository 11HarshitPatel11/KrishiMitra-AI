import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

const EXTERNAL_API_URL = `${API_BASE_URL}/soil-information/external`;

export const externalSoilService = {
    async fetchExternalSoil(farmId) {
        const token = authService.getToken();
        const response = await fetch(`${EXTERNAL_API_URL}/farm/${farmId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch external SoilGrids data');
        }

        const result = data.data;
        if (result && data.warning) {
            result._warning = data.warning;
        }
        return result; // Full populated structure
    },

    async getCachedExternalSoil(farmId) {
        const token = authService.getToken();
        const response = await fetch(`${EXTERNAL_API_URL}/farm/${farmId}/cached`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data; // Will be null if never fetched
    }
};
