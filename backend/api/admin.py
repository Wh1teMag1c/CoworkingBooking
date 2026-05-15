from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Category, Amenity, Room, RoomImage, Booking, Review


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('role', 'phone_number', 'bio', 'avatar')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon')
    search_fields = ('name',)


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'address', 'capacity', 'price_per_hour', 'is_active')
    list_filter = ('category', 'is_active', 'floor')
    search_fields = ('name', 'address')
    filter_horizontal = ('amenities',)
    inlines = [RoomImageInline]


# 6. Бронирования
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'user', 'start_time', 'end_time', 'status', 'total_price')
    list_filter = ('status', 'start_time', 'room')
    search_fields = ('user__username', 'user__email', 'room__name')
    readonly_fields = ('total_price',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('room', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
