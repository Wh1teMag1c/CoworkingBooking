import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from api.models import Category, Amenity, Room

class Command(BaseCommand):
    help = 'Seeds the database with test data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Очистка старых данных...'))
        Room.objects.all().delete()
        Category.objects.all().delete()
        Amenity.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Создание категорий...'))
        cat1 = Category.objects.create(name='Переговорная', slug='meeting-room', description='Для деловых встреч и переговоров')
        cat2 = Category.objects.create(name='Коворкинг', slug='coworking', description='Общее рабочее пространство')
        cat3 = Category.objects.create(name='Лекторий', slug='lecture-hall', description='Для проведения лекций и мастер-классов')

        self.stdout.write(self.style.SUCCESS('Создание удобств...'))
        am_wifi = Amenity.objects.create(name='Wi-Fi', icon='bi bi-wifi')
        am_projector = Amenity.objects.create(name='Проектор', icon='bi bi-projector')
        am_whiteboard = Amenity.objects.create(name='Маркерная доска', icon='bi bi-easel')
        am_coffee = Amenity.objects.create(name='Кофе-машина', icon='bi bi-cup-hot')
        am_tv = Amenity.objects.create(name='ТВ-панель', icon='bi bi-tv')

        self.stdout.write(self.style.SUCCESS('Создание пространств...'))
        room1 = Room.objects.create(
            category=cat1,
            name='Alpha Boardroom',
            address='ул. Пушкина, д. 10',
            floor=3,
            capacity=12,
            price_per_hour=Decimal('1500.00'),
            description='Светлая переговорная с панорамными окнами и большим столом из дуба.',
            is_active=True
        )
        room1.amenities.add(am_wifi, am_tv, am_whiteboard, am_coffee)

        room2 = Room.objects.create(
            category=cat2,
            name='Open Space Beta',
            address='ул. Лермонтова, д. 22',
            floor=1,
            capacity=30,
            price_per_hour=Decimal('500.00'),
            description='Стильный коворкинг в стиле лофт с эргономичными креслами и зоной отдыха.',
            is_active=True
        )
        room2.amenities.add(am_wifi, am_coffee)

        room3 = Room.objects.create(
            category=cat3,
            name='Gamma Hall',
            address='пр. Ленина, д. 100',
            floor=2,
            capacity=50,
            price_per_hour=Decimal('3000.00'),
            description='Просторный зал для митапов, оборудован профессиональным звуком и проектором.',
            is_active=True
        )
        room3.amenities.add(am_wifi, am_projector, am_whiteboard)
        
        room4 = Room.objects.create(
            category=cat1,
            name='Zen Room',
            address='ул. Пушкина, д. 10',
            floor=3,
            capacity=4,
            price_per_hour=Decimal('800.00'),
            description='Уютная комната для собеседований или 1-on-1 встреч в тихой обстановке.',
            is_active=True
        )
        room4.amenities.add(am_wifi, am_whiteboard)

        self.stdout.write(self.style.SUCCESS('Готово! База данных успешно заполнена тестовыми данными.'))
