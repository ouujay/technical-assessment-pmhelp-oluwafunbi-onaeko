from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        plans = [
            dict(tier="free", name="Free", price=0, appointment_limit=2, features={"priorityBooking": False, "telehealth": False, "emailReminders": False}),
            dict(tier="basic", name="Basic", price=9.99, appointment_limit=5, features={"priorityBooking": True, "telehealth": True, "emailReminders": True}),
            dict(tier="premium", name="Premium", price=19.99, appointment_limit=None, features={"priorityBooking": True, "telehealth": True, "emailReminders": True}),
        ]
        for p in plans:
            SubscriptionPlan.objects.update_or_create(tier=p["tier"], defaults=p)
        self.stdout.write(self.style.SUCCESS("Seeded subscription plans"))
