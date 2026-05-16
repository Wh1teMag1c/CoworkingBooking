import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import BookingModal from '../components/BookingModal';
import {
    ArrowCounterclockwise,
    ArrowRight,
    Check2,
    Check2Circle,
    ExclamationCircleFill,
    Funnel,
    Layers,
    People,
    Search
} from 'react-bootstrap-icons';

const HomePage = () => {
    const navigate = useNavigate();
    const filterSectionRef = useRef(null);

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [capacityFilter, setCapacityFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState([]);

    const [priceRange, setPriceRange] = useState([0, 5000]);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAuthToast, setShowAuthToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('rooms/');
                setRooms(response.data);
            } catch (err) {
                setError("Не удалось загрузить список переговорных.");
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    const uniqueCategories = useMemo(() => {
        const cats = new Map();
        rooms.forEach(room => {
            if (room.category) {
                cats.set(room.category.id, room.category);
            }
        });
        return Array.from(cats.values());
    }, [rooms]);

    const maxPossiblePrice = useMemo(() => {
        if (rooms.length === 0) return 5000;
        return Math.max(...rooms.map(r => parseFloat(r.price_per_hour)));
    }, [rooms]);

    useEffect(() => {
        setPriceRange([0, maxPossiblePrice]);
    }, [maxPossiblePrice]);

    const uniqueAmenities = useMemo(() => {
        const ams = new Map();
        rooms.forEach(room => {
            if (room.amenities) {
                room.amenities.forEach(a => {
                    ams.set(a.id, a);
                });
            }
        });
        return Array.from(ams.values());
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        let result = rooms.filter(r => r.is_active);

        if (activeCategory) {
            result = result.filter(r => r.category && r.category.id.toString() === activeCategory.toString());
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.name.toLowerCase().includes(lowerTerm) ||
                r.address.toLowerCase().includes(lowerTerm)
            );
        }

        if (capacityFilter) {
            result = result.filter(r => r.capacity >= parseInt(capacityFilter, 10));
        }

        if (priceRange[0] > 0 || priceRange[1] < maxPossiblePrice) {
            result = result.filter(r => {
                const price = parseFloat(r.price_per_hour);
                return price >= priceRange[0] && price <= priceRange[1];
            });
        }

        if (levelFilter) {
            result = result.filter(r => r.floor.toString() === levelFilter.toString());
        }

        if (selectedAmenities.length > 0) {
            result = result.filter(r => {
                const roomAmenityIds = r.amenities.map(a => a.id);
                return selectedAmenities.every(id => roomAmenityIds.includes(id));
            });
        }

        return result;
    }, [rooms, activeCategory, searchTerm, capacityFilter, priceRange, levelFilter, selectedAmenities, maxPossiblePrice]);

    const handleBookClick = (room) => {
        const token = localStorage.getItem('access');
        if (!token) {
            if (showAuthToast) return;
            setShowAuthToast(true);
            setTimeout(() => {
                setShowAuthToast(false);
                navigate('/login');
            }, 2000);
            return;
        }
        setSelectedRoom(room);
        setShowModal(true);
    };

    const scrollToFilters = () => {
        if (filterSectionRef.current) {
            const yOffset = -100;
            const element = filterSectionRef.current;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setActiveCategory('');
        setCapacityFilter('');
        setPriceRange([0, maxPossiblePrice]);
        setLevelFilter('');
        setSelectedAmenities([]);
    };

    const toggleAmenity = (id) => {
        setSelectedAmenities(prev =>
            prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
        );
    };

    const isFiltered = searchTerm || activeCategory || capacityFilter || priceRange[0] > 0 || priceRange[1] < maxPossiblePrice || levelFilter || selectedAmenities.length > 0;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in position-relative">
            {showAuthToast && createPortal(
                <div className="position-fixed top-0 start-50 translate-middle-x mt-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white border-0 shadow-lg p-3 d-flex align-items-center gap-3 fade-in"
                        style={{ borderRadius: '16px', borderLeft: '5px solid #ffc107', minWidth: '320px' }}>
                        <ExclamationCircleFill size={28} className="text-warning" />
                        <div className="text-start">
                            <div className="fw-bold text-dark">Требуется вход</div>
                            <div className="text-muted small">Войдите в систему для бронирования</div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showSuccessToast && createPortal(
                <div className="position-fixed top-0 start-50 translate-middle-x mt-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white border-0 shadow-lg p-3 d-flex align-items-center gap-3 fade-in"
                        style={{ borderRadius: '16px', borderLeft: '5px solid #10b981', minWidth: '320px' }}>
                        <Check2Circle size={28} className="text-success" />
                        <div className="text-start">
                            <div className="fw-bold text-dark">Бронь подтверждена!</div>
                            <div className="text-muted small">Ждем вас в переговорной</div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="hero-section fade-in-up">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
                            <h1 className="hero-title">Идеальное пространство для продуктивности</h1>
                            <p className="hero-subtitle">
                                Бронируйте стильные переговорные и премиальные рабочие места.
                                Современный дизайн, стабильный Wi-Fi и абсолютный комфорт для ваших лучших идей.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <button className="btn btn-primary btn-lg" onClick={scrollToFilters}>Найти переговорную</button>
                                <button className="btn btn-outline-primary btn-lg" onClick={() => navigate('/about')}>Подробнее</button>
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
            </div>

            <div className="container py-5">
                <div ref={filterSectionRef} className="filter-card mb-5 border-0 shadow-lg p-4 p-md-5 rounded-4" style={{ borderRadius: '24px' }}>
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                        <h5 className="fw-bold d-flex align-items-center mb-0 text-start text-dark">
                            <Funnel className="me-2 text-primary" /> Подбор помещения
                            <span className="ms-3 badge bg-light text-primary border border-secondary border-opacity-25 fw-normal py-2 px-3 rounded-pill"
                                style={{ fontSize: '0.8rem' }}>
                                Найдено: {filteredRooms.length}
                            </span>
                        </h5>
                        {isFiltered && (
                            <button className="btn btn-link text-primary p-0 text-decoration-none small fw-bold fade-in d-flex align-items-center"
                                onClick={resetFilters}>
                                <ArrowCounterclockwise className="me-1" /> Сбросить все
                            </button>
                        )}
                    </div>

                    <div className="row g-3 text-start mb-4">
                        <div className="col-lg-5">
                            <label className="form-label text-muted small fw-bold d-flex align-items-center mb-2">ПОИСК ЛОКАЦИИ</label>
                            <div className="position-relative">
                                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <input type="text" className="form-control custom-input ps-5 bg-light border border-secondary border-opacity-25"
                                    placeholder="Название или адрес..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>

                        <div className="col-lg-2 col-md-4">
                            <label className="form-label text-muted small fw-bold d-flex align-items-center mb-2">ЭТАЖ</label>
                            <div className="position-relative">
                                <Layers className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <input type="number" className="form-control custom-input ps-5 bg-light border border-secondary border-opacity-25"
                                    placeholder="№" min="0" value={levelFilter} onChange={e => setLevelFilter(e.target.value)} />
                            </div>
                        </div>

                        <div className="col-lg-2 col-md-4">
                            <label className="form-label text-muted small fw-bold d-flex align-items-center mb-2">МЕСТ ОТ</label>
                            <div className="position-relative">
                                <People className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <input type="number" className="form-control custom-input ps-5 bg-light border border-secondary border-opacity-25"
                                    placeholder="0" min="1" value={capacityFilter} onChange={e => setCapacityFilter(e.target.value)} />
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <label className="form-label text-muted small fw-bold d-flex align-items-center mb-2">ДИАПАЗОН ЦЕН (₽/ч)</label>
                            <div className="px-3 pt-2 pb-1 bg-light border border-secondary border-opacity-25" style={{ borderRadius: '14px', height: '46px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Slider
                                    range
                                    min={0}
                                    max={maxPossiblePrice}
                                    step={100}
                                    value={priceRange}
                                    onChange={(val) => setPriceRange(val)}
                                    trackStyle={[{ backgroundColor: 'var(--primary)', height: 6 }]}
                                    handleStyle={[
                                        { borderColor: 'var(--primary)', height: 18, width: 18, marginTop: -6, backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.15)' },
                                        { borderColor: 'var(--primary)', height: 18, width: 18, marginTop: -6, backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }
                                    ]}
                                    railStyle={{ backgroundColor: '#e2e8f0', height: 6 }}
                                />
                            </div>
                            <div className="d-flex justify-content-between mt-1 px-1">
                                <span className="small text-muted fw-bold">От {priceRange[0]} ₽</span>
                                <span className="small text-muted fw-bold">До {priceRange[1]} ₽</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center pt-4 border-top gap-3">
                        <div className="d-inline-flex gap-2 flex-wrap p-1 bg-light rounded-pill border border-secondary border-opacity-25">
                            <button onClick={() => setActiveCategory('')}
                                className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${!activeCategory ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}>
                                {!activeCategory && <Check2 className="me-2" />} Все типы
                            </button>
                            {uniqueCategories.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${activeCategory === cat.id ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}>
                                    {activeCategory === cat.id && <Check2 className="me-2" />} {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="dropdown" ref={dropdownRef}>
                            <button 
                                className="btn rounded-pill px-4 py-2 fw-bold transition-all btn-light text-muted border border-secondary border-opacity-25 d-flex justify-content-between align-items-center"
                                type="button" 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ minWidth: '200px' }}>
                                <span className="d-flex align-items-center">
                                    Удобства 
                                    {selectedAmenities.length > 0 && <span className="badge bg-primary ms-2 rounded-circle">{selectedAmenities.length}</span>}
                                </span>
                                <span className="text-muted ms-3" style={{ fontSize: '10px' }}>▼</span>
                            </button>
                            <ul className={`dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-3 fade-in ${isDropdownOpen ? 'show' : ''}`} style={{ borderRadius: '16px', minWidth: '240px', display: isDropdownOpen ? 'block' : 'none' }}>
                                {uniqueAmenities.map(amenity => (
                                    <li key={amenity.id} onClick={(e) => { e.stopPropagation(); toggleAmenity(amenity.id); }} style={{ cursor: 'pointer' }}>
                                        <div className="form-check p-2 m-0 rounded-3 d-flex align-items-center" style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-soft)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <input className="form-check-input ms-1 me-3 border-secondary" type="checkbox"
                                                checked={selectedAmenities.includes(amenity.id)} readOnly style={{ cursor: 'pointer' }} />
                                            <label className="form-check-label d-flex align-items-center text-dark fw-medium" style={{ cursor: 'pointer' }}>
                                                {amenity.icon && <i className={`${amenity.icon} me-2 text-primary fs-5`}></i>}
                                                {amenity.name}
                                            </label>
                                        </div>
                                    </li>
                                ))}
                                {uniqueAmenities.length === 0 && (
                                    <li className="text-muted small text-center p-2">Нет доступных удобств</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="row g-4 pb-5 min-vh-50">
                    {error ? (
                        <div className="col-12 text-center py-5">
                            <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4 d-inline-block">
                                {error}
                            </div>
                        </div>
                    ) : filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => (
                            <div key={room.id} className="col-md-6 col-lg-4 fade-in">
                                <div className="card h-100 hover-effect border-0 shadow-sm overflow-hidden" style={{ borderRadius: '24px' }}>
                                    <div className="position-relative overflow-hidden">
                                        <img
                                            src={room.images && room.images.length > 0 ? room.images[0].image : (room.preview || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80')}
                                            className="w-100 transition-transform"
                                            style={{ height: '240px', objectFit: 'cover' }}
                                            alt={room.name}
                                        />
                                        <div className="position-absolute top-0 end-0 m-3">
                                            <span className="badge bg-white text-dark shadow-sm py-2 px-3 rounded-pill fw-bold">
                                                👥 до {room.capacity} чел.
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column text-start">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h4 className="card-title mb-0 fw-bold">{room.name}</h4>
                                            <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-bold" style={{ backgroundColor: 'var(--primary-soft)' }}>
                                                ₽ {room.price_per_hour}/ч
                                            </span>
                                        </div>

                                        <p className="text-muted small mb-4 d-flex align-items-center gap-1">
                                            <span className="text-primary fs-5">📍</span> {room.address} • Этаж {room.floor}
                                        </p>

                                        <div className="mb-4">
                                            {room.amenities && room.amenities.map(amenity => (
                                                <span key={amenity.id} className="badge bg-light text-muted border border-secondary border-opacity-25 me-2 mb-2 px-2 py-1 fw-normal">
                                                    {amenity.icon && <i className={`${amenity.icon} me-1`}></i>}
                                                    {amenity.name}
                                                </span>
                                            ))}
                                        </div>

                                        <button
                                            className="btn btn-outline-primary w-100 fw-bold mt-auto rounded-pill py-2"
                                            onClick={() => handleBookClick(room)}
                                        >
                                            Забронировать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <div className="bg-white p-5 rounded-5 shadow-sm border border-secondary border-opacity-10 mx-auto"
                                style={{ maxWidth: '500px' }}>
                                <div className="mb-4 opacity-25"><Funnel size={60} /></div>
                                <h4 className="fw-bold text-dark">Ничего не найдено</h4>
                                <p className="text-muted mb-4">Попробуйте изменить параметры или сбросить фильтры.</p>
                                <button className="btn btn-outline-primary px-4 rounded-pill fw-bold"
                                    onClick={resetFilters}>
                                    <ArrowCounterclockwise className="me-2" /> Сбросить фильтры
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && selectedRoom && (
                <BookingModal
                    room={selectedRoom}
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    onBookingSuccess={() => {
                        setShowModal(false);
                        setShowSuccessToast(true);
                        setTimeout(() => {
                            setShowSuccessToast(false);
                        }, 3000);
                    }}
                />
            )}
        </div>
    );
};

export default HomePage;