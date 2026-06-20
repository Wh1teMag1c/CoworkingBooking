from datetime import timedelta
from decimal import Decimal

from api.models import Booking, Category, Review, Room
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone
from hypothesis import given
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypTestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class FuzzingTests(HypTestCase):
    def setUp(self):
        self.user, _ = User.objects.get_or_create(
            username="fuzzuser",
            defaults={"email": "fuzz@test.com", "password": "pwd"},
        )
        self.category, _ = Category.objects.get_or_create(
            name="FuzzCat", slug="f-cat"
        )
        self.room, _ = Room.objects.get_or_create(
            category=self.category,
            name="Fuzz Room",
            defaults={"capacity": 10, "price_per_hour": Decimal("100.00")},
        )
        self.now = timezone.now()

    @given(st.text(min_size=101))
    def test_fuzz_room_name_length(self, long_name):
        room = Room(
            category=self.category,
            name=long_name,
            capacity=5,
            price_per_hour=Decimal("100.00"),
        )
        with self.assertRaises(ValidationError):
            room.full_clean()

    @given(
        st.integers(min_value=-1000, max_value=-1),
        st.decimals(min_value=Decimal("-1000.0"), max_value=Decimal("-0.1")),
    )
    def test_fuzz_negative_capacity_and_price(self, cap, price):
        room = Room(
            category=self.category,
            name="Bad Room",
            capacity=cap,
            price_per_hour=price,
        )
        with self.assertRaises(ValidationError):
            room.full_clean()

    @given(st.integers(min_value=1, max_value=10000))
    def test_fuzz_total_price_calculation(self, hours):
        start = self.now + timedelta(days=10)
        end = start + timedelta(hours=hours)
        booking = Booking(
            user=self.user,
            room=self.room,
            start_time=start,
            end_time=end,
        )
        booking.save()
        expected_price = (Decimal("100.00") * Decimal(hours)).quantize(
            Decimal("0.01")
        )
        self.assertEqual(booking.total_price, expected_price)

    @given(st.integers(min_value=1, max_value=100))
    def test_fuzz_end_time_before_start_time(self, hours_offset):
        start = self.now + timedelta(days=10)
        end = start - timedelta(hours=hours_offset)
        booking = Booking(
            user=self.user,
            room=self.room,
            start_time=start,
            end_time=end,
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    @given(st.integers(min_value=1, max_value=3650))
    def test_fuzz_booking_in_past(self, days_in_past):
        start = self.now - timedelta(days=days_in_past)
        end = start + timedelta(hours=2)
        booking = Booking(
            user=self.user,
            room=self.room,
            start_time=start,
            end_time=end,
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    @given(st.integers(min_value=1, max_value=100))
    def test_fuzz_zero_duration_booking(self, days_ahead):
        start = self.now + timedelta(days=days_ahead)
        end = start
        booking = Booking(
            user=self.user,
            room=self.room,
            start_time=start,
            end_time=end,
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    @given(st.integers(min_value=-1000, max_value=-1))
    def test_fuzz_invalid_attendees_count(self, attendees):
        start = self.now + timedelta(days=1)
        end = start + timedelta(hours=1)
        booking = Booking(
            user=self.user,
            room=self.room,
            start_time=start,
            end_time=end,
            attendees_count=attendees,
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    @given(st.integers().filter(lambda x: x < 1 or x > 5))
    def test_fuzz_invalid_review_rating(self, invalid_rating):
        review = Review(
            room=self.room,
            user=self.user,
            rating=invalid_rating,
        )
        with self.assertRaises(ValidationError):
            review.full_clean()

    @given(st.text(max_size=0))
    def test_fuzz_empty_category_name(self, empty_name):
        category = Category(
            name=empty_name,
            slug="empty-cat",
            description="Test",
        )
        with self.assertRaises(ValidationError):
            category.full_clean()


class FuzzingAPITests(HypTestCase):
    def setUp(self):
        self.api_client = APIClient()
        self.user, _ = User.objects.get_or_create(
            username="api_fuzzer",
            defaults={"email": "api@test.com", "password": "pwd"},
        )
        self.category, _ = Category.objects.get_or_create(name="ApiCat", slug="api-cat")
        self.room, _ = Room.objects.get_or_create(
            category=self.category,
            name="Api Room",
            defaults={"capacity": 10, "price_per_hour": Decimal("100.00"), "is_active": True},
        )

    @given(
        st.text(max_size=500),
        st.text(max_size=500),
        st.integers(min_value=-1000, max_value=1000)
    )
    def test_fuzz_booking_api_endpoint(self, fuzz_start, fuzz_end, fuzz_attendees):
        self.api_client.force_authenticate(user=self.user)
        url = reverse("booking-list")

        payload = {
            "room": self.room.id,
            "start_time": fuzz_start,
            "end_time": fuzz_end,
            "attendees_count": fuzz_attendees
        }

        response = self.api_client.post(url, payload, format='json')

        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @given(st.text(min_size=10, max_size=200))
    def test_fuzz_jwt_authentication_header(self, garbage_token):
        self.api_client.credentials(HTTP_AUTHORIZATION='Bearer ' + garbage_token)
        url = reverse("user-me")

        response = self.api_client.get(url)

        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
