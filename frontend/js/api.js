/**
 * Kequiv API Client
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    try {
        const res = await fetch(url, { ...options, headers });
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
    // Dashboard
    getDashboard: () => request('/dashboard'),

    // Company
    getCompany: () => request('/company'),
    updateCompany: (data) => request('/company', { method: 'PUT', body: JSON.stringify(data) }),

    // Customers
    getCustomers: (search = '') => request(`/customers?search=${encodeURIComponent(search)}`),
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
    markPaid: (id) => request(`/documents/${id}/mark-paid`, { method: 'POST' }),
    deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

    // Upload
    uploadImage: (base64Data, type = 'item') => request('/upload', { method: 'POST', body: JSON.stringify({ image: base64Data, type }) }),

    // Presets
    getPresets: () => request('/presets')
};
