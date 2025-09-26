from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class AvailabilityTemplate(models.Model):
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="weekly_templates")
    weekday = models.IntegerField()  # 0=Mon ... 6=Sun
    start_time = models.TimeField()
    end_time   = models.TimeField()

class UnavailableBlock(models.Model):
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="unavailable_blocks")
    start = models.DateTimeField()
    end   = models.DateTimeField()
    reason = models.CharField(max_length=120, blank=True)

class Appointment(models.Model):
    STATUS = (("scheduled","scheduled"),("completed","completed"),("canceled","canceled"))
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient_appointments")
    doctor  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor_appointments")
    start   = models.DateTimeField()
    end     = models.DateTimeField()
    status  = models.CharField(max_length=16, choices=STATUS, default="scheduled")
    visit_type = models.CharField(max_length=16, default="in_person")  # or telehealth
