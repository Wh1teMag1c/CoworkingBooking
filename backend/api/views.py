from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

from .models import (
    Amenity,
    Booking,
    Category,
    Payment,
    Review,
    Room,
    User,
)
from .serializers import (
    AmenitySerializer,
    BookingSerializer,
    CategorySerializer,
    PaymentSerializer,
    ReviewSerializer,
    RoomSerializer,
    UserSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ["me", "set_password"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.is_superuser and self.request.user != instance:
            raise DRFValidationError(
                {"detail": ["Запрещено изменять права создателя платформы."]}
            )
        serializer.save()

    @action(
        detail=False,
        methods=["get", "patch"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        if request.method == "GET":
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == "PATCH":
            serializer = self.get_serializer(
                request.user, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_password(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not user.check_password(current_password):
            raise DRFValidationError(
                {"current_password": ["Неверный текущий пароль."]}
            )

        user.set_password(new_password)
        user.save()
        return Response({"status": "success"})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = Room.objects.all()
        user = self.request.user

        if user.is_anonymous:
            return queryset.filter(is_active=True)

        is_privileged = user.is_staff or getattr(user, "role", "") == "admin"
        action_allowed = self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]

        if action_allowed and is_privileged:
            return queryset

        show_all = self.request.query_params.get("all")
        if show_all and is_privileged:
            return queryset

        return queryset.filter(is_active=True)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except DjangoValidationError as e:
            error_msg = (
                e.message_dict if hasattr(e, "message_dict") else e.messages
            )
            raise DRFValidationError(error_msg)

    def perform_update(self, serializer):
        try:
            instance = serializer.save()
            if (
                    instance.status == Booking.Status.CANCELED
                    and hasattr(instance, "payment")
            ):
                instance.payment.status = Payment.Status.CANCELED
                instance.payment.save()
        except DjangoValidationError as e:
            error_msg = (
                e.message_dict if hasattr(e, "message_dict") else e.messages
            )
            raise DRFValidationError(error_msg)

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Booking.objects.none()

        queryset = Booking.objects.all()
        is_privileged = user.is_staff or getattr(user, "role", "") == "admin"

        if not is_privileged:
            queryset = queryset.filter(user=user)
        else:
            action_allowed = self.action in ["retrieve", "update", "partial_update", "destroy"]
            show_all = self.request.query_params.get("all")
            if not (action_allowed or show_all):
                queryset = queryset.filter(user=user)

        room_id = self.request.query_params.get("room")
        if room_id:
            return queryset.filter(room_id=room_id)

        return queryset


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        room = serializer.validated_data["room"]
        user = self.request.user
        if Review.objects.filter(room=room, user=user).exists():
            raise DRFValidationError({"detail": "Отзыв уже существует."})
        serializer.save(user=user)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", "") == "admin":
            return Payment.objects.all()
        return Payment.objects.filter(booking__user=user)

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]

        if booking.user != self.request.user:
            raise DRFValidationError({"detail": "Вы не можете оплатить чужое бронирование."})

        payment = serializer.save()
        booking.status = Booking.Status.CONFIRMED
        booking.save()
