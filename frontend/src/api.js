const BASE_URL = 'http://localhost:8000/api';
const BACKEND_ORIGIN = 'http://localhost:8000';

/**
 * Resolves a stored image path to a full URL.
 * The backend stores paths like "uploads/events/abc.jpg" and serves
 * them from http://localhost:8000/uploads/... — prefix them here.
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
    return `${BACKEND_ORIGIN}/${path.replace(/^\/+/, '')}`;
};


const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
    }
    return data;
};

export const api = {
    // Auth
    login: (credentials) =>
        fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        }).then(handleResponse),

    register: (userData) =>
        fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        }).then(handleResponse),

    getMe: () =>
        fetch(`${BASE_URL}/auth/me`, {
            headers: getHeaders(),
        }).then(handleResponse),

    updateProfile: (userData) =>
        fetch(`${BASE_URL}/auth/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(userData),
        }).then(handleResponse),

    // Events
    getEvents: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetch(`${BASE_URL}/events/?${query}`, {
            headers: getHeaders(),
        }).then(handleResponse);
    },

    getEvent: (id) =>
        fetch(`${BASE_URL}/events/${id}`, {
            headers: getHeaders(),
        }).then(handleResponse),

    getSimilarEvents: (id) =>
        fetch(`${BASE_URL}/events/${id}/similar`, {
            headers: getHeaders(),
        }).then(handleResponse),

    getIsFavorite: (id) =>
        fetch(`${BASE_URL}/favorites/is-favorite/${id}`, {
            headers: getHeaders(),
        }).then(handleResponse),

    createEvent: (eventData) =>
        fetch(`${BASE_URL}/events/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(eventData),
        }).then(handleResponse),

    updateEvent: (id, eventData) =>
        fetch(`${BASE_URL}/events/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(eventData),
        }).then(handleResponse),

    deleteEvent: (id) =>
        fetch(`${BASE_URL}/events/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),

    getPendingEvents: () =>
        fetch(`${BASE_URL}/events/pending`, {
            headers: getHeaders(),
        }).then(handleResponse),

    getMyEvents: () =>
        fetch(`${BASE_URL}/events/my-events`, {
            headers: getHeaders(),
        }).then(handleResponse),

    approveEvent: (id) =>
        fetch(`${BASE_URL}/events/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
        }).then(handleResponse),

    rejectEvent: (id, reason) =>
        fetch(`${BASE_URL}/events/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        }).then(handleResponse),

    getRecommendations: () =>
        fetch(`${BASE_URL}/events/recommendations`, {
            headers: getHeaders(),
        }).then(handleResponse),

    // Registrations
    registerForEvent: (eventId) =>
        fetch(`${BASE_URL}/registrations/${eventId}`, {
            method: 'POST',
            headers: getHeaders(),
        }).then(handleResponse),

    getMyRegistrations: () =>
        fetch(`${BASE_URL}/registrations/my-registrations`, {
            headers: getHeaders(),
        }).then(handleResponse),

    cancelRegistration: (eventId) =>
        fetch(`${BASE_URL}/registrations/${eventId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),

    getRegistrationQrCode: (id) =>
        fetch(`${BASE_URL}/registrations/${id}/qr-code`, {
            headers: getHeaders(),
        }).then(res => res.blob()),

    getEventParticipants: (eventId) =>
        fetch(`${BASE_URL}/registrations/event/${eventId}/participants`, {
            headers: getHeaders(),
        }).then(handleResponse),

    getEventLiveStats: (eventId) =>
        fetch(`${BASE_URL}/registrations/event/${eventId}/live`, {
            headers: getHeaders(),
        }).then(handleResponse),

    scanRegistration: (id, eventId = null) => {
        const query = eventId ? `?event_id=${eventId}` : '';
        return fetch(`${BASE_URL}/registrations/scan/${id}${query}`, {
            method: 'POST',
            headers: getHeaders(),
        }).then(handleResponse);
    },

    checkIn: (id) =>
        fetch(`${BASE_URL}/registrations/${id}/check-in`, {
            method: 'POST',
            headers: getHeaders(),
        }).then(handleResponse),

    checkOut: (id) =>
        fetch(`${BASE_URL}/registrations/${id}/check-out`, {
            method: 'POST',
            headers: getHeaders(),
        }).then(handleResponse),

    getEventHistory: (eventId) =>
        fetch(`${BASE_URL}/registrations/event/${eventId}/history`, {
            headers: getHeaders(),
        }).then(handleResponse),

    // Favorites
    getFavorites: () =>
        fetch(`${BASE_URL}/favorites/my-favorites`, {
            headers: getHeaders(),
        }).then(handleResponse),

    toggleFavorite: (eventId, isFavorite) =>
        fetch(`${BASE_URL}/favorites/${eventId}`, {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: getHeaders(),
        }).then(handleResponse),

    // Analytics
    getGlobalAnalytics: () =>
        fetch(`${BASE_URL}/analytics/global`, {
            headers: getHeaders(),
        }).then(handleResponse),

    getMyDashboard: (userId = null) => {
        const url = userId
            ? `${BASE_URL}/analytics/my-dashboard?user_id=${userId}`
            : `${BASE_URL}/analytics/my-dashboard`;
        return fetch(url, {
            headers: getHeaders(),
        }).then(handleResponse);
    },

    getEventAnalytics: (id) =>
        fetch(`${BASE_URL}/analytics/event/${id}`, {
            headers: getHeaders(),
        }).then(handleResponse),

    uploadEventImage: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${BASE_URL}/events/${id}/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData,
        }).then(handleResponse);
    },

    uploadProfileImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${BASE_URL}/auth/me/profile-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData,
        }).then(handleResponse);
    },

    deleteProfileImage: () =>
        fetch(`${BASE_URL}/auth/me/profile-image`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),

    adminCreateUser: (userData) =>
        fetch(`${BASE_URL}/auth/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData),
        }).then(handleResponse),
};
