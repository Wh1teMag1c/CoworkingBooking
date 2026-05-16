import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import {
    CalendarEvent,
    Check2Circle,
    ExclamationTriangleFill,
    GeoAlt,
    InfoCircle,
    People,
    X
} from 'react-bootstrap-icons';

const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const generateTimeSlots = () => {
    const slots = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
        const hour = i < 10 ? `0${i}` : i;
        slots.push(`${hour}:00`);
        if (i !== END_HOUR) slots.push(`${hour}:30`);
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getLocalTimeStr = (isoString) => {
    const d = new Date(isoString);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
};

const BookingModal = ({ room, show, onClose, onBookingSuccess }) => {
    const [date, setDate] = useState(getLocalDateString());
    const [comment, setComment] = useState('');
    const [attendeesCount, setAttendeesCount] = useState(1);
    const [busySlots, setBusySlots] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selStart, setSelStart] = useState(60);
    const [selEnd, setSelEnd] = useState(120);

    const timelineRef = useRef(null);
    const dragging = useRef(null);
    const [dragState, setDragState] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);

    const minsToTime = (mins) => {
        const h = Math.floor(mins / 60) + START_HOUR;
        const m = mins % 60;
        return `${h < 10 ? '0' + h : h}:${m === 0 ? '00' : '30'}`;
    };

    const timeToMins = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return (h - START_HOUR) * 60 + m;
    };

    const getPassedMins = useCallback(() => {
        const todayStr = getLocalDateString();
        if (date !== todayStr) return 0;

        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();

        if (h < START_HOUR) return 0;
        if (h >= END_HOUR) return TOTAL_MINUTES;

        return (h - START_HOUR) * 60 + m;
    }, [date]);

    const getMinAllowedMins = useCallback(() => {
        const passedMins = getPassedMins();
        return Math.ceil(passedMins / 30) * 30;
    }, [getPassedMins]);

    const fetchBusySlots = useCallback(async () => {
        try {
            const res = await api.get(`bookings/?room=${room.id}`);
            const filtered = res.data.filter(b => b.start_time.includes(date) && (b.status === 'pending' || b.status === 'confirmed'));
            setBusySlots(filtered);
        } catch (error) {
            console.error("Ошибка загрузки расписания", error);
        }
    }, [room?.id, date]);

    useEffect(() => {
        if (show && room) {
            fetchBusySlots();
        }
    }, [show, room, date, fetchBusySlots]);

    useEffect(() => {
        if (!show) return;
        const minMins = getMinAllowedMins();

        if (selStart < minMins) {
            setSelStart(minMins);
            if (selEnd <= minMins) {
                setSelEnd(Math.min(minMins + 60, TOTAL_MINUTES));
            }
        }
    }, [date, show, getMinAllowedMins, selStart, selEnd]);

    const hasConflict = useCallback(() => {
        const sMins = selStart;
        const eMins = selEnd;
        const minMins = getMinAllowedMins();

        if (sMins < minMins) return true;

        return busySlots.some(slot => {
            const bStart = timeToMins(getLocalTimeStr(slot.start_time));
            const bEnd = timeToMins(getLocalTimeStr(slot.end_time));
            return sMins < bEnd && eMins > bStart;
        });
    }, [selStart, selEnd, busySlots, getMinAllowedMins]);

    const handleStartTimeSelect = (val) => {
        const newMins = timeToMins(val);
        setSelStart(newMins);
        if (newMins >= selEnd) {
            setSelEnd(Math.min(newMins + 30, TOTAL_MINUTES));
        }
    };

    const handleEndTimeSelect = (val) => {
        const newMins = timeToMins(val);
        if (newMins > selStart) {
            setSelEnd(newMins);
        }
    };

    const handleSliderMouseDown = (e, type) => {
        e.stopPropagation();
        setDragState(type);
        dragging.current = type;
        if (type === 'move') {
            const rect = timelineRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickMins = (clickX / rect.width) * TOTAL_MINUTES;
            setDragOffset(clickMins - selStart);
        }
    };

    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e) => {
            const rect = timelineRef.current.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            offsetX = Math.max(0, Math.min(rect.width, offsetX));

            let moveMins = Math.round(((offsetX / rect.width) * TOTAL_MINUTES) / 30) * 30;
            const minAllowed = getMinAllowedMins();

            const curStart = selStart;
            const curEnd = selEnd;

            if (dragState === 'start') {
                const newStart = Math.max(minAllowed, Math.min(moveMins, curEnd - 30));
                setSelStart(newStart);
            } else if (dragState === 'end') {
                const newEnd = Math.max(curStart + 30, Math.min(TOTAL_MINUTES, moveMins));
                setSelEnd(newEnd);
            } else if (dragState === 'move') {
                const duration = curEnd - curStart;
                let newStart = moveMins - Math.round(dragOffset / 30) * 30;
                newStart = Math.max(minAllowed, Math.min(TOTAL_MINUTES - duration, newStart));
                setSelStart(newStart);
                setSelEnd(newStart + duration);
            }
        };

        const stopDragging = () => {
            setDragState(null);
            dragging.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopDragging);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopDragging);
        };
    }, [dragState, selStart, selEnd, dragOffset, getMinAllowedMins]);

    const handleBackgroundClick = (e) => {
        if (dragState) return;
        const rect = timelineRef.current.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        let clickMins = Math.round(((offsetX / rect.width) * TOTAL_MINUTES) / 30) * 30;
        const minAllowed = getMinAllowedMins();

        if (clickMins < minAllowed) clickMins = minAllowed;

        const curDuration = selEnd - selStart;
        let newStart = clickMins;
        let newEnd = newStart + curDuration;

        if (newEnd > TOTAL_MINUTES) {
            newEnd = TOTAL_MINUTES;
            newStart = newEnd - curDuration;
        }

        setSelStart(newStart);
        setSelEnd(newEnd);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const startDateTime = new Date(`${date}T${minsToTime(selStart)}:00`).toISOString();
            const endDateTime = new Date(`${date}T${minsToTime(selEnd)}:00`).toISOString();

            await api.post('bookings/', {
                room: room.id,
                start_time: startDateTime,
                end_time: endDateTime,
                attendees_count: attendeesCount,
                comment: comment
            });
            if (onBookingSuccess) onBookingSuccess();
        } catch (err) {
            if (err.response?.status === 401) {
                alert('Сессия истекла. Войдите снова.');
                window.location.href = '/login';
            } else {
                alert(err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || 'Произошла ошибка при бронировании');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const selectionLeft = (selStart / TOTAL_MINUTES) * 100;
    const selectionWidth = ((selEnd - selStart) / TOTAL_MINUTES) * 100;
    const minAllowedMinsRender = getMinAllowedMins();

    const blockedStyle = {
        background: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 5px, #e2e8f0 5px, #e2e8f0 10px)'
    };

    const durationHours = (selEnd - selStart) / 60;
    const totalPrice = (durationHours * parseFloat(room.price_per_hour)).toFixed(2);

    return createPortal(
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 2000, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}>

            <div className="bg-white shadow-lg fade-in overflow-hidden position-relative"
                style={{ borderRadius: '28px', maxWidth: '1000px', width: '95%', maxHeight: '95vh' }}
                onClick={e => e.stopPropagation()}>

                <div className="p-4 border-bottom d-flex justify-content-between align-items-start bg-light">
                    <div>
                        <h3 className="fw-800 mb-1 text-dark">{room.name}</h3>
                        <div className="text-muted small d-flex align-items-center fw-medium">
                            <GeoAlt className="me-1 text-primary" /> {room.address} • Этаж {room.floor}
                        </div>
                    </div>
                    <button className="btn btn-white shadow-sm border-0 rounded-circle p-2" onClick={onClose}><X
                        size={24} /></button>
                </div>

                <div className="row g-0">
                    <div className="col-lg-7 p-4 p-md-5 border-end"
                        style={{ overflowY: 'auto', maxHeight: 'calc(95vh - 100px)' }}>
                        <form onSubmit={handleSubmit}>

                            <div className="row g-3 mb-4">
                                <div className="col-sm-8">
                                    <div className="text-start p-3 bg-light rounded-4 border border-secondary border-opacity-10 h-100">
                                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">
                                            Дата встречи
                                        </label>
                                        <div className="position-relative">
                                            <CalendarEvent
                                                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary" />
                                            <input type="date"
                                                className="form-control custom-input ps-5 bg-white border-0 shadow-sm rounded-3"
                                                required
                                                value={date} onChange={e => setDate(e.target.value)}
                                                min={getLocalDateString()} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="text-start p-3 bg-light rounded-4 border border-secondary border-opacity-10 h-100">
                                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">
                                            Участники
                                        </label>
                                        <div className="position-relative">
                                            <People className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary" />
                                            <input type="number"
                                                className="form-control custom-input ps-5 bg-white border-0 shadow-sm rounded-3"
                                                min="1" max={room.capacity}
                                                value={attendeesCount} onChange={e => setAttendeesCount(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 text-start p-3 bg-light rounded-4 border border-secondary border-opacity-10">
                                <label
                                    className="form-label small fw-bold text-muted text-uppercase mb-3 d-flex justify-content-between align-items-center"
                                    style={{ minHeight: '24px' }}>
                                    Настройте период
                                    <span
                                        className={`text-danger bg-danger bg-opacity-10 px-2 py-1 rounded-2 transition-all fw-medium ${hasConflict() ? 'opacity-100' : 'opacity-0'}`}>
                                        <ExclamationTriangleFill className="me-1" /> Время недоступно
                                    </span>
                                </label>

                                <div
                                    className="position-relative border rounded-3 overflow-hidden bg-white shadow-sm mb-4"
                                    style={{ height: '60px' }} ref={timelineRef}>

                                    <div className="d-flex w-100 h-100 position-absolute top-0 start-0"
                                        style={{ cursor: 'pointer' }} onMouseDown={handleBackgroundClick}>
                                        {Array.from({ length: 14 }).map((_, i) => {
                                            const hour = i + START_HOUR;
                                            const hStr = hour < 10 ? `0${hour}` : hour;
                                            return (
                                                <div key={hour}
                                                    className="flex-grow-1 border-end position-relative d-flex flex-column pointer-events-none">
                                                    <div className="text-center border-bottom bg-light"
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: '700',
                                                            color: '#64748b',
                                                            padding: '2px 0',
                                                            zIndex: 1
                                                        }}>
                                                        {hStr}:00
                                                    </div>
                                                    <div className="d-flex h-100">
                                                        <div className="flex-grow-1"></div>
                                                        <div
                                                            className="flex-grow-1 border-start border-dotted opacity-50"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {minAllowedMinsRender > 0 && (
                                        <div className="position-absolute start-0 pointer-events-none"
                                            style={{
                                                top: '22px',
                                                bottom: '0',
                                                width: `${(minAllowedMinsRender / TOTAL_MINUTES) * 100}%`, ...blockedStyle
                                            }}>
                                        </div>
                                    )}

                                    <div className="position-absolute start-0 w-100 pointer-events-none"
                                        style={{ top: '22px', bottom: '0' }}>
                                        {busySlots.map((slot, idx) => {
                                            const s = timeToMins(getLocalTimeStr(slot.start_time));
                                            const e = timeToMins(getLocalTimeStr(slot.end_time));
                                            return (
                                                <div key={idx} className="position-absolute h-100"
                                                    style={{
                                                        left: `${(s / TOTAL_MINUTES) * 100}%`,
                                                        width: `${((e - s) / TOTAL_MINUTES) * 100}%`, ...blockedStyle
                                                    }}>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="position-absolute start-0 w-100 pointer-events-none"
                                        style={{ top: '22px', bottom: '0' }}>
                                        <div
                                            className="position-absolute h-100 shadow-sm"
                                            style={{
                                                left: `${selectionLeft}%`,
                                                width: `${selectionWidth}%`,
                                                background: hasConflict() ? 'var(--danger)' : 'var(--primary)',
                                                borderRadius: '4px',
                                                pointerEvents: 'auto',
                                                cursor: dragState === 'move' ? 'grabbing' : 'grab',
                                                transition: dragState ? 'none' : 'left 0.1s, width 0.1s'
                                            }}
                                            onMouseDown={(e) => handleSliderMouseDown(e, 'move')}
                                        >
                                            <div
                                                className="position-absolute top-0 start-0 h-100 d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: '16px',
                                                    transform: 'translateX(-50%)',
                                                    cursor: 'ew-resize'
                                                }}
                                                onMouseDown={(e) => handleSliderMouseDown(e, 'start')}>
                                                <div className="bg-white rounded-pill shadow"
                                                    style={{ width: '4px', height: '16px' }}></div>
                                            </div>
                                            <div
                                                className="position-absolute top-0 end-0 h-100 d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: '16px',
                                                    transform: 'translateX(50%)',
                                                    cursor: 'ew-resize'
                                                }}
                                                onMouseDown={(e) => handleSliderMouseDown(e, 'end')}>
                                                <div className="bg-white rounded-pill shadow"
                                                    style={{ width: '4px', height: '16px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3 mb-4 justify-content-center small text-muted fw-medium"
                                    style={{ fontSize: '0.75rem' }}>
                                    <div className="d-flex align-items-center gap-2"><span className="border border-secondary border-opacity-25 rounded-circle shadow-sm"
                                        style={{
                                            width: 12,
                                            height: 12,
                                            background: '#fff'
                                        }}></span> Свободно
                                    </div>
                                    <div className="d-flex align-items-center gap-2"><span className="rounded-circle shadow-sm" style={{
                                        width: 12,
                                        height: 12,
                                        background: 'var(--primary)'
                                    }}></span> Выбрано
                                    </div>
                                    <div className="d-flex align-items-center gap-2"><span className="rounded-circle shadow-sm" style={{
                                        width: 12,
                                        height: 12, ...blockedStyle
                                    }}></span> Занято
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Начало</label>
                                        <select className="form-select custom-input bg-white border-0 shadow-sm rounded-3"
                                            value={minsToTime(selStart)}
                                            onChange={e => handleStartTimeSelect(e.target.value)}>
                                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Конец</label>
                                        <select className="form-select custom-input bg-white border-0 shadow-sm rounded-3"
                                            value={minsToTime(selEnd)}
                                            onChange={e => handleEndTimeSelect(e.target.value)}>
                                            {TIME_SLOTS.map(t => (
                                                <option key={t} value={t}
                                                    disabled={timeToMins(t) <= selStart}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 text-start p-3 bg-light rounded-4 border border-secondary border-opacity-10">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Цель встречи</label>
                                <textarea className="form-control custom-input bg-white border-0 shadow-sm rounded-3"
                                    rows="2"
                                    placeholder="Например: Собеседование"
                                    value={comment} onChange={e => setComment(e.target.value)} />
                            </div>

                            <button type="submit"
                                className="btn btn-primary w-100 py-3 rounded-pill shadow-lg d-flex align-items-center justify-content-center gap-2 transition-all hover-lift fw-bold fs-6"
                                disabled={loading || hasConflict()}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : <><Check2Circle
                                    size={24} /> Подтвердить бронь</>}
                            </button>
                        </form>
                    </div>

                    <div className="col-lg-5 p-4 d-none d-lg-block text-start" style={{ backgroundColor: '#fafafa' }}>
                        <div className="position-sticky" style={{ top: '0' }}>
                            <img src={room.images && room.images.length > 0 ? room.images[0].image : (room.preview || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80')}
                                className="w-100 rounded-4 shadow-sm mb-4"
                                style={{ height: '240px', objectFit: 'cover' }} alt={room.name} />

                            <div className="bg-white p-4 rounded-4 shadow-sm mb-4 border border-secondary border-opacity-10">
                                <h6 className="fw-bold mb-3 d-flex align-items-center"><InfoCircle
                                    className="me-2 text-primary" /> Оснащение</h6>
                                <div className="row g-3">
                                    {room.amenities && room.amenities.map(amenity => (
                                        <div key={amenity.id} className="col-6 small d-flex align-items-center gap-2 fw-medium text-dark">
                                            {amenity.icon && <i className={`${amenity.icon} text-primary fs-5`}></i>}
                                            {amenity.name}
                                        </div>
                                    ))}
                                    <div className="col-6 small d-flex align-items-center gap-2 fw-medium text-dark">
                                        <People className="text-primary fs-5" /> до {room.capacity} чел.
                                    </div>
                                </div>
                                {room.description && (
                                    <div className="mt-4 p-3 bg-light rounded-3 border-start border-4 border-primary">
                                        <div className="text-secondary small fw-medium" style={{ lineHeight: '1.6' }}>
                                            {room.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-light p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 mt-4">
                                <h6 className="fw-medium mb-3 text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Итоговая стоимость</h6>
                                <div className="d-flex justify-content-between align-items-end mb-1">
                                    <div className="text-muted small pb-1">
                                        {durationHours} ч. × {room.price_per_hour} ₽/ч
                                    </div>
                                    <div className="text-dark fw-800 fs-3 lh-1">{totalPrice} ₽</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BookingModal;