from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        DOCTOR = "doctor", "Doctor"
        ADMIN  = "admin", "Admin"
    email = models.EmailField(unique=True)
    role  = models.CharField(max_length=16, choices=Role.choices, default=Role.PATIENT)

    USERNAME_FIELD = "username"  # keep default; you can switch to email later
    REQUIRED_FIELDS = ["email", "role"]
