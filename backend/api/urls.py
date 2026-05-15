from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet, CategoryViewSet, AmenityViewSet,
    RoomViewSet, BookingViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'amenities', AmenityViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
