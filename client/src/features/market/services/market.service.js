import { API_BASE_URL } from '../../../config/api.config';

const API_URL = `${API_BASE_URL}/market`;

export const marketService = {
    getMarketInformation: async (filters = {}) => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const queryParams = new URLSearchParams();
        if (filters.commodity && filters.commodity.trim()) queryParams.append('commodity', filters.commodity.trim());
        if (filters.state && filters.state.trim()) queryParams.append('state', filters.state.trim());
        if (filters.district && filters.district.trim()) queryParams.append('district', filters.district.trim());
        if (filters.limit) queryParams.append('limit', String(filters.limit));

        const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const err = new Error(data.message || 'Market prices are temporarily unavailable. Please try again later.');
            err.status = response.status;
            err.code = data.code;
            err.devNote = data.devNote;
            throw err;
        }

        return data;
    }
};
