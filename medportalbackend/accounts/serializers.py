from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    class Meta:
        model = User
        fields = ("username","email","password","role","first_name","last_name")

    def create(self, data):
        pwd = data.pop("password")
        user = User(**data)
        user.set_password(pwd)
        user.save()
        return user

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id","username","email","role","first_name","last_name")
