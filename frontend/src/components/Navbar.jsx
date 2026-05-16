import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitial = () => {
        if (user?.username) return user.username.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light navbar-glass sticky-top">
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center fw-bold fs-4" to="/" onClick={handleScrollToTop} style={{ color: 'var(--text-dark)' }}>
                    <div className="d-flex align-items-center justify-content-center text-white me-2 shadow-sm" style={{
                        width: '42px', height: '42px', background: 'var(--primary)', borderRadius: '14px'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    Coworking<span style={{ color: 'var(--primary)' }}>Booking</span>
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-center ms-lg-4">
                        <li className="nav-item me-2">
                            <Link className="nav-link nav-link-custom" to="/" onClick={handleScrollToTop}>Главная</Link>
                        </li>
                        <li className="nav-item me-3">
                            <Link className="nav-link nav-link-custom" to="/">О сервисе</Link>
                        </li>
                    </ul>

                    <div className="d-flex align-items-center mt-3 mt-lg-0" ref={dropdownRef}>
                        {loading ? (
                            <div className="d-flex align-items-center p-1 pe-3 bg-light rounded-pill" style={{ width: '170px', height: '46px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                <div className="rounded-circle bg-secondary bg-opacity-25 placeholder-glow" style={{ width: '38px', height: '38px', flexShrink: 0 }}></div>
                                <div className="bg-secondary bg-opacity-25 ms-2 rounded placeholder-glow w-100" style={{ height: '12px' }}></div>
                            </div>
                        ) : user ? (
                            <div className="position-relative">
                                <div 
                                    className="d-flex align-items-center p-1 pe-3 bg-white rounded-pill user-profile-pill" 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold flex-shrink-0" style={{ width: '38px', height: '38px', fontSize: '16px' }}>
                                        {getInitial()}
                                    </div>
                                    <span className="fw-semibold small text-truncate pe-2" style={{ color: 'var(--text-dark)', maxWidth: '120px' }}>
                                        {user?.username || 'Пользователь'}
                                    </span>
                                    <svg className="text-muted flex-shrink-0 ms-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>

                                {dropdownOpen && (
                                    <div className="dropdown-menu show dropdown-menu-custom position-absolute end-0 mt-3 fade-in" style={{ minWidth: '240px', zIndex: 1050 }}>
                                        <div className="px-4 py-3 border-bottom mb-2 bg-light" style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
                                            <p className="mb-0 fw-bold fs-6">{user?.username || 'Пользователь'}</p>
                                            <p className="mb-0 small text-muted text-truncate">{user?.email || 'Загрузка...'}</p>
                                        </div>
                                        <Link className="dropdown-item dropdown-item-custom fw-medium text-muted d-flex align-items-center" to="/" onClick={() => setDropdownOpen(false)}>
                                            <svg className="me-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            Мой профиль
                                        </Link>
                                        <Link className="dropdown-item dropdown-item-custom fw-medium text-muted d-flex align-items-center mt-1" to="/" onClick={() => setDropdownOpen(false)}>
                                            <svg className="me-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            Мои бронирования
                                        </Link>
                                        <hr className="dropdown-divider my-2 opacity-10" />
                                        <button className="dropdown-item dropdown-item-custom fw-bold text-danger d-flex align-items-center" onClick={handleLogout}>
                                            <svg className="me-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                            Выйти из аккаунта
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link className="btn btn-primary shadow-sm fw-semibold" to="/login">
                                Войти
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;