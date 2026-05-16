import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white border-top mt-auto py-3" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-muted">
                    <div className="d-flex align-items-center flex-wrap justify-content-center justify-content-md-start gap-2">
                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center text-white me-2 shadow-sm" style={{
                                width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '8px'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <span className="fw-bold text-dark">Coworking<span style={{ color: 'var(--primary)' }}>Booking</span></span>
                        </div>
                        <span>•</span>
                        <span>&copy; {new Date().getFullYear()} Все права защищены.</span>
                    </div>

                    <div>
                        <a href="mailto:support@coworkingbooking.ru" className="text-muted text-decoration-none hover-primary transition-all">support@coworkingbooking.ru</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;