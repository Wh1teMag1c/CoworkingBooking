import React, {useCallback, useContext, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    Camera,
    Check2Circle,
    Envelope,
    ExclamationTriangleFill,
    Person,
    Save,
    ShieldLock,
    Telephone
} from 'react-bootstrap-icons';
import api from '../api';
import {AuthContext} from '../context/AuthContext';

const ProfilePage = ({onUserUpdate}) => {
    const {setUser: setGlobalUser} = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);

    const [profileForm, setProfileForm] = useState({first_name: '', last_name: '', phone_number: '', avatar: ''});
    const [passwordForm, setPasswordForm] = useState({current_password: '', new_password: '', re_new_password: ''});

    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [tempAvatarUrl, setTempAvatarUrl] = useState('');

    const [toast, setToast] = useState({show: false, message: '', type: 'success'});

    const showToast = (message, type = 'success') => {
        setToast({show: true, message, type});
        setTimeout(() => {
            setToast({show: false, message: '', type: 'success'});
        }, 4000);
    };

    const fetchUserData = useCallback(async () => {
        try {
            const res = await api.get('users/me/');
            setUser(res.data);
            setGlobalUser(res.data);
            setProfileForm({
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                phone_number: res.data.phone_number || '',
                avatar: res.data.avatar || ''
            });
        } catch (error) {
            showToast('Не удалось загрузить данные профиля', 'error');
        } finally {
            setLoading(false);
        }
    }, [setGlobalUser]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchUserData();
    }, [fetchUserData]);

    const getInitial = () => {
        if (user?.username) return user.username.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const handleSaveAvatarUrl = async () => {
        try {
            const res = await api.patch('users/me/', {avatar: tempAvatarUrl});
            setUser(res.data);
            setGlobalUser(res.data);
            setProfileForm({...profileForm, avatar: tempAvatarUrl});
            if (onUserUpdate) onUserUpdate(res.data);
            setShowAvatarModal(false);
            showToast('Фото профиля успешно обновлено!', 'success');
        } catch (err) {
            showToast('Ошибка при обновлении фото.', 'error');
        }
    };

    const handlePhoneChange = (e) => {
        const inputVal = e.target.value;

        if (!inputVal || inputVal === '+' || inputVal === '+7' || inputVal === '+7 ') {
            setProfileForm({...profileForm, phone_number: ''});
            return;
        }

        let digits = inputVal.replace(/\D/g, '');

        if (digits.startsWith('7') || digits.startsWith('8')) {
            digits = digits.substring(1);
        }

        let formatted = '+7 ';
        if (digits.length > 0) formatted += '(' + digits.substring(0, 3);
        if (digits.length > 3) formatted += ') ' + digits.substring(3, 6);
        if (digits.length > 6) formatted += '-' + digits.substring(6, 8);
        if (digits.length > 8) formatted += '-' + digits.substring(8, 10);

        setProfileForm({...profileForm, phone_number: formatted.substring(0, 18)});
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        const rawPhone = profileForm.phone_number.replace(/\D/g, '');
        if (profileForm.phone_number && rawPhone.length !== 11) {
            showToast('Пожалуйста, введите корректный номер телефона (11 цифр).', 'error');
            return;
        }

        try {
            const payload = {
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                phone_number: profileForm.phone_number ? '+' + rawPhone : ''
            };
            const res = await api.patch('users/me/', payload);
            setUser(res.data);
            setGlobalUser(res.data);
            if (onUserUpdate) onUserUpdate(res.data);
            showToast('Профиль успешно обновлен!', 'success');
        } catch (err) {
            showToast('Ошибка при сохранении профиля.', 'error');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.re_new_password) {
            showToast('Новые пароли не совпадают!', 'error');
            return;
        }
        try {
            await api.post('users/set_password/', passwordForm);
            showToast('Пароль успешно изменен!', 'success');
            setPasswordForm({current_password: '', new_password: '', re_new_password: ''});
        } catch (err) {
            if (err.response && err.response.data) {
                const errorMessages = Object.values(err.response.data).flat().join('\n');
                showToast(errorMessages || 'Ошибка. Проверьте правильность паролей.', 'error');
            } else {
                showToast('Ошибка соединения с сервером', 'error');
            }
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="container py-5 fade-in position-relative text-start">

            {toast.show && createPortal(
                <div className="position-fixed top-0 start-50 translate-middle-x mt-4" style={{zIndex: 9999}}>
                    <div className="bg-white border-0 shadow-lg p-3 d-flex align-items-center gap-3 fade-in"
                         style={{
                             borderRadius: '16px',
                             borderLeft: `5px solid ${toast.type === 'success' ? '#10b981' : '#f87171'}`,
                             minWidth: '320px'
                         }}>
                        {toast.type === 'success'
                            ? <Check2Circle size={28} className="text-success"/>
                            : <ExclamationTriangleFill size={28} className="text-danger"/>
                        }
                        <div className="text-start">
                            <div className="fw-bold text-dark">{toast.type === 'success' ? 'Успешно!' : 'Ошибка'}</div>
                            <div className="text-muted small" style={{whiteSpace: 'pre-line'}}>{toast.message}</div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showAvatarModal && createPortal(
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{zIndex: 3000, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)'}}
                    onClick={() => setShowAvatarModal(false)}>

                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg fade-in text-center"
                         style={{maxWidth: '450px', width: '90%'}}
                         onClick={e => e.stopPropagation()}>

                        <h4 className="fw-bold mb-3 text-dark">Изменить фото</h4>
                        <p className="text-muted small mb-4">
                            Вставьте прямую ссылку на изображение (URL). Вы сразу увидите предпросмотр ниже.
                        </p>

                        <div className="mb-4">
                            {tempAvatarUrl ? (
                                <img
                                    src={tempAvatarUrl}
                                    alt="Preview"
                                    className="rounded-circle object-fit-cover shadow-sm border border-3 border-white"
                                    style={{width: '120px', height: '120px'}}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/120?text=Ошибка+загрузки';
                                    }}
                                />
                            ) : (
                                <div
                                    className="mx-auto rounded-circle bg-primary text-white d-flex justify-content-center align-items-center border border-3 border-white fw-bold shadow-sm"
                                    style={{width: '120px', height: '120px', fontSize: '48px'}}>
                                    {getInitial()}
                                </div>
                            )}
                        </div>

                        <div className="mb-4 text-start">
                            <label className="form-label small fw-bold text-muted text-uppercase mb-2">URL
                                изображения</label>
                            <input
                                type="url"
                                className="form-control custom-input"
                                placeholder="https://..."
                                value={tempAvatarUrl}
                                onChange={e => setTempAvatarUrl(e.target.value)}
                                style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                            />
                        </div>

                        <div className="d-flex gap-3">
                            <button className="btn btn-light w-50 py-3 fw-bold rounded-pill"
                                    onClick={() => setShowAvatarModal(false)}>Отмена
                            </button>
                            <button className="btn btn-primary w-50 py-3 fw-bold rounded-pill shadow-sm"
                                    onClick={handleSaveAvatarUrl}>Применить
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="d-flex align-items-center gap-4 mb-5">
                <div className="position-relative">
                    {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt="Avatar"
                             className="rounded-circle object-fit-cover shadow-sm border border-2 border-white"
                             style={{width: '80px', height: '80px'}}
                             onError={(e) => {
                                 e.target.src = 'https://via.placeholder.com/80?text=Нет+фото';
                             }}
                        />
                    ) : (
                        <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2 border-white"
                            style={{width: '80px', height: '80px', fontSize: '32px'}}>
                            {getInitial()}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="fw-800 mb-1">Профиль</h1>
                    <p className="text-muted mb-0">{user?.first_name || user?.username}</p>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
                        <div className="nav flex-column nav-pills gap-2">
                            <button
                                className={`nav-link rounded-3 text-start fw-bold d-flex align-items-center gap-3 py-3 px-4 border-0 transition-all ${activeTab === 'profile' ? 'text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                                style={{backgroundColor: activeTab === 'profile' ? 'var(--primary)' : 'transparent'}}
                                onClick={() => setActiveTab('profile')}
                            >
                                <Person size={20}/> Личные данные
                            </button>
                            <button
                                className={`nav-link rounded-3 text-start fw-bold d-flex align-items-center gap-3 py-3 px-4 border-0 transition-all ${activeTab === 'security' ? 'text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                                style={{backgroundColor: activeTab === 'security' ? 'var(--primary)' : 'transparent'}}
                                onClick={() => setActiveTab('security')}
                            >
                                <ShieldLock size={20}/> Безопасность
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white">
                        {activeTab === 'profile' ? (
                            <form onSubmit={handleProfileUpdate} className="fade-in">
                                <div
                                    className="mb-5 border-bottom pb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <h4 className="fw-bold mb-1 text-dark">Профиль пользователя</h4>
                                        <p className="text-muted small mb-0">Обновите вашу контактную информацию</p>
                                    </div>

                                    <div>
                                        <button type="button"
                                                className="btn btn-outline-primary rounded-pill btn-sm fw-bold px-3 py-2 d-flex align-items-center gap-2 transition-all hover-lift"
                                                onClick={() => {
                                                    setTempAvatarUrl(profileForm.avatar);
                                                    setShowAvatarModal(true);
                                                }}>
                                            <Camera/> Ссылка на фото
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold mb-2 text-uppercase">Логин
                                        (ID)</label>
                                    <input className="form-control custom-input opacity-75"
                                           style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                           value={user?.username || ''} disabled/>
                                </div>

                                <div className="row mb-4 g-3">
                                    <div className="col-md-6">
                                        <label
                                            className="form-label text-muted small fw-bold mb-2 text-uppercase">Имя</label>
                                        <input
                                            className="form-control custom-input text-dark"
                                            style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                            value={profileForm.first_name}
                                            onChange={e => setProfileForm({...profileForm, first_name: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label
                                            className="form-label text-muted small fw-bold mb-2 text-uppercase">Фамилия</label>
                                        <input
                                            className="form-control custom-input text-dark"
                                            style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                            value={profileForm.last_name}
                                            onChange={e => setProfileForm({...profileForm, last_name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold mb-2 text-uppercase">Электронная
                                        почта</label>
                                    <div className="position-relative">
                                        <Envelope
                                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"/>
                                        <input
                                            type="email"
                                            className="form-control custom-input ps-5 opacity-75"
                                            style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                            value={user?.email || ''}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-12 mt-0 mb-4">
                                    <div className="form-text" style={{fontSize: '0.75rem'}}>Логин и Email привязаны к
                                        вашему аккаунту и не подлежат изменению.
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label
                                        className="form-label text-muted small fw-bold mb-2 text-uppercase">Телефон</label>
                                    <div className="position-relative">
                                        <Telephone
                                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"/>
                                        <input
                                            type="tel"
                                            className="form-control custom-input ps-5 text-dark"
                                            style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                            placeholder="+7 (999) 000-00-00"
                                            value={profileForm.phone_number}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                </div>

                                <button type="submit"
                                        className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-sm d-flex align-items-center hover-lift">
                                    <Save className="me-2"/> Сохранить изменения
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handlePasswordChange} className="fade-in">
                                <div className="mb-5 border-bottom pb-3">
                                    <h4 className="fw-bold mb-1 text-dark">Защита аккаунта</h4>
                                    <p className="text-muted small mb-0">Регулярная смена пароля повышает безопасность
                                        данных</p>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold mb-2 text-uppercase">Текущий
                                        пароль</label>
                                    <input
                                        type="password"
                                        className="form-control custom-input text-dark"
                                        style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                        required
                                        onChange={e => setPasswordForm({
                                            ...passwordForm,
                                            current_password: e.target.value
                                        })}
                                        value={passwordForm.current_password}
                                    />
                                </div>

                                <div className="position-relative my-5">
                                    <hr className="opacity-10"/>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold mb-2 text-uppercase">Новый
                                        пароль</label>
                                    <input
                                        type="password"
                                        className="form-control custom-input text-dark"
                                        style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                        required minLength={8}
                                        onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                                        value={passwordForm.new_password}
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label text-muted small fw-bold mb-2 text-uppercase">Повторите
                                        новый пароль</label>
                                    <input
                                        type="password"
                                        className="form-control custom-input text-dark"
                                        style={{backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1'}}
                                        required
                                        onChange={e => setPasswordForm({
                                            ...passwordForm,
                                            re_new_password: e.target.value
                                        })}
                                        value={passwordForm.re_new_password}
                                    />
                                </div>

                                <button type="submit"
                                        className="btn btn-danger px-5 py-3 fw-bold rounded-pill shadow-sm d-flex align-items-center hover-lift">
                                    <ShieldLock className="me-2"/> Изменить пароль
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;