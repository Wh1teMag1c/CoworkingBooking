import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const BookingModal = ({ room, show, onClose }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [attendeesCount, setAttendeesCount] = useState(1);
    const [comment, setComment] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!show) return null;

    // Редирект, если не авторизован
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post('bookings/', {
                room: room.id,
                start_time: startTime,
                end_time: endTime,
                attendees_count: attendeesCount,
                comment: comment
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setStartTime('');
                setEndTime('');
                setAttendeesCount(1);
                setComment('');
            }, 2000);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                const data = err.response.data;
                const messages = [];
                for (const key in data) {
                    messages.push(Array.isArray(data[key]) ? data[key].join(' ') : data[key]);
                }
                setError(messages.join(' '));
            } else {
                setError("Произошла ошибка при бронировании.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Бронирование: {room?.name}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {success ? (
                            <div className="alert alert-success text-center border-0 shadow-sm">
                                Успешно забронировано!
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && <div className="alert alert-danger border-0 shadow-sm">{error}</div>}
                                
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Время начала</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-control bg-light" 
                                        value={startTime} 
                                        onChange={(e) => setStartTime(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Время окончания</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-control bg-light" 
                                        value={endTime} 
                                        onChange={(e) => setEndTime(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Кол-во участников</label>
                                    <input 
                                        type="number" 
                                        className="form-control bg-light" 
                                        min="1"
                                        max={room?.capacity || 1}
                                        value={attendeesCount} 
                                        onChange={(e) => setAttendeesCount(e.target.value)} 
                                        required 
                                    />
                                    <div className="form-text">Максимум {room?.capacity} чел.</div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Комментарий (необязательно)</label>
                                    <textarea 
                                        className="form-control bg-light" 
                                        rows="2" 
                                        value={comment} 
                                        onChange={(e) => setComment(e.target.value)}
                                    ></textarea>
                                </div>
                                
                                <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={loading}>
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    ) : null}
                                    {loading ? 'Отправка...' : 'Подтвердить бронирование'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
