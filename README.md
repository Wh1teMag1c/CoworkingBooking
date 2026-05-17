# CoworkingBooking – Сервис бронирования коворкинг-пространств

Современный сервис для бронирования коворкинг-пространств и переговорных комнат. Предоставляет полный цикл работы: просмотр каталога пространств, бронирование с защитой от пересечений, онлайн-оплату и систему отзывов с автоматическим рейтингом.

## Стек технологий

| Компонент | Технология |
|-----------|------------|
| Язык | Python 3.11, JavaScript |
| Фреймворк бэкенда | Django 5.2 + Django REST Framework |
| СУБД | PostgreSQL 15 |
| Аутентификация | SimpleJWT (Bearer-токены) |
| Фронтенд | React 18 (Vite) |
| Контейнеризация | Docker, Docker Compose |
| Веб-сервер | Nginx 1.25, Gunicorn |
| Тестирование | APITestCase (Django) + Hypothesis |

## Структура проекта

```text
.
├── backend/                    # Серверная часть (Django)
│   ├── api/                    # Бизнес-логика, модели и API
│   │   ├── management/         # Команды управления (seed_data)
│   │   ├── migrations/         # Миграции базы данных
│   │   └── tests/              # Тесты (test_views.py, test_fuzzing.py)
│   ├── core/                   # Настройки проекта (settings, urls, wsgi)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/                   # Клиентская часть (React)
│   ├── src/
│   │   ├── components/         # BookingModal, Navbar, Footer
│   │   ├── pages/              # HomePage, AdminPage, MyBookingsPage, ...
│   │   └── context/            # AuthContext
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── nginx/                      # Конфигурация Reverse Proxy
│   └── nginx.conf
├── docker-compose.yml          # Оркестрация контейнеров
├── .env                        # Переменные окружения (не в VCS)
└── README.md
```

## Быстрый старт (Docker)

Проект запускается одной командой. Весь процесс сборки и настройки сети автоматизирован.

### 1. Настройка окружения

Создайте файл `.env` в корне проекта (рядом с `docker-compose.yml`):

```env
POSTGRES_NAME=coworking_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_SECRET_KEY=u9gfsteipe_m833jjzwfdy_n_bi_n_e9gfsteipe_3xhvbomhqv
DJANGO_DEBUG=False
```

### 2. Запуск приложения

```bash
docker compose up -d --build
```

### 3. Заполнение базы данных

Запустите скрипт генерации данных. Он создаст тестовых пользователей, пространства с удобствами и набор бронирований:

```bash
docker compose exec backend python manage.py seed_data
```

## Доступ к сервису

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **API Root:** [http://localhost:8080/api/](http://localhost:8080/api/)
- **Django Admin:** [http://localhost:8080/admin/](http://localhost:8080/admin/)

## API — основные эндпоинты

| Метод | URL | Доступ | Описание |
|-------|-----|--------|----------|
| `POST` | `/api/token/` | Все | Получение JWT (access + refresh) |
| `POST` | `/api/token/refresh/` | Все | Обновление access-токена |
| `POST` | `/api/users/` | Все | Регистрация нового пользователя |
| `GET` | `/api/users/me/` | Авторизован | Профиль текущего пользователя |
| `GET` | `/api/rooms/` | Все | Каталог активных пространств |
| `GET` | `/api/categories/` | Все | Список категорий |
| `POST` | `/api/bookings/` | Авторизован | Создание бронирования |
| `GET` | `/api/bookings/` | Авторизован | Мои бронирования (admin — все) |
| `PATCH` | `/api/bookings/{id}/` | Авторизован | Изменение статуса брони |
| `POST` | `/api/payments/` | Авторизован | Оплата бронирования |
| `POST` | `/api/reviews/` | Авторизован | Оставить отзыв |

Все защищённые эндпоинты требуют заголовок:

```text
Authorization: Bearer <access_token>
```

## Тестирование

Проект покрыт **30 тестами**, разбитыми на два модуля. Запуск внутри контейнера:

```bash
docker compose exec backend python manage.py test api
```

### `test_views.py` — интеграционные API-тесты (22 теста)

Используется `rest_framework.test.APITestCase`. Покрывают: регистрацию и смену пароля, доступ к каталогу по ролям, полный цикл бронирования с расчётом `total_price`, защиту от некорректных дат и пересечений, платёжный цикл (`Payment` → `confirmed`) и систему отзывов с `average_rating`.

### `test_fuzzing.py` — Property-based тесты / Hypothesis (8 тестов)

Библиотека **Hypothesis** автоматически генерирует сотни случайных входных значений для проверки граничных случаев: сверхдлинные названия, отрицательная вместимость и цена, нулевая длительность брони, бронирование в прошлом, некорректный рейтинг отзыва.
