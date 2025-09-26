from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class SubscriptionPlan(models.Model):
    class Tier(models.TextChoices):
        FREE="free","Free"; BASIC="basic","Basic"; PREMIUM="premium","Premium"
    tier = models.CharField(max_length=16, choices=Tier.choices, unique=True)
    name = models.CharField(max_length=64)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    appointment_limit = models.PositiveIntegerField(null=True, blank=True)  # None=unlimited
    features = models.JSONField(default=dict, blank=True)

    def __str__(self): return self.name

class UserSubscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE="active","Active"; CANCELED="canceled","Canceled"; EXPIRED="expired","Expired"
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    starts_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField(null=True, blank=True)
