from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Avg
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Roles(models.TextChoices):
        CLIENT = 'client', _('Клиент')
        MANAGER = 'manager', _('Менеджер')
        ADMIN = 'admin', _('Администратор')

    role = models.CharField(
        max_length=10,
        choices=Roles.choices,
        default=Roles.CLIENT,
        verbose_name="Роль"
    )
    email = models.EmailField(unique=True, verbose_name="Электронная почта")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Телефон")
    bio = models.TextField(max_length=500, blank=True, verbose_name="О себе")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Аватар")

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


class Category(models.Model):
    name = models.CharField(max_length=50, verbose_name="Название категории")
    slug = models.SlugField(unique=True, verbose_name="Слаг (для URL)")
    description = models.TextField(blank=True, verbose_name="Описание категории")

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name


class Amenity(models.Model):
    name = models.CharField(max_length=50, verbose_name="Название")
    icon = models.CharField(max_length=50, blank=True, help_text="Класс иконки Bootstrap (напр. bi-wifi)")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Удобство'
        verbose_name_plural = 'Удобства'


class Room(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True,
        related_name="rooms", verbose_name="Категория"
    )
    name = models.CharField(max_length=100, verbose_name="Название")
    address = models.CharField(max_length=200, verbose_name="Адрес", default="Главный офис")
    floor = models.IntegerField(verbose_name="Этаж", default=1)
    capacity = models.PositiveIntegerField(verbose_name="Вместимость (чел.)")
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Цена в час")

    amenities = models.ManyToManyField(Amenity, blank=True, related_name="rooms", verbose_name="Удобства")

    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Доступна")

    def __str__(self):
        return f"{self.name} ({self.address})"

    @property
    def average_rating(self):
        output = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(output, 1) if output else 0

    class Meta:
        verbose_name = 'Пространство'
        verbose_name_plural = 'Пространства'


class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='rooms/', verbose_name="Фото")


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _('Ожидает оплаты')
        CONFIRMED = 'confirmed', _('Подтверждено')
        CANCELED = 'canceled', _('Отменено')
        FINISHED = 'finished', _('Завершено')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', verbose_name="Пользователь")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings', verbose_name="Комната")

    start_time = models.DateTimeField(verbose_name="Время начала")
    end_time = models.DateTimeField(verbose_name="Время окончания")

    attendees_count = models.PositiveIntegerField(default=1, verbose_name="Кол-во участников")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Статус")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False, null=True, verbose_name="Итого")

    comment = models.TextField(blank=True, verbose_name="Комментарий")
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError(_("Начало должно быть раньше конца."))
            if self.start_time < timezone.now():
                raise ValidationError(_("Нельзя бронировать в прошлом."))

            overlapping = Booking.objects.filter(
                room=self.room, status=self.Status.CONFIRMED,
                start_time__lt=self.end_time, end_time__gt=self.start_time
            ).exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError(_("Место уже занято на это время."))

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            hours = Decimal(duration.total_seconds() / 3600)
            self.total_price = (self.room.price_per_hour * hours).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'


class Review(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reviews', verbose_name="Комната")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name="Пользователь")
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)], verbose_name="Оценка")
    comment = models.TextField(verbose_name="Комментарий")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        unique_together = ('room', 'user')
