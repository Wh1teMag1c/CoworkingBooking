import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Неверные данные. Проверьте логин и пароль.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center fade-in" style={{ minHeight: '80vh', padding: '4rem 0' }}>
            <div className="row justify-content-center w-100">
                <div className="col-md-6 col-lg-4">
                    <div className="card border-0 rounded-4 shadow-lg p-4 p-md-5" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
                        <div className="card-body p-0">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>Авторизация</h3>
                                <p className="text-muted small">Войдите, чтобы продолжить работу</p>
                            </div>

                            {error && (
                                <div className="alert alert-danger border-0 small text-center mb-4 rounded-3 bg-danger bg-opacity-10 text-danger fw-medium fade-in">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ЛОГИН</label>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold mb-2 ms-1" style={{ letterSpacing: '0.5px' }}>ПАРОЛЬ</label>
                                    <input
                                        type="password"
                                        className="form-control bg-light border-0 shadow-none px-3 py-3 rounded-3"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-3 fw-semibold shadow-sm mb-4 rounded-pill"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : 'Войти'}
                                </button>

                                <div className="text-center">
                                    <span className="text-muted small">Впервые здесь? </span>
                                    <Link to="/register" className="text-primary small fw-bold text-decoration-none hover-primary transition-all">
                                        Создать профиль
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

export default LoginPage;