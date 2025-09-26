# appointments/serializers.py - FIXED VERSION

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Appointment

User = get_user_model()

class AppointmentCreateSerializer(serializers.ModelSerializer):
    # Accept doctor as an integer ID
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='doctor')
    )
    
    class Meta:
        model = Appointment
        fields = ("doctor", "start", "end", "visit_type")

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ("id", "patient", "doctor", "start", "end", "status", "visit_type")
        read_only_fields = ("patient", "status")