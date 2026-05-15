from rest_framework import serializers

from .models import User, Category, Amenity, Room, RoomImage, Booking, Review


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'avatar', 'bio')


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = '__all__'


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ('id', 'image')


class RoomSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            'id', 'name', 'category', 'address', 'floor', 'capacity',
            'price_per_hour', 'amenities', 'images', 'description',
            'is_active', 'average_rating'
        )


class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    room_name = serializers.ReadOnlyField(source='room.name')

    class Meta:
        model = Booking
        fields = '__all__'

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Время начала должно быть раньше времени окончания.")
        return data


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = '__all__'
