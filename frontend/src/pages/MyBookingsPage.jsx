import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import api from '../api';
import {
    ArrowRight,
    CalendarCheck,
    CheckAll,
    CheckCircle,
    CheckCircleFill,
    Clock,
    CreditCard,
    ExclamationCircleFill,
    ExclamationTriangleFill,
    GeoAlt,
    HourglassSplit,
    JournalText,
    People,
    XCircle
} from 'react-bootstrap-icons';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('active');
    const [loading, setLoading] = useState(true);
    const [cancelModal, setCancelModal] = useState({show: false, bookingId: null});
    const [paymentModal, setPaymentModal] = useState({show: false, bookingId: null, price: null, loading: false});
    const [toast, setToast] = useState({show: false, message: '', type: 'success'});

    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({show: true, message, type});
        setTimeout(() => {
            setToast({show: false, message: '', type: 'success'});
        }, 4000);
    };

    const fetchMyBookings = async () => {
        try {
            const response = await api.get('bookings/');
            const sorted = response.data.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            setBookings(sorted);
        } catch (err) {
            console.error('Ошибка при загрузке бронирований', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchMyBookings();
    }, []);

    const openCancelModal = (id) => {
        setCancelModal({show: true, bookingId: id});
    };

    const closeCancelModal = () => {
        setCancelModal({show: false, bookingId: null});
    };

    const openPaymentModal = (id, price) => {
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setPaymentModal({show: true, bookingId: id, price: price, loading: false});
    };

    const closePaymentModal = () => {
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setPaymentModal({show: false, bookingId: null, price: null, loading: false});
    };

    const confirmCancel = async () => {
        const id = cancelModal.bookingId;
        const targetBooking = bookings.find(b => b.id === id);
        const wasConfirmed = targetBooking?.status === 'confirmed';

        try {
            await api.patch(`bookings/${id}/`, {status: 'canceled'});
            setBookings(bookings.map(b => b.id === id ? {...b, status: 'canceled'} : b));
            closeCancelModal();

            if (wasConfirmed) {
                showToast('Бронь отменена, деньги поступят обратно на счёт в течение 3-х рабочих дней.', 'info');
            } else {
                showToast('Бронирование успешно отменено.', 'success');
            }
        } catch (err) {
            alert('Не удалось отменить бронирование');
            closeCancelModal();
        }
    };

    const handleSimulatePayment = async (e) => {
        e.preventDefault();
        setPaymentModal(prev => ({...prev, loading: true}));

        const id = paymentModal.bookingId;
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await api.patch(`bookings/${id}/`, {status: 'confirmed'});
            setBookings(bookings.map(b => b.id === id ? {...b, status: 'confirmed'} : b));
            closePaymentModal();
            showToast('Оплата прошла успешно! Бронирование подтверждено.', 'success');
        } catch (err) {
            alert('Ошибка при проведении платежа');
            setPaymentModal(prev => ({...prev, loading: false}));
        }
    };

    const handleCardNumberChange = (e) => {
        const input = e.target.value.replace(/\D/g, '');
        const formatted = input.match(/.{1,4}/g)?.join(' ') || '';
        setCardNumber(formatted.substring(0, 19));
    };

    const handleCardExpiryChange = (e) => {
        const input = e.target.value.replace(/\D/g, '');
        if (input.length > 2) {
            setCardExpiry(`${input.substring(0, 2)}/${input.substring(2, 4)}`);
        } else {
            setCardExpiry(input);
        }
    };

    const handleCardCvcChange = (e) => {
        const input = e.target.value.replace(/\D/g, '');
        setCardCvc(input.substring(0, 3));
    };

    const isBookingActive = (b) => {
        const isPast = new Date(b.end_time) < new Date();
        return !isPast && b.status !== 'canceled';
    };

    const filteredBookings = bookings.filter(b => {
        return filter === 'active' ? isBookingActive(b) : !isBookingActive(b);
    });

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('ru-RU', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getRoomImageUrl = (roomDetails) => {
        if (roomDetails?.images && roomDetails.images.length > 0) {
            const imgPath = roomDetails.images[0].image;
            return imgPath.startsWith('http') ? imgPath : `http://127.0.0.1:8000${imgPath}`;
        }
        return 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';
    };

    return (
        <>
            {toast.show && createPortal(
                <div
                    className="position-fixed top-0 end-0 m-4 p-3 bg-white shadow-lg border-start border-4 rounded-4 fade-in d-flex align-items-center gap-3"
                    style={{
                        zIndex: 3000,
                        borderColor: toast.type === 'success' ? 'var(--success)' : 'var(--primary)',
                        borderRadius: '16px',
                        maxWidth: '400px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }}>
                    {toast.type === 'success' ? (
                        <CheckCircle className="text-success flex-shrink-0" size={24}/>
                    ) : (
                        <ExclamationCircleFill className="text-primary flex-shrink-0" size={24}/>
                    )}
                    <div className="fw-semibold text-dark small">{toast.message}</div>
                </div>,
                document.body
            )}

            <div className="container py-5 fade-in">
                <div className="d-flex align-items-center gap-3 mb-5 text-start">
                    <div className="p-3 rounded-4 bg-white shadow-sm d-flex align-items-center justify-content-center"
                         style={{width: '64px', height: '64px'}}>
                        <CalendarCheck size={32} className="text-primary"/>
                    </div>
                    <div>
                        <h1 className="fw-800 mb-0 text-dark">Мои бронирования</h1>
                        <p className="text-muted mb-0 small">Управляйте вашими запланированными встречами и историей</p>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-5 bg-light p-1 rounded-pill border d-inline-flex text-start">
                    <button
                        className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${filter === 'active' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
                        onClick={() => setFilter('active')}
                    >
                        Активные ({bookings.filter(isBookingActive).length})
                    </button>
                    <button
                        className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${filter === 'archive' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
                        onClick={() => setFilter('archive')}
                    >
                        Архив ({bookings.filter(b => !isBookingActive(b)).length})
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div
                        className="text-center py-5 bg-white rounded-5 shadow-sm border border-secondary border-opacity-10 p-5"
                        style={{borderRadius: '24px'}}>
                        <div className="mb-4 opacity-25 text-primary">
                            {filter === 'active' ? <CalendarCheck size={60}/> : <JournalText size={60}/>}
                        </div>
                        <h4 className="fw-bold text-dark">
                            {filter === 'active' ? 'Активных броней пока нет' : 'История пуста'}
                        </h4>
                        <p className="text-muted mb-4">
                            {filter === 'active'
                                ? 'Самое время запланировать новую рабочую сессию или встречу!'
                                : 'Здесь будут храниться ваши прошедшие бронирования.'}
                        </p>
                        {filter === 'active' && (
                            <button className="btn btn-primary px-4 py-2 rounded-pill fw-bold"
                                    onClick={() => navigate('/')}>
                                Найти переговорную <ArrowRight className="ms-2"/>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {filteredBookings.map(booking => {
                            const isPast = new Date(booking.end_time) < new Date();
                            const isArchived = !isBookingActive(booking);

                            return (
                                <div key={booking.id}
                                     className="bg-white border-0 p-4 rounded-4 shadow-sm position-relative transition-all text-start"
                                     style={{borderRadius: '20px', opacity: isArchived ? 0.75 : 1}}>
                                    <div className="row g-4 align-items-center">

                                        <div className="col-lg-3 d-none d-lg-block">
                                            <img
                                                src={getRoomImageUrl(booking.room_details)}
                                                alt={booking.room_name}
                                                className="img-fluid rounded-4 shadow-sm"
                                                style={{
                                                    height: '140px',
                                                    width: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '16px'
                                                }}
                                            />
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                                                <h3 className={`fw-800 mb-0 ${isArchived ? 'text-muted' : 'text-dark'} fs-4`}>
                                                    {booking.room_name}
                                                </h3>

                                                {booking.status === 'canceled' ? (
                                                    <span
                                                        className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-bold small border-0 d-inline-flex align-items-center gap-1">
                                                        <ExclamationTriangleFill size={12}/> Отменено
                                                    </span>
                                                ) : isPast ? (
                                                    <span
                                                        className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill fw-bold small border-0 d-inline-flex align-items-center gap-1">
                                                        <CheckAll size={12}/> Завершено
                                                    </span>
                                                ) : booking.status === 'pending' ? (
                                                    <span
                                                        className="badge px-3 py-2 rounded-pill fw-bold small border-0 d-inline-flex align-items-center gap-1"
                                                        style={{
                                                            backgroundColor: 'var(--primary-soft)',
                                                            color: 'var(--primary-dark)'
                                                        }}>
                                                        <HourglassSplit size={12}/> Ожидает оплаты
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold small border-0 d-inline-flex align-items-center gap-1">
                                                        <CheckCircleFill size={12}/> Подтверждено
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-muted mb-3 d-flex align-items-center gap-2 small">
                                                <GeoAlt className={isArchived ? "text-muted" : "text-primary"}/>
                                                {booking.room_details?.address} • {booking.room_details?.floor} этаж
                                            </p>

                                            <div className="d-flex flex-wrap gap-2 mb-1">
                                                <div
                                                    className="badge bg-light text-muted border border-secondary border-opacity-15 px-3 py-2 fw-medium d-inline-flex align-items-center gap-2"
                                                    style={{borderRadius: '12px'}}>
                                                    <Clock size={14} className="text-primary"/>
                                                    <span className="small text-dark">
                                                        {formatDate(booking.start_time)}, <strong>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</strong>
                                                    </span>
                                                </div>
                                                <div
                                                    className="badge bg-light text-muted border border-secondary border-opacity-15 px-3 py-2 fw-medium d-inline-flex align-items-center gap-2"
                                                    style={{borderRadius: '12px'}}>
                                                    <People size={14} className="text-primary"/>
                                                    <span className="small text-dark">
                                                        Вместимость: <strong>до {booking.room_details?.capacity} чел.</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            {booking.comment && (
                                                <div className="mt-3 py-2 px-3 text-dark small" style={{
                                                    backgroundColor: '#f8fafc',
                                                    borderLeft: '4px solid var(--primary)',
                                                    borderRadius: '4px 12px 12px 4px'
                                                }}>
                                                    <div className="fw-semibold text-dark">{booking.comment}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="col-lg-3 text-lg-end d-flex flex-column align-items-lg-end justify-content-center gap-3">
                                            {booking.total_price && (
                                                <div className="text-lg-end">
                                                    <div className="text-muted small fw-medium mb-1">Стоимость аренды
                                                    </div>
                                                    <div className="text-primary fw-800 fs-4">{booking.total_price} ₽
                                                    </div>
                                                </div>
                                            )}

                                            <div className="d-flex gap-2 justify-content-end flex-wrap">
                                                {booking.status === 'pending' && !isPast && (
                                                    <button
                                                        className="btn btn-primary btn-sm px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1 w-auto border-0 text-white"
                                                        style={{fontSize: '0.8rem'}}
                                                        onClick={() => openPaymentModal(booking.id, booking.total_price)}
                                                    >
                                                        <CreditCard size={14}/> Оплатить
                                                    </button>
                                                )}

                                                {filter === 'active' && booking.status !== 'canceled' && (
                                                    <button
                                                        className="btn btn-outline-danger btn-sm px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1 w-auto"
                                                        style={{fontSize: '0.8rem'}}
                                                        onClick={() => openCancelModal(booking.id)}
                                                    >
                                                        <XCircle size={14}/> Отменить
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {cancelModal.show && createPortal(
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, backdropFilter: 'blur(8px)'}}>
                    <div className="bg-white p-4 p-md-5 text-center mx-3 fade-in"
                         style={{
                             borderRadius: '28px',
                             maxWidth: '450px',
                             width: '100%'
                         }}>
                        <div className="mb-4">
                            <ExclamationCircleFill size={60} className="text-danger opacity-75"/>
                        </div>
                        <h3 className="fw-800 mb-3 text-dark">Отменить бронь?</h3>
                        <p className="text-muted mb-4 small">
                            Это действие нельзя будет отменить. Вы уверены, что хотите освободить выбранный временной
                            слот?
                        </p>
                        <div className="d-flex gap-3">
                            <button className="btn btn-light w-100 py-3 fw-bold rounded-pill"
                                    onClick={closeCancelModal}>
                                Назад
                            </button>
                            <button className="btn btn-danger w-100 py-3 fw-bold rounded-pill" onClick={confirmCancel}>
                                Да, отменить
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {paymentModal.show && createPortal(
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, backdropFilter: 'blur(8px)'}}>
                    <div className="bg-white p-4 p-md-5 mx-3 fade-in text-start"
                         style={{
                             borderRadius: '28px',
                             maxWidth: '480px',
                             width: '100%'
                         }}>
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <CreditCard size={28}/>
                            </div>
                            <div>
                                <h3 className="fw-800 mb-0 text-dark">Оплата аренды</h3>
                            </div>
                        </div>

                        <div className="p-3 bg-light rounded-4 mb-4 d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-secondary small text-uppercase">К оплате:</span>
                            <span className="text-primary fw-800 fs-4">{paymentModal.price} ₽</span>
                        </div>

                        <form onSubmit={handleSimulatePayment}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Номер карты</label>
                                <input type="text" className="form-control custom-input bg-light border-0"
                                       placeholder="0000 0000 0000 0000" disabled={paymentModal.loading} required
                                       value={cardNumber} onChange={handleCardNumberChange}
                                       maxLength="19" autoComplete="cc-number"/>
                            </div>
                            <div className="row g-3 mb-4">
                                <div className="col-6">
                                    <label className="form-label small fw-bold text-muted">Срок действия</label>
                                    <input type="text" className="form-control custom-input bg-light border-0"
                                           placeholder="ММ/ГГ" disabled={paymentModal.loading} required
                                           value={cardExpiry} onChange={handleCardExpiryChange}
                                           maxLength="5" autoComplete="cc-exp"/>
                                </div>
                                <div className="col-6">
                                    <label className="form-label small fw-bold text-muted">CVC / CVV</label>
                                    <input type="password" className="form-control custom-input bg-light border-0"
                                           placeholder="***" disabled={paymentModal.loading} required
                                           value={cardCvc} onChange={handleCardCvcChange}
                                           maxLength="3" autoComplete="cc-csc"/>
                                </div>
                            </div>

                            <div className="d-flex gap-3">
                                <button type="button" className="btn btn-light w-100 py-3 fw-bold rounded-pill"
                                        onClick={closePaymentModal} disabled={paymentModal.loading}>
                                    Отмена
                                </button>
                                <button type="submit"
                                        className="btn btn-primary w-100 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2"
                                        disabled={paymentModal.loading}>
                                    {paymentModal.loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            <span>Проведение...</span>
                                        </>
                                    ) : (
                                        <span>Подтвердить</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MyBookingsPage;