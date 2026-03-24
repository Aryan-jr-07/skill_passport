'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) { setLoading(false); return; }
            const { data } = await authAPI.me();
            setUser(data.data);
        } catch (error) {
            console.error('Failed to load user:', error.message);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (email, password) => {
        const { data } = await authAPI.login({ email, password });
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        return user;
    };

    const register = async (formData) => {
        const { data } = await authAPI.register(formData);
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        return user;
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await authAPI.logout(refreshToken);
        } catch { }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    const updateUser = (updates) => setUser(prev => prev ? { ...prev, ...updates } : null);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
