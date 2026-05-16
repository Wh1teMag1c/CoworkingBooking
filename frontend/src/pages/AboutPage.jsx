import React, { useEffect } from 'react';
import { BuildingCheck, ClockHistory, Laptop, Lightbulb, People, ShieldCheck } from 'react-bootstrap-icons';

const AboutPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="fade-in pb-5">
            <div className="py-5 mb-5 bg-gradient-primary-soft position-relative overflow-hidden">
                <div className="container text-center py-5 position-relative z-1">
                    <span className="badge badge-soft-primary mb-3 px-3 py-2 rounded-pill fs-6">О платформе</span>
                    <h1 className="fw-800 display-4 mb-4 text-dark">
                        Экосистема для вашего бизнеса <br /> с <span className="text-dark">Coworking</span><span style={{ color: 'var(--primary)' }}>Booking</span>
                    </h1>
                    <p className="text-muted lead mx-auto mb-0" style={{ maxWidth: '800px', fontSize: '1.2rem' }}>
                        Мы создаем современное комьюнити для эффективного нетворкинга и комфортной работы. 
                        CoworkingBooking помогает фрилансерам и командам находить идеальные гибкие рабочие места, 
                        позволяя сосредоточиться на идеях, а не на поиске пространства.
                    </p>
                </div>
                <div className="position-absolute top-0 start-0 translate-middle rounded-circle bg-white opacity-50" style={{ width: '400px', height: '400px', filter: 'blur(50px)' }}></div>
                <div className="position-absolute bottom-0 end-0 translate-middle-y rounded-circle bg-primary opacity-10" style={{ width: '300px', height: '300px', filter: 'blur(60px)' }}></div>
            </div>

            <div className="container">
                <div className="row g-4 justify-content-center mb-5 mt-n5 position-relative z-2">
                    {[
                        { icon: <BuildingCheck size={28} />, val: '100+', label: 'Рабочих мест' },
                        { icon: <People size={28} />, val: '2.5k+', label: 'Резидентов' },
                        { icon: <ClockHistory size={28} />, val: '24/7', label: 'Доступ к зонам' }
                    ].map((stat, i) => (
                        <div key={i} className="col-md-4 col-lg-3">
                            <div className="p-4 rounded-4 bg-white text-center shadow-sm border-0 hover-lift h-100 d-flex flex-column justify-content-center">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle badge-soft-primary mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                                    {stat.icon}
                                </div>
                                <h2 className="fw-bold mb-1 display-6">{stat.val}</h2>
                                <span className="text-muted fw-semibold">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row mb-5 align-items-center g-5 py-5">
                    <div className="col-lg-6">
                        <span className="text-uppercase text-primary fw-bold tracking-wider mb-2 d-block">Процесс</span>
                        <h2 className="fw-800 mb-5 display-5 text-dark">Как это работает?</h2>
                        {[
                            {
                                step: '01',
                                title: 'Выберите пространство',
                                text: 'Используйте удобные фильтры для поиска: от тихих зон (hot-desks) до просторных переговорных комнат для команд.'
                            },
                            {
                                step: '02',
                                title: 'Забронируйте слот',
                                text: 'Мгновенная фиксация времени в пару кликов. Полный контроль над вашим графиком и ресурсами.'
                            },
                            {
                                step: '03',
                                title: 'Начните работу',
                                text: 'Приходите и вливайтесь в комьюнити – высокоскоростной Wi-Fi, эргономичная мебель и свежий кофе уже ждут вас.'
                            }
                        ].map((item, i) => (
                            <div className="d-flex mb-4 align-items-start" key={i}>
                                <div className="me-4 flex-shrink-0 mt-1">
                                    <span
                                        className="rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold bg-white shadow-sm"
                                        style={{ width: '56px', height: '56px', fontSize: '1.25rem', border: '2px solid var(--primary-soft)' }}>
                                        {item.step}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="fw-bold mb-2">{item.title}</h4>
                                    <p className="text-muted mb-0 fs-6">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="col-lg-6">
                        <img
                            src="https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Modern Coworking Space"
                            className="img-fluid rounded-5 w-100 object-fit-cover image-hover-zoom"
                            style={{ minHeight: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)' }}
                        />
                    </div>
                </div>

                <div className="py-5 mb-5">
                    <div className="text-center mb-5">
                        <span className="text-uppercase text-primary fw-bold tracking-wider mb-2 d-block">Преимущества</span>
                        <h2 className="fw-800 display-5 text-dark">Почему выбирают нас</h2>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm p-4 hover-lift rounded-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle badge-soft-success mb-4" style={{ width: '60px', height: '60px' }}>
                                    <ShieldCheck size={30} className="text-success" />
                                </div>
                                <h4 className="fw-bold mb-3">Гарантия брони</h4>
                                <p className="text-muted">Интеллектуальная система исключает накладки расписания. Если вы забронировали место или переговорную – они гарантированно ваши.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm p-4 hover-lift rounded-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle badge-soft-primary mb-4" style={{ width: '60px', height: '60px' }}>
                                    <Laptop size={30} className="text-primary" />
                                </div>
                                <h4 className="fw-bold mb-3">Технологичность</h4>
                                <p className="text-muted">Всегда актуальная информация о наличии мониторов, эргономичных кресел, магнитных досок и необходимой периферии.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm p-4 hover-lift rounded-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle badge-soft-warning mb-4" style={{ width: '60px', height: '60px' }}>
                                    <Lightbulb size={30} className="text-warning" />
                                </div>
                                <h4 className="fw-bold mb-3">Креативное комьюнити</h4>
                                <p className="text-muted">Наше пространство создано для нетворкинга. Находите партнеров, обменивайтесь идеями и растите в среде единомышленников.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
