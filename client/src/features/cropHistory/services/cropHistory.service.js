import { authService } from '../../../services/auth.service';
import { API_BASE_URL } from '../../../config/api.config';

const API_URL = `${API_BASE_URL}/crop-history`;

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

export const createCropHistory = async (data) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getCropHistories = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getHeaders(),
    });
    return await response.json();
};

export const getCropHistoriesByFarm = async (farmId) => {
    const response = await fetch(`${API_URL}/farm/${farmId}`, {
        method: 'GET',
        headers: getHeaders(),
    });
    return await response.json();
};

export const getCropHistoryById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: getHeaders(),
    });
    return await response.json();
};

export const updateCropHistory = async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteCropHistory = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    return await response.json();
};
