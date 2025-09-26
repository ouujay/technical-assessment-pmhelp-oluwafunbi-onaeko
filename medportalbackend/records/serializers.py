from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ("id","patient","doctor","title","notes","created_at")
        read_only_fields = ("doctor","created_at")
