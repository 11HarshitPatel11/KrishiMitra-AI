import { API_BASE_URL } from '../config/api.config';

const API_URL = `${API_BASE_URL}/auth`;

export const authService = {
    async register(userData) {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            // Defensive handling for non-JSON proxy/gateway responses
        }

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                throw new Error(
                    data.message ||
                    `Too many registration attempts. Please try again${retryAfter ? ` after ${retryAfter} seconds` : ' later'}.`
                );
            }
            throw new Error(data.message || 'Registration failed');
        }
        return data;
    },

    async login(credentials) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            // Defensive handling for non-JSON proxy/gateway responses
        }

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                throw new Error(
                    data.message ||
                    `Too many login attempts. Please try again${retryAfter ? ` after ${retryAfter} seconds` : ' later'}.`
                );
            }
            throw new Error(data.message || 'Login failed');
        }

        if (data.data?.token) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        return data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async getProfile() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to retrieve profile');
        }
        return data;
    },

    async updateProfile(profileData) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/profile`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(profileData),
        });

        const data = await response.json();
        if (!response.ok) {
            let errorMsg = data.message || 'Failed to update profile';
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                errorMsg += ': ' + data.errors.map(e => e.message || e).join(', ');
            }
            throw new Error(errorMsg);
        }

        // Update cached user in localStorage if name changed
        if (data.data?.user) {
            const currentUser = this.getUser() || {};
            localStorage.setItem('user', JSON.stringify({
                ...currentUser,
                name: data.data.user.name,
                email: data.data.user.email
            }));
        }

        return data;
    }
};
