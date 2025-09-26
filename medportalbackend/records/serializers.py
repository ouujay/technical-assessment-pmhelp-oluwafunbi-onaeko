# medportalbackend/records/serializers.py - FIXED

from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    # Add doctor_name for display purposes
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = ("id", "patient", "doctor", "doctor_name", "title", "notes", "created_at")
        read_only_fields = ("patient", "doctor", "doctor_name", "created_at")
    
    def get_doctor_name(self, obj):
        if obj.doctor:
            return f"{obj.doctor.first_name} {obj.doctor.last_name}".strip() or obj.doctor.username
        return None


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating medical records - only title and notes required"""
    
    class Meta:
        model = MedicalRecord
        fields = ("title", "notes")  # Only these fields from frontend
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        return value.strip()
    
    def validate_notes(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Notes are required")
        return value.strip()