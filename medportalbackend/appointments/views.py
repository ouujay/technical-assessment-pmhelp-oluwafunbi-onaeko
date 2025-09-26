# appointments/views.py - COMPLETE FIX

from datetime import date, datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from accounts.permissions import IsPatient, IsDoctor
from .models import Appointment
from .serializers import AppointmentCreateSerializer, AppointmentSerializer
from .services import generate_slots_for_date, can_book_appointment, overlaps

User = get_user_model()

class DoctorSlots(APIView):
    def get(self, request, doctor_id):
        d = parse_date(request.GET.get("date", ""))
        if not d:
            return Response({"detail": "date required YYYY-MM-DD"}, status=400)
        
        try:
            doctor = User.objects.get(id=doctor_id, role="doctor")
        except User.DoesNotExist:
            return Response(
                {"detail": f"Doctor with ID {doctor_id} not found"}, 
                status=404
            )
        
        slots = generate_slots_for_date(doctor, d)
        slots_data = [{"start": s.isoformat(), "end": e.isoformat()} for (s, e) in slots]
        
        return Response({
            "doctor_id": doctor.id,
            "date": str(d),
            "slot_duration_minutes": 60,
            "slots": slots_data
        })

class MyAppointments(APIView):
    permission_classes = [IsPatient]
    
    def get(self, request):
        qs = Appointment.objects.filter(patient=request.user).order_by("-start")
        return Response(AppointmentSerializer(qs, many=True).data)

    def post(self, request):
        # Check quota
        ok, err = can_book_appointment(request.user)
        if not ok:
            return Response(err, status=403)

        ser = AppointmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        
        # Doctor is already a User object from the serializer
        doctor = ser.validated_data["doctor"]
        start = ser.validated_data["start"]
        end = ser.validated_data["end"]
        
        if start <= timezone.now():
            return Response({"detail": "Must be future"}, status=400)

        # Simple conflict checks
        date_only = start.date()
        valid_slot = any(
            start == s and end == e 
            for (s, e) in generate_slots_for_date(doctor, date_only)
        )
        
        if not valid_slot:
            return Response({"detail": "Slot not available"}, status=409)

        # Create appointment
        appt = ser.save(patient=request.user)
        return Response(AppointmentSerializer(appt).data, status=201)

class DoctorAppointments(APIView):
    permission_classes = [IsDoctor]
    
    def get(self, request):
        qs = Appointment.objects.filter(doctor=request.user).order_by("-start")
        return Response(AppointmentSerializer(qs, many=True).data)

class DoctorsList(APIView):
    """Get list of all doctors for booking interface"""
    
    def get(self, request):
        doctors = User.objects.filter(role="doctor").values(
            'id', 'first_name', 'last_name', 'email'
        )
        
        # Add mock data for frontend compatibility
        doctors_data = []
        specialties = ['General Practice', 'Cardiology', 'Dermatology']
        
        for i, doctor in enumerate(doctors):
            doctors_data.append({
                'id': doctor['id'],
                'name': f"Dr. {doctor['first_name']} {doctor['last_name']}",
                'specialty': specialties[i % len(specialties)],
                'avatar': f"{doctor['first_name'][0]}{doctor['last_name'][0]}",
                'availability': 'Available today' if i == 0 else f'Next: Tomorrow {2+i}PM',
                'rating': 4.9 - (i * 0.1),
                'experience': f'{15 - i} years'
            })
        
        return Response(doctors_data)

class AppointmentDetail(APIView):
    """Update appointment status - for doctors"""
    permission_classes = [IsDoctor]
    
    def patch(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=request.user)
        except Appointment.DoesNotExist:
            return Response(
                {"error": "Appointment not found or you don't have permission"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        
        if new_status not in ['scheduled', 'completed', 'canceled']:
            return Response(
                {"error": "Invalid status. Must be: scheduled, completed, or canceled"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = new_status
        appointment.save()
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )