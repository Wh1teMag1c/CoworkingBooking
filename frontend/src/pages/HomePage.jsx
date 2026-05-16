import {useEffect, useState} from 'react';
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
            <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
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
        <div className="container mt-4 mb-5">
            <h2 className="mb-4 fw-bold">Доступные переговорные</h2>

            {rooms.length === 0 ? (
                <div className="alert alert-info shadow-sm border-0">
                    В данный момент нет доступных переговорных. Зайдите в админку Django и создайте пару штук!
                </div>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {rooms.map(room => (
                        <div className="col" key={room.id}>
                            <div className="card h-100 shadow-sm border-0 hover-effect">
                                <img
                                    src={room.images && room.images.length > 0
                                        ? room.images[0].image
                                        : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=60'}
                                    className="card-img-top"
                                    alt={room.name}
                                    style={{height: '220px', objectFit: 'cover'}}
                                />
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title mb-0 fw-bold">{room.name}</h5>
                                        <span className="badge bg-primary fs-6">₽ {room.price_per_hour}/ч</span>
                                    </div>

                                    <p className="text-muted small mb-3">
                                        📍 {room.address} • Этаж {room.floor}
                                        {room.category && ` • ${room.category.name}`}
                                    </p>

                                    <p className="card-text text-truncate">{room.description}</p>

                                    <div className="d-flex flex-wrap gap-2 mb-3 mt-auto">
                                        <span className="badge bg-light text-dark border">
                                            👤 до {room.capacity} чел.
                                        </span>
                                        {room.average_rating > 0 && (
                                            <span className="badge bg-warning text-dark">
                                                ⭐ {room.average_rating}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        {room.amenities.map(amenity => (
                                            <span key={amenity.id} className="badge bg-secondary me-1 mb-1">
                                                {/* Если у удобства есть иконка bootstrap, она выведется */}
                                                {amenity.icon && <i className={`${amenity.icon} me-1`}></i>}
                                                {amenity.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-footer bg-white border-top-0 pt-0">
                                    <button 
                                        className="btn btn-outline-primary w-100 fw-bold"
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