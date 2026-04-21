
const API = {

    async request(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
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
            return { success: false, message: 'Could not connect to the server. Please ensure XAMPP is running.' };
        }
    },

    // Auth
    async login(email, password) {
        return this.request('api/auth.php?action=login', 'POST', { email, password });
    },

    async signup(name, email, password) {
        return this.request('api/auth.php?action=signup', 'POST', { name, email, password });
    },

    async logout() {
        return this.request('api/auth.php?action=logout', 'POST');
    },

    async getSession() {
        return this.request('api/auth.php?action=session');
    },

    // Commissions
    async createCommission(data) {
        return this.request('api/commissions.php?action=create', 'POST', data);
    },

    async getMyCommissions() {
        return this.request('api/commissions.php?action=list');
    },

    // Notifications
    async getNotifications() {
        return this.request('api/notifications.php?action=list');
    },

    async clearNotifications() {
        return this.request('api/notifications.php?action=clear', 'POST');
    },

    // Admin
    async getAllRequests() {
        return this.request('api/admin.php?action=all_requests');
    },

    async updateStatus(id, status, amount) {
        return this.request('api/admin.php?action=update_status', 'POST', { id, status, amount });
    },

    async deleteCommission(id) {
        return this.request(`api/admin.php?action=delete&id=${id}`, 'POST');
    },

    async clearAllCommissions() {
        return this.request('api/admin.php?action=clear_all', 'POST');
    },

    async getWalletHistory() {
        return this.request('api/admin.php?action=wallet_history');
    },

    async getUsers() {
        return this.request('api/admin.php?action=get_users');
    },

    async deleteUser(id) {
        return this.request(`api/admin.php?action=delete_user&id=${id}`, 'POST');
    },

    async updateUser(data) {
        return this.request('api/admin.php?action=update_user', 'POST', data);
    }
};
