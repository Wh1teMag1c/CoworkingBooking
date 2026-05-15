import {createContext, useEffect, useState} from 'react';
import {jwtDecode} from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (error) {
                console.error("Неверный токен", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('token/', {username, password});
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        setUser(jwtDecode(response.data.access));
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};