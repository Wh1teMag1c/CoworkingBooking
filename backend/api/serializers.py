from rest_framework import serializers

from .models import (
    Amenity,
    Booking,
    Category,
    Payment,
    Review,
    Room,
    RoomImage,
    User,
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "avatar",
            "bio",
            "is_staff",
        )
        read_only_fields = ("is_staff",)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = "__all__"


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ("id", "image")


class RoomSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            "id",
            "name",
            "category",
            "address",
            "floor",
            "capacity",
            "price_per_hour",
            "amenities",
            "images",
            "description",
            "is_active",
            "average_rating",
        )


class BookingRoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            "id",
            "name",
            "address",
            "floor",
            "capacity",
            "price_per_hour",
            "images",
        )


class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.username")
    room_name = serializers.ReadOnlyField(source="room.name")
    room_details = BookingRoomSerializer(source="room", read_only=True)
    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ("user",)

    def get_is_reviewed(self, obj):
        return Review.objects.filter(room=obj.room, user=obj.user).exists()

    def validate(self, data):
        start_time = data.get(
            "start_time", self.instance.start_time if self.instance else None
        )
        end_time = data.get(
            "end_time", self.instance.end_time if self.instance else None
        )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                "Время начала должно быть раньше времени окончания."
            )
        return data


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ("user",)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
