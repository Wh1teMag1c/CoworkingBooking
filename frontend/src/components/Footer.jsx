import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-top mt-auto py-4" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center justify-content-center text-white me-2 shadow-sm" style={{
                            width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '10px'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                        <span className="fw-bold fs-5 text-dark">Coworking<span style={{ color: 'var(--primary)' }}>Booking</span></span>
                    </div>
                    
                    <ul className="list-inline mb-0 small fw-medium text-center text-md-end">
                        <li className="list-inline-item me-4">
                            <Link to="/" className="text-muted text-decoration-none hover-primary transition-all">Главная</Link>
                        </li>
                        <li className="list-inline-item me-4">
                            <Link to="/" className="text-muted text-decoration-none hover-primary transition-all">О сервисе</Link>
                        </li>
                        <li className="list-inline-item me-4">
                            <Link to="/" className="text-muted text-decoration-none hover-primary transition-all">Контакты</Link>
                        </li>
                        <li className="list-inline-item">
                            <a href="mailto:support@coworkingbooking.ru" className="text-muted text-decoration-none hover-primary transition-all">Поддержка</a>
                        </li>
                    </ul>
                </div>
                
                <hr className="my-4" style={{ opacity: 0.05 }} />
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-muted">
                    <p className="mb-0 text-center text-md-start">&copy; {new Date().getFullYear()} CoworkingBooking. Все права защищены.</p>
                    <div className="mt-3 mt-md-0 d-flex gap-4">
                        <Link to="/" className="text-muted text-decoration-none hover-primary transition-all">Политика конфиденциальности</Link>
                        <Link to="/" className="text-muted text-decoration-none hover-primary transition-all">Условия использования</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
