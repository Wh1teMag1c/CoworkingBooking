import { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async (userId) => {
        try {
            const response = await api.get(`users/${userId}/`);
            setUser(response.data);
        } catch (error) {
            console.error("Ошибка при получении данных пользователя", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.user_id) {
                    fetchUser(decoded.user_id).finally(() => {
                        setLoading(false);
                    });
                } else {
                    setUser(decoded);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Неверный токен", error);
                logout();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const response = await api.post('token/', { username, password });
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        const decoded = jwtDecode(response.data.access);
        if (decoded.user_id) {
            await fetchUser(decoded.user_id);
        } else {
            setUser(decoded);
        }
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};