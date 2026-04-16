// الرابط الأساسي للـ API
// عند الرفع على Hostinger سيستخدم المسار النسبي /api
// في بيئة التطوير المحلية سيستخدم السيرفر المحلي للـ PHP
const API_BASE_URL = import.meta.env.PROD
    ? '/api'
    : 'http://192.168.1.36:8000/api';

export const api = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API GET Error: ${response.statusText}`);
        }
        return response.json();
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API POST Error: ${response.statusText}`);
        }
        return response.json();
    },

    async put<T>(endpoint: string, data?: any): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            throw new Error(`API PUT Error: ${response.statusText}`);
        }
        return response.json();
    }
};
