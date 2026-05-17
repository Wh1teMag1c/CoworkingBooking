import os
import random
import uuid
from datetime import timedelta
from decimal import Decimal

from api.models import (
    Amenity,
    Booking,
    Category,
    Payment,
    Review,
    Room,
    RoomImage,
    User,
)
from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Заполняет БД начальными данными"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Очистка старых данных..."))
        Payment.objects.all().delete()
        Review.objects.all().delete()
        Booking.objects.all().delete()
        RoomImage.objects.all().delete()
        Room.objects.all().delete()
        Category.objects.all().delete()
        Amenity.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(
            self.style.SUCCESS("Создание тестовых пользователей...")
        )
        test_users_data = [
            {
                "username": "dmitry_dev",
                "email": "dmitry@example.com",
                "first": "Дмитрий",
                "last": "Иванов",
                "role": "client",
                "is_staff": False,
            },
            {
                "username": "anna_qa",
                "email": "anna@example.com",
                "first": "Анна",
                "last": "Смирнова",
                "role": "client",
                "is_staff": False,
            },
            {
                "username": "alex_pm",
                "email": "alex@example.com",
                "first": "Алексей",
                "last": "Петров",
                "role": "client",
                "is_staff": False,
            },
            {
                "username": "admin_ivan",
                "email": "admin_ivan@example.com",
                "first": "Иван",
                "last": "Админов",
                "role": "admin",
                "is_staff": True,
            },
        ]

        users = []
        clients = []
        for u_data in test_users_data:
            user, created = User.objects.get_or_create(
                username=u_data["username"],
                defaults={
                    "email": u_data["email"],
                    "first_name": u_data["first"],
                    "last_name": u_data["last"],
                    "role": u_data["role"],
                    "is_staff": u_data["is_staff"],
                },
            )
            if created:
                user.set_password("password123")
                user.save()
            users.append(user)
            if user.role == "client":
                clients.append(user)

        self.stdout.write(self.style.SUCCESS("Создание категорий..."))
        categories = {
            "small": Category.objects.create(
                name="Переговорная",
                slug="small",
                description="Для деловых встреч и переговоров",
            ),
            "open": Category.objects.create(
                name="Коворкинг",
                slug="open",
                description="Общее рабочее пространство",
            ),
            "conf": Category.objects.create(
                name="Конференц-зал",
                slug="conf",
                description="Для проведения лекций и мастер-классов",
            ),
        }

        self.stdout.write(self.style.SUCCESS("Создание удобств..."))
        amenities = {
            "Wi-Fi": Amenity.objects.create(name="Wi-Fi", icon="bi-wifi"),
            "Проектор": Amenity.objects.create(
                name="Проектор", icon="bi-projector"
            ),
            "Маркерная доска": Amenity.objects.create(
                name="Маркерная доска", icon="bi-easel"
            ),
            "Кофемашина": Amenity.objects.create(
                name="Кофемашина", icon="bi-cup-hot"
            ),
            "ТВ": Amenity.objects.create(name="ТВ-панель", icon="bi-tv"),
        }

        rooms_data = [
            {
                "name": "Переговорная «Малевич»",
                "category": categories["small"],
                "address": "Москва, Пресненская наб., 12 (БЦ Федерация)",
                "floor": 45,
                "capacity": 4,
                "price_per_hour": Decimal("1500.00"),
                "description": (
                    "Уютная комната для 1-1 встреч и videoзвонков. "
                    "Отличная звукоизоляция и панорамный вид на Москву-реку. "
                    "Пожалуйста, не выносите пульты от ТВ."
                ),
                "amenities": ["Wi-Fi", "ТВ", "Маркерная доска"],
                "image_filename": "room1.jpg",
            },
            {
                "name": "Конференц-зал «Орбита»",
                "category": categories["conf"],
                "address": "Москва, ул. Лесная, 5 (БЦ Белая Площадь)",
                "floor": 12,
                "capacity": 30,
                "price_per_hour": Decimal("5000.00"),
                "description": (
                    "Просторный зал для проведения масштабных презентаций "
                    "и собраний. Имеется кулер с питьевой водой и кофемашина."
                ),
                "amenities": [
                    "Wi-Fi",
                    "Проектор",
                    "Маркерная доска",
                    "Кофемашина",
                ],
                "image_filename": "room2.jpg",
            },
            {
                "name": "Open Space «Нева»",
                "category": categories["open"],
                "address": "Санкт-Петербург, Дегтярный пер., 11 (БЦ Нева)",
                "floor": 3,
                "capacity": 15,
                "price_per_hour": Decimal("800.00"),
                "description": (
                    "Открытая креативная зона с эргономичными креслами "
                    "и мягкими пуфами. Идеально для брейнштормов. "
                    "Просьба соблюдать комфортный уровень шума."
                ),
                "amenities": ["Wi-Fi", "ТВ", "Маркерная доска", "Кофемашина"],
                "image_filename": "room3.jpg",
            },
            {
                "name": "Переговорная «Зилант»",
                "category": categories["small"],
                "address": "Казань, ул. Петербургская, 52 (ИТ-парк)",
                "floor": 5,
                "capacity": 6,
                "price_per_hour": Decimal("1200.00"),
                "description": (
                    "Строгий дизайн и много естественного света. "
                    "Запасные маркеры лежат в нижнем ящике тумбы."
                ),
                "amenities": ["Wi-Fi", "ТВ", "Маркерная доска"],
                "image_filename": "room4.jpg",
            },
            {
                "name": "Зал «Аврора»",
                "category": categories["conf"],
                "address": "Москва, Большой бульвар, 42 (ИЦ Сколково)",
                "floor": 2,
                "capacity": 50,
                "price_per_hour": Decimal("8000.00"),
                "description": (
                    "Большой лекторий с амфитеатром. Микрофоны и кликеры "
                    "выдаются на главном ресепшене под роспись."
                ),
                "amenities": ["Wi-Fi", "Проектор", "ТВ"],
                "image_filename": "room5.jpg",
            },
            {
                "name": "Переговорная «Урал»",
                "category": categories["small"],
                "address": "Екатеринбург, ул. Малышева, 51 (БЦ Высоцкий)",
                "floor": 37,
                "capacity": 8,
                "price_per_hour": Decimal("1400.00"),
                "description": (
                    "Современная переговорная с потрясающим видом на город. "
                    "Идеально подходит для встреч с ключевыми клиентами."
                ),
                "amenities": ["Wi-Fi", "Кофемашина", "Маркерная доска"],
                "image_filename": "room6.jpg",
            },
        ]

        self.stdout.write(
            self.style.SUCCESS("Загрузка комнат и привязка локальных изображений...")
        )
        rooms = []
        for data in rooms_data:
            image_filename = data.pop("image_filename")
            room_amenities = data.pop("amenities")

            room = Room.objects.create(is_active=True, **data)

            for am_name in room_amenities:
                room.amenities.add(amenities[am_name])

            source_path = os.path.join(settings.BASE_DIR, "initial_images", image_filename)

            if os.path.exists(source_path):
                try:
                    with open(source_path, "rb") as f:
                        RoomImage.objects.create(
                            room=room,
                            image=File(f, name=image_filename),
                        )
                    self.stdout.write(f"  [+] Добавлено фото для: {room.name}")
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [-] Ошибка обработки файла для {room.name}: {e}"
                        )
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"  [-] Файл не найден: {source_path}"
                    )
                )

            rooms.append(room)

        self.stdout.write(
            self.style.SUCCESS("Генерация бронирований, платежей и отзывов...")
        )
        notes = [
            "Синхронизация команды",
            "Собеседование с кандидатом",
            "Презентация заказчику",
            "Планирование спринта",
            "Встреча один на один",
            "Мозговой штурм",
        ]

        base_time = timezone.now().replace(minute=0, second=0, microsecond=0)

        for room in rooms:
            reviewers = random.sample(clients, random.randint(2, len(clients)))
            for reviewer in reviewers:
                Review.objects.create(
                    room=room,
                    user=reviewer,
                    rating=random.choices([4, 5], weights=[30, 70])[0],
                )

            for day_offset in range(-2, 5):
                current_day = base_time + timedelta(days=day_offset)
                num_meetings = random.randint(1, 3)
                busy_hours = set()

                for _ in range(num_meetings):
                    hour = random.randint(9, 17)
                    if hour in busy_hours or (hour + 1) in busy_hours:
                        continue

                    busy_hours.add(hour)
                    start_time = current_day.replace(hour=hour)
                    end_time = start_time + timedelta(
                        hours=random.choice([1, 2])
                    )

                    if end_time < timezone.now():
                        status = "finished"
                    else:
                        status = random.choices(
                            ["confirmed", "pending"], weights=[80, 20]
                        )[0]

                    booking = Booking(
                        user=random.choice(clients),
                        room=room,
                        start_time=start_time,
                        end_time=end_time,
                        attendees_count=random.randint(2, room.capacity),
                        status=status,
                        comment=(
                            random.choice(notes) if random.random() > 0.3
                            else ""
                        ),
                    )

                    booking.full_clean = lambda *args, **kwargs: None
                    booking.save()

                    if status in ["confirmed", "finished"]:
                        Payment.objects.create(
                            booking=booking,
                            amount=booking.total_price,
                            status="success",
                            transaction_id=(
                                f"TXN-{uuid.uuid4().hex[:8].upper()}"
                            ),
                        )

        self.stdout.write(
            self.style.SUCCESS("Готово! База данных успешно заполнена.")
        )
