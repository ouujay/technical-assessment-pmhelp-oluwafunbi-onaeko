from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class MedicalRecord(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="medical_records")
    doctor  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_records")
    title   = models.CharField(max_length=120)
    notes   = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
