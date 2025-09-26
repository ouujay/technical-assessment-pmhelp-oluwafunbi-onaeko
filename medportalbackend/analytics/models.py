from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class DoctorAnalytics(models.Model):
    """Track doctor practice analytics"""
    doctor = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="analytics"
    )
    total_patients = models.PositiveIntegerField(default=0)
    total_appointments = models.PositiveIntegerField(default=0)
    total_hours_worked = models.FloatField(default=0.0)
    monthly_patients = models.PositiveIntegerField(default=0)
    monthly_appointments = models.PositiveIntegerField(default=0)
    monthly_hours = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

class SystemAnalytics(models.Model):
    """Track system-wide analytics"""
    date = models.DateField(unique=True)
    total_users = models.PositiveIntegerField(default=0)
    total_patients = models.PositiveIntegerField(default=0)
    total_doctors = models.PositiveIntegerField(default=0)
    daily_appointments = models.PositiveIntegerField(default=0)
    daily_registrations = models.PositiveIntegerField(default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active_subscriptions = models.JSONField(default=dict)  # {"free": 10, "basic": 5, "premium": 2}
    
    class Meta:
        ordering = ['-date']