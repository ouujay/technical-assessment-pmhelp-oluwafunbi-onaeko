# accounts/management/commands/create_sample_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random
from appointments.models import Appointment, AvailabilityTemplate
from records.models import MedicalRecord
from subscriptions.models import SubscriptionPlan, UserSubscription

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing analytics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing sample data before creating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing sample data...')
            Appointment.objects.all().delete()
            MedicalRecord.objects.all().delete()
            UserSubscription.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write('Creating sample users...')
        
        # Create sample doctors
        doctors = []
        for i in range(3):
            doctor = User.objects.create_user(
                username=f'doctor{i+1}',
                email=f'doctor{i+1}@medportal.com',
                password='password123',
                role='doctor',
                first_name=f'Doctor{i+1}',
                last_name='Smith'
            )
            doctors.append(doctor)
            
            # Create availability template for each doctor
            for weekday in range(5):  # Monday to Friday
                AvailabilityTemplate.objects.create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=datetime.strptime('09:00', '%H:%M').time(),
                    end_time=datetime.strptime('17:00', '%H:%M').time()
                )
        
        # Create sample patients
        patients = []
        plans = list(SubscriptionPlan.objects.all())
        
        for i in range(10):
            patient = User.objects.create_user(
                username=f'patient{i+1}',
                email=f'patient{i+1}@medportal.com',
                password='password123',
                role='patient',
                first_name=f'Patient{i+1}',
                last_name='Johnson'
            )
            patients.append(patient)
            
            # Assign random subscription plan (some patients get plans)
            if random.choice([True, False]) and plans:
                plan = random.choice(plans)
                if plan.tier != 'free':  # Only create subscription for non-free plans
                    UserSubscription.objects.create(
                        user=patient,
                        plan=plan,
                        status=UserSubscription.Status.ACTIVE
                    )

        # Create sample appointments from the last 3 months
        self.stdout.write('Creating sample appointments...')
        statuses = ['scheduled', 'completed', 'canceled']
        visit_types = ['in_person', 'telehealth']
        
        start_date = timezone.now() - timedelta(days=90)
        
        for _ in range(50):
            doctor = random.choice(doctors)
            patient = random.choice(patients)
            
            # Random date in the last 3 months
            random_days = random.randint(0, 90)
            appointment_date = start_date + timedelta(days=random_days)
            
            # Set time to business hours
            hour = random.randint(9, 16)
            appointment_start = appointment_date.replace(
                hour=hour, 
                minute=0, 
                second=0, 
                microsecond=0
            )
            appointment_end = appointment_start + timedelta(hours=1)
            
            # Most past appointments should be completed
            if appointment_start < timezone.now() - timedelta(days=1):
                status = random.choices(
                    ['completed', 'canceled'],
                    weights=[0.8, 0.2]
                )[0]
            else:
                status = 'scheduled'
            
            Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                start=appointment_start,
                end=appointment_end,
                status=status,
                visit_type=random.choice(visit_types)
            )

        # Create sample medical records
        self.stdout.write('Creating sample medical records...')
        completed_appointments = Appointment.objects.filter(status='completed')
        
        # Create records for some completed appointments
        sample_notes = [
            'Patient reported feeling much better after medication',
            'Routine checkup - all vitals normal',
            'Follow-up appointment scheduled for next month',
            'Prescribed new medication for condition',
            'Patient advised to rest and increase fluid intake',
            'Lab results reviewed - all within normal range',
            'Discussed lifestyle changes with patient'
        ]
        
        sample_titles = [
            'Routine Checkup',
            'Follow-up Visit',
            'Medication Review',
            'Health Consultation',
            'Treatment Plan Review',
            'Diagnostic Review',
            'Wellness Check'
        ]
        
        for appointment in random.sample(list(completed_appointments), 
                                       min(30, len(completed_appointments))):
            MedicalRecord.objects.create(
                patient=appointment.patient,
                doctor=appointment.doctor,
                title=random.choice(sample_titles),
                notes=random.choice(sample_notes),
                created_at=appointment.start + timedelta(minutes=30)
            )

        # Create admin user
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@medportal.com',
            password='admin123',
            role='admin',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created sample data:\n'
                f'- {len(doctors)} doctors\n'
                f'- {len(patients)} patients\n'
                f'- {Appointment.objects.count()} appointments\n'
                f'- {MedicalRecord.objects.count()} medical records\n'
                f'- 1 admin user\n'
                f'\nLogin credentials:\n'
                f'Doctors: doctor1/doctor2/doctor3 (password: password123)\n'
                f'Patients: patient1-patient10 (password: password123)\n'
                f'Admin: admin (password: admin123)'
            )
        )