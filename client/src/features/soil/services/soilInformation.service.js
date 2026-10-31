import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

const API_URL = `${API_BASE_URL}/soil-information`;
const FARMS_API_URL = `${API_BASE_URL}/farms`; // Used for selecting farms

export const soilInformationService = {
    async getUserFarms() {
        const token = authService.getToken();
        const response = await fetch(FARMS_API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch farms');
        return data.data;
    },

    async getSoilByFarm(farmId) {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/farm/${farmId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch soil information');
        return data.data; // Array of soil info
    },

    async createSoilInfo(payload) {
        const token = authService.getToken();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            // handle generic arrays from express validator occasionally
            const errorMsg = data.errors ? data.errors.join(', ') : data.message;
            throw new Error(errorMsg || 'Failed to create soil information');
        }
        return data.data;
    },

    async updateSoilInfo(id, payload) {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            const errorMsg = data.errors ? data.errors.join(', ') : data.message;
            throw new Error(errorMsg || 'Failed to update soil information');
        }
        return data.data;
    },

    async deleteSoilInfo(id) {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete soil information');
        return data;
    }
};
