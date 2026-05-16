import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        password: '',
        re_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePhone = (phone) => {
        if (!phone) return true;
        const re = /^\+?[0-9]{10,15}$/;
        return re.test(String(phone).replace(/[\s-]/g, ''));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.username.length < 3) {
            setError('Логин должен содержать не менее 3 символов.');
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Пожалуйста, введите корректный адрес электронной почты.');
            return;
        }

        if (formData.phone_number && !validatePhone(formData.phone_number)) {
            setError('Неверный формат телефона. Используйте международный формат, например: +79991234567');
            return;
        }

        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов.');
            return;
        }

        if (formData.password !== formData.re_password) {
            setError('Пароли не совпадают.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
                password: formData.password
            };

            await api.post('users/', payload);
            setShowToast(true);

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                let errorMessages = [];

                if (data.username) errorMessages.push('Пользователь с таким логином уже существует или логин недопустим.');
                if (data.email) errorMessages.push('Эта электронная почта уже используется.');
                if (data.password) errorMessages.push('Слишком простой или часто используемый пароль.');
                if (data.phone_number) errorMessages.push('Ошибка в номере телефона. Проверьте формат.');
                if (data.detail) errorMessages.push(data.detail);
                if (data.non_field_errors) errorMessages.push('Ошибка валидации: ' + data.non_field_errors.join(' '));

                if (errorMessages.length === 0) {
                    errorMessages = ['Возникла неизвестная ошибка при регистрации. Проверьте введенные данные.'];
                }
                setError(errorMessages.join('\n'));
            } else {
                setError('Ошибка соединения с сервером. Проверьте интернет-подключение.');
            }
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container d-flex align-items-center justify-content-center fade-in position-relative" style={{ minHeight: '85vh', padding: '4rem 0' }}>
            {showToast && (
                <div className="position-fixed top-0 start-50 translate-middle-x mt-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white border-0 shadow-lg p-3 d-flex align-items-center gap-3 fade-in" style={{ borderRadius: '16px', borderLeft: '5px solid var(--primary)', minWidth: '320px' }}>
                        <svg className="text-success" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <div>
                            <div className="fw-bold text-dark text-start">Успешно!</div>
                            <div className="text-muted small text-start">Перенаправляем на страницу входа...</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row justify-content-center w-100">
                <div className="col-md-8 col-lg-6">
                    <div className={`card border-0 rounded-4 shadow-lg p-4 p-md-5 ${showToast ? 'opacity-50' : ''}`} style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', transition: 'opacity 0.3s ease' }}>
                        <div className="card-body p-0">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <line x1="19" y1="8" x2="19" y2="14"></line>
                                        <line x1="22" y1="11" x2="16" y2="11"></line>
                                    </svg>
                                </div>
                                <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>Регистрация</h3>
                                <p className="text-muted small">Создайте аккаунт для работы с платформой</p>
                            </div>

                            {error && (
                                <div className="alert alert-danger border-0 small text-center mb-4 rounded-3 bg-danger bg-opacity-10 text-danger fw-medium fade-in" style={{ whiteSpace: 'pre-line' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleRegister}>
                                <fieldset disabled={showToast}>
                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ИМЯ</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ФАМИЛИЯ</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                                autoComplete="family-name"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ЛОГИН</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            autoComplete="username"
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>EMAIL</label>
                                            <input
                                                type="email"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                autoComplete="email"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ТЕЛЕФОН</label>
                                            <input
                                                type="tel"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="phone_number"
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                                autoComplete="tel"
                                                placeholder="+7 (999) 234-55-72"
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ПАРОЛЬ</label>
                                            <input
                                                type="password"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ПОВТОРИТЕ ПАРОЛЬ</label>
                                            <input
                                                type="password"
                                                className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                                name="re_password"
                                                value={formData.re_password}
                                                onChange={handleChange}
                                                required
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-3 fw-semibold shadow-sm mb-4 rounded-pill">
                                        {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Создать аккаунт'}
                                    </button>
                                </fieldset>

                                <div className="text-center">
                                    <span className="text-muted small">Уже есть профиль? </span>
                                    <Link to="/login" className="text-primary small fw-bold text-decoration-none hover-primary transition-all">
                                        Войти
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
