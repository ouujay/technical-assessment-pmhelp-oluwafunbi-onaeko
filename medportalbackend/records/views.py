from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import IsPatient, IsDoctor
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MyRecords(APIView):
    permission_classes = [IsPatient]
    def get(self, request):
        qs = MedicalRecord.objects.filter(patient=request.user).order_by("-created_at")
        return Response(MedicalRecordSerializer(qs, many=True).data)

class PatientRecords(APIView):
    permission_classes = [IsDoctor]
    def get(self, request, patient_id):
        patient = User.objects.get(id=patient_id, role="patient")
        qs = MedicalRecord.objects.filter(patient=patient).order_by("-created_at")
        return Response(MedicalRecordSerializer(qs, many=True).data)

    def post(self, request, patient_id):
        patient = User.objects.get(id=patient_id, role="patient")
        ser = MedicalRecordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rec = ser.save(patient=patient, doctor=request.user)
        return Response(MedicalRecordSerializer(rec).data, status=201)