 import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

// Response interceptor: handle 401 with refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                originalRequest.headers.set('Authorization', `Bearer ${data.data.accessToken}`);
                return api(originalRequest);
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (typeof window !== 'undefined') window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
    me: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Users
export const usersAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getPublicPassport: (username) => api.get(`/users/passport/${username}`),
    getTimeline: (userId) => api.get(`/users/${userId}/skill-timeline`),
};

// Skills
export const skillsAPI = {
    list: (params) => api.get('/skills', { params }),
    getCategories: () => api.get('/skills/categories'),
    getById: (id) => api.get(`/skills/${id}`),
    create: (data) => api.post('/skills', data),
    claim: (skillId) => api.post(`/skills/${skillId}/claim`),
    mySkills: () => api.get('/skills/user/my-skills'),
};

// Tests
export const testsAPI = {
    getForSkill: (skillId) => api.get(`/tests/skill/${skillId}`),
    submit: (testId, data) => api.post(`/tests/${testId}/submit`, data),
    myAttempts: () => api.get('/tests/user/attempts'),
    create: (data) => api.post('/tests', data),
};

// Projects
export const projectsAPI = {
    submit: (data) => api.post('/projects', data),
    myProjects: () => api.get('/projects/user/my-projects'),
    getById: (id) => api.get(`/projects/${id}`),
};

// Reviews
export const reviewsAPI = {
    assigned: () => api.get('/reviews/assigned'),
    getById: (id) => api.get(`/reviews/${id}`),
    submit: (reviewId, data) => api.post(`/reviews/${reviewId}/submit`, data),
    reviewerStats: () => api.get('/reviews/reviewer/stats'),
};

// Recruiter
export const recruiterAPI = {
    search: (params) => api.get('/recruiter/search', { params }),
    getCandidate: (username) => api.get(`/recruiter/candidate/${username}`),
    compare: (usernames) => api.post('/recruiter/compare', { usernames }),
};

// Admin
export const adminAPI = {
    dashboard: () => api.get('/admin/dashboard'),
    users: (params) => api.get('/admin/users', { params }),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    institutionAnalytics: () => api.get('/admin/institution/analytics'),
    createInstitution: (data) => api.post('/admin/institutions', data),
    pendingSkills: () => api.get('/admin/skills/pending'),
};

export default api;
