import { useEffect, useState } from 'react';
import api from '../api';
import BookingModal from '../components/BookingModal';

const HomePage = () => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('rooms/');
                setRooms(response.data);
            } catch (err) {
                console.error("Ошибка при загрузке комнат:", err);
                setError("Не удалось загрузить список переговорных.");
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5 text-center text-danger">
                <h4>{error}</h4>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5 fade-in">
            <div className="hero-section fade-in-up">
                <div className="row align-items-center">
                    <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
                        <h1 className="hero-title">Идеальное пространство для продуктивности</h1>
                        <p className="hero-subtitle">
                            Бронируйте стильные переговорные и премиальные рабочие места.
                            Современный дизайн, стабильный Wi-Fi и абсолютный комфорт для ваших лучших идей.
                        </p>
                        <div className="d-flex flex-wrap gap-3">
                            <button className="btn btn-primary btn-lg">Найти переговорную</button>
                            <button className="btn btn-outline-primary btn-lg">Подробнее</button>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="hero-image-container">
                            <img 
                                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80" 
                                alt="Modern coworking" 
                                className="hero-image"
                            />
                            <div className="hero-teaser d-flex align-items-center gap-3">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '48px', height: '48px' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">100+ локаций</h6>
                                    <small className="text-muted">доступно для брони</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="filter-panel fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="row g-4 align-items-end">
                    <div className="col-md-3">
                        <label className="form-label fw-semibold text-muted small ms-1">Поиск локации</label>
                        <input type="text" className="form-control" placeholder="Название или адрес..." />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-semibold text-muted small ms-1">Категория</label>
                        <select className="form-select">
                            <option value="">Все категории</option>
                            <option value="1">Переговорная</option>
                            <option value="2">Конференц-зал</option>
                            <option value="3">Рабочее место</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-semibold text-muted small ms-1">Вместимость (от)</label>
                        <input type="number" className="form-control" placeholder="Количество человек" min="1" />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-semibold text-muted small ms-1">Макс. цена (₽/ч)</label>
                        <div className="d-flex gap-2">
                            <input type="number" className="form-control" placeholder="Цена..." />
                            <button className="btn btn-primary px-4 fw-bold">Найти</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-end mb-4 mt-5 fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="fw-bold mb-0">Популярные локации</h2>
            </div>

            {rooms.length === 0 ? (
                <div className="alert alert-info shadow-sm border-0 rounded-4 p-4 fade-in-up" style={{ animationDelay: '0.3s' }}>
                    В данный момент нет доступных переговорных.
                </div>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {rooms.map((room, index) => (
                        <div className="col fade-in-up" key={room.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                            <div className="card h-100 hover-effect">
                                <img
                                    src={room.images && room.images.length > 0
                                        ? room.images[0].image
                                        : 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80'}
                                    className="card-img-top"
                                    alt={room.name}
                                    style={{ height: '240px', objectFit: 'cover' }}
                                />
                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h4 className="card-title mb-0 fw-bold">{room.name}</h4>
                                        <span className="badge badge-custom badge-soft-primary">₽ {room.price_per_hour}/ч</span>
                                    </div>

                                    <p className="text-muted small mb-4 d-flex align-items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        {room.address} • Этаж {room.floor}
                                    </p>

                                    <p className="card-text text-truncate text-muted">{room.description}</p>

                                    <div className="d-flex flex-wrap gap-2 mb-4 mt-auto">
                                        <span className="badge badge-custom badge-soft-secondary d-flex align-items-center gap-1">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                            до {room.capacity} чел.
                                        </span>
                                        {room.average_rating > 0 && (
                                            <span className="badge badge-custom badge-soft-warning d-flex align-items-center gap-1">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                {room.average_rating}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        {room.amenities.map(amenity => (
                                            <span key={amenity.id} className="badge badge-custom badge-soft-secondary me-2 mb-2">
                                                {amenity.icon && <i className={`${amenity.icon} me-1`}></i>}
                                                {amenity.name}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        className="btn btn-outline-primary w-100 fw-bold mt-auto"
                                        onClick={() => {
                                            setSelectedRoom(room);
                                            setShowModal(true);
                                        }}
                                    >
                                        Забронировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <BookingModal 
                    room={selectedRoom} 
                    show={showModal} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </div>
    );
};

export default HomePage;