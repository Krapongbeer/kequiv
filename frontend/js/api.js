/**
 * Kequiv API Client with Authentication & Extended Capabilities
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('kequiv_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const res = await fetch(url, { ...options, headers });

        if (res.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/version')) {
            // Token expired or invalid
            localStorage.removeItem('kequiv_token');
            localStorage.removeItem('kequiv_user');
            if (window.app && typeof window.app.showLoginScreen === 'function') {
                window.app.showLoginScreen();
            }
            throw new Error('จำเป็นต้องเข้าสู่ระบบก่อนใช้งาน');
        }

        const json = await res.json();
        if (!res.ok || json.success === false) {
            throw new Error(json.error || `Request failed with status ${res.status}`);
        }
        return json;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        throw err;
    }
}

const api = {
    // Auth
    login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    getCurrentUser: () => request('/auth/me'),
    changePassword: (oldPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),

    // Version
    getVersion: () => request('/version'),

    // Backup & Reports
    exportBackupUrl: () => {
        const token = localStorage.getItem('kequiv_token');
        return `/api/backup/export?auth=${encodeURIComponent(token || '')}`;
    },
    exportBackup: async () => {
        const token = localStorage.getItem('kequiv_token');
        const res = await fetch('/api/backup/export', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการสำรองข้อมูล');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kequiv-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    },
    exportReportCsv: async (params = {}) => {
        const token = localStorage.getItem('kequiv_token');
        const qs = new URLSearchParams(params).toString();
        const res = await fetch(`/api/reports/export-csv?${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการส่งออกไฟล์รายงาน');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kequiv-report-${params.year || 'all'}-${params.month || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    // Dashboard
    getDashboard: () => request('/dashboard'),

    // Company
    getCompany: () => request('/company'),
    updateCompany: (data) => request('/company', { method: 'PUT', body: JSON.stringify(data) }),

    // Customers
    getCustomers: (search = '') => request(`/customers?search=${encodeURIComponent(search)}`),
    getTrashCustomers: () => request('/customers/trash'),
    restoreCustomer: (id) => request(`/customers/${id}/restore`, { method: 'POST' }),
    getCustomer: (id) => request(`/customers/${id}`),
    createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

    // Customer Projects
    addProject: (customerId, data) => request(`/customers/${customerId}/projects`, { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (customerId, projectId, data) => request(`/customers/${customerId}/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (customerId, projectId) => request(`/customers/${customerId}/projects/${projectId}`, { method: 'DELETE' }),

    // Reservations
    getReservations: (docType = '', status = 'all') => request(`/reservations?doc_type=${encodeURIComponent(docType)}&status=${encodeURIComponent(status)}`),
    reserveBatch: (data) => request('/reservations/batch', { method: 'POST', body: JSON.stringify(data) }),
    cancelReservation: (id) => request(`/reservations/${id}`, { method: 'DELETE' }),

    // Documents
    getNextCode: (type, date) => request(`/documents/next-code?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`),
    getDocuments: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                params.append(k, v);
            }
        });
        return request(`/documents?${params.toString()}`);
    },
    getDocument: (id) => request(`/documents/${id}`),
    createDocument: (data) => request('/documents', { method: 'POST', body: JSON.stringify(data) }),
    updateDocument: (id, data) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    convertDocument: (id, data) => request(`/documents/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
    duplicateDocument: (id) => request(`/documents/${id}/duplicate`, { method: 'POST' }),
    cancelDocument: (id, reason) => request(`/documents/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    markPaid: (id, paymentData = {}) => request(`/documents/${id}/mark-paid`, { method: 'POST', body: JSON.stringify(paymentData) }),
    deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

    // Upload
    uploadImage: (base64Data, type = 'item') => request('/upload', { method: 'POST', body: JSON.stringify({ image: base64Data, type }) }),

    // Presets
    getPresets: () => request('/presets'),

    // Website Leads / Inquiries
    submitLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
    getLeads: () => request('/leads'),
    updateLeadStatus: (id, status) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
    convertLeadToCustomer: (id) => request(`/leads/${id}/convert`, { method: 'POST' }),

    // Website CMS & Content Management
    getCmsContent: () => request('/cms/content'),
    updateCmsContent: (data) => request('/cms/content', { method: 'PUT', body: JSON.stringify(data) }),
    getCmsServices: () => request('/cms/services'),
    createCmsService: (data) => request('/cms/services', { method: 'POST', body: JSON.stringify(data) }),
    updateCmsService: (id, data) => request(`/cms/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCmsService: (id) => request(`/cms/services/${id}`, { method: 'DELETE' }),
    getCmsPortfolio: () => request('/cms/portfolio'),
    createCmsPortfolio: (data) => request('/cms/portfolio', { method: 'POST', body: JSON.stringify(data) }),
    updateCmsPortfolio: (id, data) => request(`/cms/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCmsPortfolio: (id) => request(`/cms/portfolio/${id}`, { method: 'DELETE' })
};
