
const API_BASE_URL = 'http://localhost:3000';

const API = {

    async request(path, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${path}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Required for express-session
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (!response.ok) {
                    return { 
                        success: false, 
                        message: result.message || `Server Error (${response.status})`,
                        details: result.details || null
                    };
                }
                return result;
            } else {
                const text = await response.text();
                return { success: false, message: `Server Error (${response.status})`, details: text };
            }
        } catch (error) {
            console.error('API Connection Error:', error);
            return { success: false, message: 'Could not connect to the server. Please ensure the Node server is running on port 3000.' };
        }
    },

    // Auth
    async login(email, password) {
        return this.request('/api/auth/login', 'POST', { email, password });
    },

    async signup(name, email, password) {
        return this.request('/api/auth/signup', 'POST', { name, email, password });
    },

    async logout() {
        return this.request('/api/auth/logout', 'POST');
    },

    async getSession() {
        return this.request('/api/auth/session');
    },

    // Commissions
    async createCommission(data) {
        return this.request('/api/commissions/create', 'POST', data);
    },

    async getMyCommissions() {
        return this.request('/api/commissions/list');
    },

    // Notifications
    async getNotifications() {
        return this.request('/api/notifications/list');
    },

    async clearNotifications() {
        return this.request('/api/notifications/clear', 'POST');
    },

    // Admin
    async getAllRequests() {
        return this.request('/api/admin/all_requests');
    },

    async updateStatus(id, status, amount) {
        return this.request('/api/admin/update_status', 'POST', { id, status, amount });
    },

    async deleteCommission(id) {
        return this.request(`/api/admin/delete_commission?id=${id}`, 'POST');
    },

    async clearAllCommissions() {
        return this.request('/api/admin/clear_all', 'POST');
    },

    async getWalletHistory() {
        return this.request('/api/admin/wallet_history');
    },

    async getUsers() {
        return this.request('/api/admin/get_users');
    },

    async deleteUser(id) {
        return this.request(`/api/admin/delete_user?id=${id}`, 'POST');
    },

    async updateUser(data) {
        return this.request('/api/admin/update_user', 'POST', data);
    },

    async getRevenueStats() {
        return this.request('/api/admin/stats/revenue');
    },

    async getPendingSummary() {
        return this.request('/api/admin/stats/pending_summary');
    },

    async getAnalyticsSummary() {
        return this.request('/api/admin/stats/summary');
    }
};

