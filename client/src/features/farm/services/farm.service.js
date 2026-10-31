import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

const API_URL = API_BASE_URL;

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = authService.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const createFarm = async (farmData) => {
    try {
        const response = await fetch(`${API_URL}/farms`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(farmData),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while communicating with the server.',
        };
    }
};

export const getAllFarms = async () => {
    try {
        const response = await fetch(`${API_URL}/farms`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while fetching farms.',
            data: [],
        };
    }
};

export const getFarmById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/farms/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while fetching the farm.',
        };
    }
};

export const updateFarm = async (id, updateData) => {
    try {
        const response = await fetch(`${API_URL}/farms/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updateData),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while updating the farm.',
        };
    }
};

export const deleteFarm = async (id) => {
    try {
        const response = await fetch(`${API_URL}/farms/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while deleting the farm.',
        };
    }
};

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
    try {
        const response = await fetch(`${API_URL}/farms/reverse-geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Failed to reverse-geocode coordinates.',
            data: null,
        };
    }
};
