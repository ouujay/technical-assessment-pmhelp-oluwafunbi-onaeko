# subscriptions/management/commands/setup_plans.py
from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan

class Command(BaseCommand):
    help = 'Create default subscription plans'

    def handle(self, *args, **options):
        plans = [
            {
                'tier': 'free',
                'name': 'Free Plan',
                'price': 0.00,
                'appointment_limit': 2,
                'features': {
                    'basic_medical_record_access': True,
                    'standard_support': True,
                    'appointments_per_month': 2
                }
            },
            {
                'tier': 'basic',
                'name': 'Basic Plan',
                'price': 9.99,
                'appointment_limit': 5,
                'features': {
                    'priority_booking': True,
                    'email_reminders': True,
                    'telehealth_appointments': True,
                    'appointments_per_month': 5
                }
            },
            {
                'tier': 'premium',
                'name': 'Premium Plan',
                'price': 19.99,
                'appointment_limit': None,  # Unlimited
                'features': {
                    'unlimited_appointments': True,
                    'advanced_medical_history_analytics': True,
                    'priority_support_24_7': True,
                    'family_account_sharing': True
                }
            }
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                tier=plan_data['tier'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created plan: {plan.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Plan already exists: {plan.name}')
                )