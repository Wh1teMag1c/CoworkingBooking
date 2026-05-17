from datetime import timedelta
from decimal import Decimal

from api.models import Booking, Category, Payment, Review, Room
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class CoworkingTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username="testclient",
            email="client@test.com",
            password="testpassword",
            role="client",
        )
        self.admin_user = User.objects.create_user(
            username="testadmin",
            email="admin@test.com",
            password="adminpassword",
            role="admin",
            is_staff=True,
        )
        self.category = Category.objects.create(
            name="Test Category", slug="test-cat"
        )
        self.room = Room.objects.create(
            category=self.category,
            name="Test Room",
            capacity=10,
            price_per_hour=Decimal("1000.00"),
            is_active=True,
        )
        self.hidden_room = Room.objects.create(
            category=self.category,
            name="Hidden Room",
            capacity=5,
            price_per_hour=Decimal("500.00"),
            is_active=False,
        )
        self.now = timezone.now()

    def test_user_registration(self):
        url = reverse("user-list")
        data = {
            "username": "newuser",
            "email": "new@test.com",
            "password": "newpassword123",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_me_endpoint(self):
        url = reverse("user-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_me_endpoint(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("user-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testclient")

    def test_set_password(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("user-set-password")
        data = {
            "current_password": "testpassword",
            "new_password": "newpassword456",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("newpassword456"))

    def test_set_password_wrong_current(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("user-set-password")
        data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword456",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_active_rooms_as_client(self):
        url = reverse("room-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_all_rooms_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("room-list") + "?all=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_room_as_client_forbidden(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("room-list")
        data = {
            "name": "New Room",
            "capacity": 20,
            "price_per_hour": "2000.00",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_booking_success(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("booking-list")
        start = self.now + timedelta(days=1)
        end = start + timedelta(hours=2)
        data = {
            "room": self.room.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "attendees_count": 2,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")

    def test_booking_total_price_calculation(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("booking-list")
        start = self.now + timedelta(days=2)
        end = start + timedelta(hours=3)
        data = {
            "room": self.room.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.data["total_price"], "3000.00")

    def test_create_booking_past_date_fails(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("booking-list")
        start = self.now - timedelta(days=1)
        end = start + timedelta(hours=2)
        data = {
            "room": self.room.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_end_before_start_fails(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("booking-list")
        start = self.now + timedelta(days=1)
        end = start - timedelta(hours=2)
        data = {
            "room": self.room.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_overlapping_fails(self):
        self.client.force_authenticate(user=self.client_user)
        start = self.now + timedelta(days=3)
        end = start + timedelta(hours=2)
        Booking.objects.create(
            user=self.client_user,
            room=self.room,
            start_time=start,
            end_time=end,
            status="confirmed",
        )
        url = reverse("booking-list")
        data = {
            "room": self.room.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_can_only_see_own_bookings(self):
        Booking.objects.create(
            user=self.client_user,
            room=self.room,
            start_time=self.now + timedelta(days=1),
            end_time=self.now + timedelta(days=1, hours=1),
        )
        Booking.objects.create(
            user=self.admin_user,
            room=self.room,
            start_time=self.now + timedelta(days=2),
            end_time=self.now + timedelta(days=2, hours=1),
        )
        self.client.force_authenticate(user=self.client_user)
        url = reverse("booking-list")
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)

    def test_admin_can_see_all_bookings(self):
        Booking.objects.create(
            user=self.client_user,
            room=self.room,
            start_time=self.now + timedelta(days=1),
            end_time=self.now + timedelta(days=1, hours=1),
        )
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("booking-list") + "?all=true"
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)

    def test_cancel_booking_cancels_payment(self):
        booking = Booking.objects.create(
            user=self.client_user,
            room=self.room,
            start_time=self.now + timedelta(days=5),
            end_time=self.now + timedelta(days=5, hours=2),
            status="confirmed",
        )
        Payment.objects.create(
            booking=booking, amount=Decimal("2000.00"), status="success"
        )
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("booking-detail", args=[booking.id])
        data = {"status": "canceled"}
        self.client.patch(url, data)
        booking.refresh_from_db()
        self.assertEqual(booking.payment.status, "canceled")

    def test_create_review(self):
        self.client.force_authenticate(user=self.client_user)
        url = reverse("review-list")
        data = {"room": self.room.id, "rating": 5}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_prevent_duplicate_review(self):
        Review.objects.create(room=self.room, user=self.client_user, rating=4)
        self.client.force_authenticate(user=self.client_user)
        url = reverse("review-list")
        data = {"room": self.room.id, "rating": 5}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_room_average_rating(self):
        Review.objects.create(room=self.room, user=self.client_user, rating=4)
        Review.objects.create(room=self.room, user=self.admin_user, rating=5)
        self.assertEqual(self.room.average_rating, 4.5)

    def test_payment_creation_confirms_booking(self):
        self.client.force_authenticate(user=self.client_user)
        booking = Booking.objects.create(
            user=self.client_user,
            room=self.room,
            start_time=self.now + timedelta(days=6),
            end_time=self.now + timedelta(days=6, hours=1),
            status="pending",
        )
        url = reverse("payment-list")
        data = {"booking": booking.id, "amount": "1000.00"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_list_categories(self):
        url = reverse("category-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
