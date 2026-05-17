import React, {useCallback, useContext, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    CalendarCheck,
    CheckAll,
    CheckCircleFill,
    Clock,
    DoorOpen,
    ExclamationCircleFill,
    ExclamationTriangleFill,
    Eye,
    EyeSlash,
    GeoAlt,
    HourglassSplit,
    People,
    PersonDash,
    PersonPlus,
    ShieldLockFill,
    StarFill,
    Trash,
    XCircle
} from 'react-bootstrap-icons';
import api from '../api';
import {AuthContext} from '../context/AuthContext';

const AdminPage = () => {
    const {user: currentUser} = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('bookings');
    const [loading, setLoading] = useState(true);

    const [bookings, setBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('active');
    const [bookingsPage, setBookingsPage] = useState(1);
    const itemsPerPage = 10;

    const [rooms, setRooms] = useState([]);
    const [deleteModal, setDeleteModal] = useState({show: false, roomId: null, roomName: ''});

    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState('regular');

    const [cancelModal, setCancelModal] = useState({show: false, bookingId: null});
    const [toast, setToast] = useState({show: false, message: '', type: 'success'});

    const showToast = (message, type = 'success') => {
        setToast({show: true, message, type});
        setTimeout(() => {
            setToast({show: false, message: '', type: 'success'});
        }, 4000);
    };

    const fetchAllBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('bookings/?all=true');
            const sorted = res.data.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            setBookings(sorted);
        } catch (error) {
            console.error("Ошибка при загрузке бронирований", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('rooms/?all=true');
            setRooms(res.data);
        } catch (error) {
            console.error("Ошибка при загрузке комнат", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('users/');
            setUsers(res.data);
        } catch (error) {
            console.error("Ошибка при загрузке пользователей", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (activeTab === 'bookings') fetchAllBookings();
        if (activeTab === 'rooms') fetchRooms();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, fetchAllBookings, fetchRooms, fetchUsers]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.patch(`bookings/${id}/?all=true`, {status: newStatus});
            setBookings(bookings.map(b => b.id === id ? {...b, status: newStatus} : b));
        } catch (error) {
            alert('Ошибка при обновлении статуса');
        }
    };

    const handleToggleUserAdmin = async (targetUser, makeAdmin) => {
        try {
            const payload = makeAdmin
                ? {role: 'admin', is_staff: true}
                : {role: 'client', is_staff: false};

            await api.patch(`users/${targetUser.id}/`, payload);
            setUsers(users.map(u => u.id === targetUser.id ? {...u, ...payload} : u));
            showToast(makeAdmin ? `Пользователю @${targetUser.username} успешно назначены права администратора.` : `С пользователя @${targetUser.username} успешно сняты права администратора.`, 'success');
        } catch (error) {
            showToast('Не удалось изменить права доступа пользователя.', 'error');
        }
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});

    const isBookingPast = (endTime) => new Date(endTime) < new Date();

    const filteredBookings = bookings.filter(b => {
        const isPast = isBookingPast(b.end_time);
        if (bookingFilter === 'active') return !isPast && b.status !== 'canceled';
        if (bookingFilter === 'archive') return isPast || b.status === 'canceled';
        return true;
    }).sort((a, b) => {
        if (bookingFilter === 'active') {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(a.start_time) - new Date(b.start_time);
        }
        return new Date(b.start_time) - new Date(a.start_time);
    });

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const currentBookings = filteredBookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage);

    const setFilterWithPageReset = (newFilter) => {
        setBookingFilter(newFilter);
        setBookingsPage(1);
    };

    const isUserAdmin = (u) => u.role === 'admin' || u.role === 'manager' || u.is_staff === true;

    const filteredUsers = users.filter(u => {
        if (userFilter === 'admin') return isUserAdmin(u);
        if (userFilter === 'regular') return !isUserAdmin(u);
        return true;
    });

    const confirmCancelBooking = async () => {
        const id = cancelModal.bookingId;

        try {
            await api.patch(`bookings/${id}/?all=true`, {status: 'canceled'});
            setBookings(bookings.map(b => b.id === id ? {...b, status: 'canceled'} : b));
            closeCancelModal();
        } catch (error) {
            showToast('Не удалось отменить бронирование', 'error');
            closeCancelModal();
        }
    };

    const handleToggleRoomStatus = async (id, currentStatus) => {
        try {
            await api.patch(`rooms/${id}/?all=true`, {is_active: !currentStatus});
            setRooms(rooms.map(r => r.id === id ? {...r, is_active: !currentStatus} : r));
            showToast(!currentStatus ? 'Комната теперь доступна для бронирования.' : 'Комната скрыта от пользователей.', 'success');
        } catch (error) {
            showToast('Ошибка при изменении статуса комнаты.', 'error');
        }
    };

    const confirmDeleteRoom = async () => {
        const id = deleteModal.roomId;
        try {
            await api.delete(`rooms/${id}/?all=true`);
            setRooms(rooms.filter(r => r.id !== id));
            setDeleteModal({show: false, roomId: null, roomName: ''});
        } catch (error) {
            alert('Не удалось удалить комнату. Проверьте, нет ли в ней активных бронирований.');
            setDeleteModal({show: false, roomId: null, roomName: ''});
        }
    };

    return (
        <div className="container py-5 fade-in position-relative text-start">

            {toast.show && createPortal(
                <div
                    className="position-fixed top-0 end-0 m-4 p-3 bg-white shadow-lg border-start border-4 rounded-4 fade-in d-flex align-items-center gap-3"
                    style={{
                        zIndex: 3000,
                        borderColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--primary)',
                        borderRadius: '16px',
                        maxWidth: '400px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }}>
                    {toast.type === 'success' ? (
                        <CheckCircleFill className="text-success flex-shrink-0" size={24}/>
                    ) : toast.type === 'error' ? (
                        <ExclamationTriangleFill className="text-danger flex-shrink-0" size={24}/>
                    ) : (
                        <ExclamationCircleFill className="text-primary flex-shrink-0" size={24}/>
                    )}
                    <div className="fw-semibold text-dark small">{toast.message}</div>
                </div>,
                document.body
            )}

            {cancelModal.show && createPortal(
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, backdropFilter: 'blur(8px)'}}>
                    <div className="bg-white p-4 p-md-5 text-center mx-3 fade-in"
                         style={{borderRadius: '28px', maxWidth: '450px', width: '100%'}}>
                        <div className="mb-4">
                            <ExclamationCircleFill size={60} className="text-danger opacity-75"/>
                        </div>
                        <h3 className="fw-800 mb-3 text-dark">Отменить бронь?</h3>
                        <p className="text-muted mb-4 small">
                            Это действие нельзя будет отменить. При отмене оплаченной брони пользователю вернутся деньги
                            в течение 3-х рабочих дней. Вы уверены, что хотите отменить данное бронирование?
                        </p>
                        <div className="d-flex gap-3">
                            <button className="btn btn-light w-100 py-3 fw-bold rounded-pill"
                                    onClick={closeCancelModal}>Назад
                            </button>
                            <button className="btn btn-danger w-100 py-3 fw-bold rounded-pill"
                                    onClick={confirmCancelBooking}>Да, отменить
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {deleteModal.show && createPortal(
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, backdropFilter: 'blur(8px)'}}>
                    <div className="bg-white p-4 p-md-5 shadow-lg text-center mx-3"
                         style={{
                             borderRadius: '28px',
                             maxWidth: '450px',
                             width: '100%',
                             animation: 'fadeIn 0.3s ease'
                         }}>
                        <div className="mb-4">
                            <ExclamationCircleFill size={60} className="text-danger opacity-75"/>
                        </div>
                        <h3 className="fw-800 mb-3">Удалить комнату?</h3>
                        <p className="text-muted mb-4">
                            Вы собираетесь удалить <strong>{deleteModal.roomName}</strong>.
                            Это действие нельзя будет отменить, и все данные о помещении исчезнут.
                        </p>
                        <div className="d-flex gap-3">
                            <button className="btn btn-light w-100 py-3 fw-bold rounded-4"
                                    onClick={() => setDeleteModal({show: false, roomId: null, roomName: ''})}>
                                Назад
                            </button>
                            <button className="btn btn-danger w-100 py-3 fw-bold rounded-4" onClick={confirmDeleteRoom}>
                                Да, удалить
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="d-flex align-items-center gap-3 mb-5">
                <div className="p-3 rounded-4 shadow-sm text-white" style={{background: 'var(--primary)'}}>
                    <ShieldLockFill size={32}/>
                </div>
                <div>
                    <h1 className="fw-800 mb-0">Панель администратора</h1>
                    <p className="text-muted mb-0">Управление ресурсами платформы</p>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-3">
                    <div className="card border-0 shadow-sm p-3 rounded-4 bg-white sticky-top" style={{top: '100px'}}>
                        <div className="nav flex-column nav-pills gap-2">
                            <button
                                className={`nav-link rounded-3 text-start fw-bold d-flex align-items-center gap-3 py-3 px-4 border-0 transition-all ${activeTab === 'bookings' ? 'text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                                style={{backgroundColor: activeTab === 'bookings' ? 'var(--primary)' : 'transparent'}}
                                onClick={() => setActiveTab('bookings')}
                            >
                                <CalendarCheck size={20}/> Бронирования
                            </button>
                            <button
                                className={`nav-link rounded-3 text-start fw-bold d-flex align-items-center gap-3 py-3 px-4 border-0 transition-all ${activeTab === 'rooms' ? 'text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                                style={{backgroundColor: activeTab === 'rooms' ? 'var(--primary)' : 'transparent'}}
                                onClick={() => setActiveTab('rooms')}
                            >
                                <DoorOpen size={20}/> Переговорные
                            </button>
                            <button
                                className={`nav-link rounded-3 text-start fw-bold d-flex align-items-center gap-3 py-3 px-4 border-0 transition-all ${activeTab === 'users' ? 'text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                                style={{backgroundColor: activeTab === 'users' ? 'var(--primary)' : 'transparent'}}
                                onClick={() => setActiveTab('users')}
                            >
                                <People size={20}/> Пользователи
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-lg-9">

                    {activeTab === 'bookings' && (
                        <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white fade-in">
                            <h4 className="fw-bold mb-4 text-dark">Управление бронированиями</h4>

                            <div className="d-flex gap-2 mb-4 bg-light p-2 rounded-4 d-inline-flex border flex-wrap">
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${bookingFilter === 'active' ? 'btn-white bg-white shadow-sm text-dark' : 'btn-light text-muted border-0'}`}
                                    onClick={() => setFilterWithPageReset('active')}
                                >
                                    Активные
                                    ({bookings.filter(b => !isBookingPast(b.end_time) && b.status !== 'canceled').length})
                                </button>
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${bookingFilter === 'archive' ? 'btn-white bg-white shadow-sm text-dark' : 'btn-light text-muted border-0'}`}
                                    onClick={() => setFilterWithPageReset('archive')}
                                >
                                    Архив
                                    ({bookings.filter(b => isBookingPast(b.end_time) || b.status === 'canceled').length})
                                </button>
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${bookingFilter === 'all' ? 'btn-white bg-white shadow-sm text-dark' : 'btn-light text-muted border-0'}`}
                                    onClick={() => setFilterWithPageReset('all')}
                                >
                                    Все ({bookings.length})
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                </div>
                            ) : currentBookings.length === 0 ? (
                                <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                                    <CalendarCheck size={40} className="text-muted opacity-50 mb-3"/>
                                    <h5 className="fw-bold text-dark">Здесь пока пусто</h5>
                                </div>
                            ) : (
                                <>
                                    <div className="d-flex flex-column gap-3">
                                        {currentBookings.map(booking => {
                                            const isPast = isBookingPast(booking.end_time);
                                            const isArchived = isPast || booking.status === 'canceled';

                                            return (
                                                <div key={booking.id}
                                                     className={`p-4 rounded-4 border bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center transition-all ${isArchived ? 'opacity-75' : 'hover-border-primary'}`}>
                                                    <div>
                                                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                                            <h5 className={`fw-bold mb-0 ${isArchived ? 'text-muted' : 'text-dark'}`}>{booking.room_name}</h5>
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
                                                        <div className="text-muted small mb-3">
                                                            Пользователь: <strong
                                                            className={isArchived ? "text-muted" : "text-dark"}>@{booking.user_name}</strong>
                                                        </div>

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
                                                    </div>

                                                    {(booking.status === 'pending' || booking.status === 'confirmed') && !isPast && (
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap d-inline-flex align-items-center gap-1"
                                                                style={{fontSize: '0.8rem'}}
                                                                onClick={() => openCancelModal(booking.id)}>
                                                                <XCircle size={14}/> Отменить
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-center mt-5 gap-2">
                                            <button
                                                className="btn btn-outline-primary rounded-pill px-4 fw-bold"
                                                disabled={bookingsPage === 1}
                                                onClick={() => setBookingsPage(p => p - 1)}
                                            >
                                                Назад
                                            </button>
                                            <div
                                                className="d-flex align-items-center px-3 fw-bold text-muted bg-light rounded-pill">
                                                {bookingsPage} из {totalPages}
                                            </div>
                                            <button
                                                className="btn btn-outline-primary rounded-pill px-4 fw-bold"
                                                disabled={bookingsPage === totalPages}
                                                onClick={() => setBookingsPage(p => p + 1)}
                                            >
                                                Вперед
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white fade-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold text-dark mb-0">Фонд переговорных</h4>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                </div>
                            ) : rooms.length === 0 ? (
                                <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                                    <DoorOpen size={40} className="text-muted opacity-50 mb-3"/>
                                    <h5 className="fw-bold text-dark">Комнат пока нет</h5>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {rooms.map((room, index) => (
                                        <div key={room.id} className="col-md-6 fade-in-up"
                                             style={{animationDelay: `${0.1 + index * 0.05}s`}}>
                                            <div
                                                className="card h-100 hover-effect border-0 shadow-sm overflow-hidden d-flex flex-column"
                                                style={{borderRadius: '24px', opacity: room.is_active ? 1 : 0.7}}>
                                                <div className="position-relative overflow-hidden">
                                                    <img
                                                        src={room.images && room.images.length > 0 ? (room.images[0].image.startsWith('http') ? room.images[0].image : `http://127.0.0.1:8000${room.images[0].image}`) : '/placeholder.jpg'}
                                                        className="w-100 transition-transform"
                                                        style={{height: '240px', objectFit: 'cover'}}
                                                        alt={room.name}
                                                    />

                                                    {!room.is_active && (
                                                        <div
                                                            className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
                                                            <span
                                                                className="badge bg-danger fs-6 rounded-pill px-3 py-2 shadow-sm border border-danger border-opacity-25">Неактивна</span>
                                                        </div>
                                                    )}

                                                    {room.average_rating > 0 && (
                                                        <div className="position-absolute top-0 start-0 m-3">
                                                            <span
                                                                className="badge bg-white shadow-sm py-2 px-3 rounded-pill fw-bold d-inline-flex align-items-center gap-1"
                                                                style={{color: '#b45309'}}>
                                                                <StarFill size={14}
                                                                          className="text-warning"/> {room.average_rating}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="position-absolute top-0 end-0 m-3">
                                                        <span
                                                            className="badge bg-white text-dark shadow-sm py-2 px-3 rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                                            <People size={14}
                                                                    className="text-primary"/> до {room.capacity} чел.
                                                        </span>
                                                    </div>
                                                </div>

                                                <div
                                                    className="card-body p-4 d-flex flex-column text-start flex-grow-1">
                                                    <div className="mb-2" style={{minHeight: '52px'}}>
                                                        <h4 className="card-title mb-0 fw-bold" style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }} title={room.name}>{room.name}</h4>
                                                    </div>

                                                    <p className="text-muted small mb-4 d-flex align-items-start gap-2 flex-grow-1"
                                                       style={{minHeight: '40px'}}>
                                                        <GeoAlt className="flex-shrink-0 mt-1 text-primary" size={14}/>
                                                        <span style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }} title={`${room.address} • Этаж ${room.floor}`}>
                                                            {room.address} • Этаж {room.floor}
                                                        </span>
                                                    </p>

                                                    <div className="mb-3" style={{minHeight: '32px'}}>
                                                        {room.amenities && room.amenities.slice(0, 3).map(amenity => (
                                                            <span key={amenity.id}
                                                                  className="badge bg-light text-muted border border-secondary border-opacity-25 me-2 mb-2 px-2 py-1 fw-normal">
                                                                {amenity.icon &&
                                                                    <i className={`${amenity.icon} me-1`}></i>}
                                                                {amenity.name}
                                                            </span>
                                                        ))}
                                                        {room.amenities && room.amenities.length > 3 && (
                                                            <span
                                                                className="badge bg-light text-muted border border-secondary border-opacity-25 mb-2 px-2 py-1 fw-normal">
                                                                + ещё {room.amenities.length - 3}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div
                                                        className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top w-100 gap-2">
                                                        <div>
                                                            <span className="text-muted small d-block"
                                                                  style={{fontSize: '0.75rem', fontWeight: '600'}}>Цена аренды</span>
                                                            <span
                                                                className="text-primary fw-800 fs-5">₽ {room.price_per_hour}/ч</span>
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className={`btn ${room.is_active ? 'btn-outline-secondary' : 'btn-success'} fw-bold rounded-circle p-2 d-flex align-items-center justify-content-center`}
                                                                onClick={() => handleToggleRoomStatus(room.id, room.is_active)}
                                                                style={{width: '44px', height: '44px'}}
                                                                title={room.is_active ? "Скрыть комнату" : "Опубликовать комнату"}
                                                            >
                                                                {room.is_active ? <EyeSlash size={20}/> :
                                                                    <Eye size={20}/>}
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger fw-bold rounded-circle p-2 d-flex align-items-center justify-content-center"
                                                                onClick={() => setDeleteModal({
                                                                    show: true,
                                                                    roomId: room.id,
                                                                    roomName: room.name
                                                                })}
                                                                style={{width: '44px', height: '44px'}}
                                                                title="Удалить комнату"
                                                            >
                                                                <Trash size={20}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white fade-in">
                            <h4 className="fw-bold text-dark mb-4">Пользователи платформы</h4>
                            <div className="d-flex gap-2 mb-4 bg-light p-2 rounded-4 d-inline-flex border flex-wrap">
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${userFilter === 'regular' ? 'btn-white bg-white shadow-sm text-dark' : 'btn-light text-muted border-0'}`}
                                    onClick={() => setUserFilter('regular')}>
                                    Клиенты ({users.filter(u => !isUserAdmin(u)).length})
                                </button>
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${userFilter === 'admin' ? 'btn-white bg-white shadow-sm text-dark' : 'btn-light text-muted border-0'}`}
                                    onClick={() => setUserFilter('admin')}>
                                    Менеджеры и Админы
                                    ({users.filter(u => isUserAdmin(u)).length})
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                                    <People size={40} className="text-muted opacity-50 mb-3"/>
                                    <h5 className="fw-bold text-dark">В этой категории нет пользователей</h5>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle border-top border-bottom">
                                        <thead className="table-light text-muted small">
                                        <tr>
                                            <th className="fw-bold py-3 px-4 rounded-start">ПОЛЬЗОВАТЕЛЬ</th>
                                            <th className="fw-bold py-3">КОНТАКТЫ</th>
                                            <th className="fw-bold py-3 text-center rounded-end">СТАТУС И ДЕЙСТВИЯ</th>
                                        </tr>
                                        </thead>
                                        <tbody className="border-top-0">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="transition-all hover-light">
                                                <td className="py-3 px-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt="Avatar"
                                                                 className="rounded-circle object-fit-cover shadow-sm border border-white"
                                                                 style={{width: '45px', height: '45px'}}/>
                                                        ) : (
                                                            <div
                                                                className="rounded-circle bg-light border d-flex justify-content-center align-items-center text-muted fw-bold"
                                                                style={{
                                                                    width: '45px',
                                                                    height: '45px',
                                                                    fontSize: '18px'
                                                                }}>
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div
                                                                className="fw-bold text-dark">{u.first_name || 'Без имени'} {u.last_name || ''}</div>
                                                            <div className="text-muted small">@{u.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="small text-dark">{u.email}</div>
                                                    <div className="small text-muted">{u.phone_number || '—'}</div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center gap-2">
                                                        {isUserAdmin(u) ? (
                                                            <span className="badge rounded-pill fw-normal px-3 py-2"
                                                                  style={{
                                                                      background: 'rgba(102, 16, 242, 0.1)',
                                                                      color: 'var(--primary)',
                                                                      border: '1px solid rgba(102, 16, 242, 0.2)'
                                                                  }}>
                                                                    <ShieldLockFill
                                                                        className="me-1"/> {u.is_staff ? 'Админ' : (u.role === 'admin' ? 'Админ' : 'Менеджер')}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="badge bg-light text-muted border rounded-pill fw-normal px-3 py-2">
                                                                Клиент
                                                            </span>
                                                        )}

                                                        {u.id !== currentUser?.id && (
                                                            <button
                                                                className={`btn btn-sm ${isUserAdmin(u) ? 'btn-outline-danger' : 'btn-outline-success'} rounded-circle p-2 d-flex align-items-center justify-content-center hover-lift`}
                                                                style={{width: '36px', height: '36px'}}
                                                                onClick={() => handleToggleUserAdmin(u, !isUserAdmin(u))}
                                                                title={isUserAdmin(u) ? "Снять права администратора" : "Сделать администратором"}
                                                            >
                                                                {isUserAdmin(u) ? <PersonDash size={16}/> :
                                                                    <PersonPlus size={16}/>}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;