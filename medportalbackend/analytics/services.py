# analytics/services.py
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from calendar import monthrange
from appointments.models import Appointment
from records.models import MedicalRecord
from subscriptions.models import UserSubscription, SubscriptionPlan
from django.contrib.auth import get_user_model

User = get_user_model()

def get_date_range(period='month'):
    """Get start and end dates for different periods"""
    now = timezone.now()
    
    if period == 'week':
        start = now - timedelta(days=7)
        end = now
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_day = monthrange(now.year, now.month)[1]
        end = now.replace(day=end_day, hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    else:  # all time
        start = None
        end = now
    
    return start, end

def calculate_session_hours(appointments):
    """Calculate total hours from appointments"""
    total_minutes = 0
    for appointment in appointments:
        if appointment.end and appointment.start:
            duration = appointment.end - appointment.start
            total_minutes += duration.total_seconds() / 60
    return round(total_minutes / 60, 2)

def get_doctor_analytics(doctor, period='month'):
    """Get analytics for a specific doctor"""
    start_date, end_date = get_date_range(period)
    
    # Base queryset for appointments
    appointments_qs = Appointment.objects.filter(doctor=doctor)
    if start_date:
        appointments_qs = appointments_qs.filter(start__gte=start_date)
    if end_date:
        appointments_qs = appointments_qs.filter(start__lte=end_date)
    
    # Get appointments data
    total_appointments = appointments_qs.count()
    completed_appointments = appointments_qs.filter(status='completed').count()
    scheduled_appointments = appointments_qs.filter(status='scheduled').count()
    canceled_appointments = appointments_qs.filter(status='canceled').count()
    
    # Calculate session hours (only for completed appointments)
    completed_appts = appointments_qs.filter(status='completed')
    total_hours = calculate_session_hours(completed_appts)
    
    # Unique patients served
    unique_patients = appointments_qs.values('patient').distinct().count()
    
    # Patient records created
    records_qs = MedicalRecord.objects.filter(doctor=doctor)
    if start_date:
        records_qs = records_qs.filter(created_at__gte=start_date)
    if end_date:
        records_qs = records_qs.filter(created_at__lte=end_date)
    
    records_created = records_qs.count()
    
    # Appointment types breakdown
    appointment_types = appointments_qs.values('visit_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Monthly trend (last 6 months)
    monthly_data = []
    for i in range(6):
        month_start = (timezone.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end_day = monthrange(month_start.year, month_start.month)[1]
        month_end = month_start.replace(day=month_end_day, hour=23, minute=59, second=59)
        
        month_appointments = Appointment.objects.filter(
            doctor=doctor,
            start__gte=month_start,
            start__lte=month_end
        ).count()
        
        monthly_data.append({
            'month': month_start.strftime('%B %Y'),
            'appointments': month_appointments
        })
    
    monthly_data.reverse()  # Show oldest to newest
    
    return {
        'period': period,
        'summary': {
            'total_appointments': total_appointments,
            'completed_appointments': completed_appointments,
            'scheduled_appointments': scheduled_appointments,
            'canceled_appointments': canceled_appointments,
            'unique_patients_served': unique_patients,
            'total_session_hours': total_hours,
            'medical_records_created': records_created,
            'completion_rate': round((completed_appointments / total_appointments * 100) if total_appointments > 0 else 0, 1)
        },
        'appointment_types': list(appointment_types),
        'monthly_trend': monthly_data
    }

def get_admin_analytics(period='month'):
    """Get system-wide analytics for admin"""
    start_date, end_date = get_date_range(period)
    
    # Base querysets
    appointments_qs = Appointment.objects.all()
    users_qs = User.objects.all()
    records_qs = MedicalRecord.objects.all()
    
    if start_date:
        appointments_qs = appointments_qs.filter(start__gte=start_date)
        users_qs = users_qs.filter(date_joined__gte=start_date)
        records_qs = records_qs.filter(created_at__gte=start_date)
    if end_date:
        appointments_qs = appointments_qs.filter(start__lte=end_date)
        users_qs = users_qs.filter(date_joined__lte=end_date)
        records_qs = records_qs.filter(created_at__lte=end_date)
    
    # User statistics
    total_users = User.objects.count()
    new_users = users_qs.count()
    patients_count = User.objects.filter(role='patient').count()
    doctors_count = User.objects.filter(role='doctor').count()
    admins_count = User.objects.filter(role='admin').count()
    
    # Appointment statistics
    total_appointments = appointments_qs.count()
    completed_appointments = appointments_qs.filter(status='completed').count()
    scheduled_appointments = appointments_qs.filter(status='scheduled').count()
    canceled_appointments = appointments_qs.filter(status='canceled').count()
    
    # Calculate total session hours and average appointment duration
    completed_appts = appointments_qs.filter(status='completed')
    total_hours = calculate_session_hours(completed_appts)
    
    if completed_appointments > 0:
        avg_duration = total_hours / completed_appointments
    else:
        avg_duration = 0
    
    # Subscription statistics
    subscription_stats = UserSubscription.objects.values('plan__tier').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Add users without subscriptions (free tier)
    users_with_subs = UserSubscription.objects.values_list('user_id', flat=True)
    free_users = User.objects.filter(role='patient').exclude(id__in=users_with_subs).count()
    
    subscription_breakdown = list(subscription_stats)
    if free_users > 0:
        subscription_breakdown.append({'plan__tier': 'free', 'count': free_users})
    
    # Revenue calculation (simplified)
    revenue_data = []
    for sub_stat in subscription_stats:
        plan = SubscriptionPlan.objects.filter(tier=sub_stat['plan__tier']).first()
        if plan:
            revenue = float(plan.price) * sub_stat['count']
            revenue_data.append({
                'tier': sub_stat['plan__tier'],
                'subscribers': sub_stat['count'],
                'monthly_revenue': revenue
            })
    
    total_monthly_revenue = sum(item['monthly_revenue'] for item in revenue_data)
    
    # Appointment types breakdown
    appointment_types = appointments_qs.values('visit_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Top performing doctors
    top_doctors = User.objects.filter(role='doctor').annotate(
        total_appointments=Count('doctor_appointments', 
                               filter=Q(doctor_appointments__start__gte=start_date) if start_date else Q()),
        completed_appointments=Count('doctor_appointments',
                                   filter=Q(doctor_appointments__status='completed') & 
                                         (Q(doctor_appointments__start__gte=start_date) if start_date else Q()))
    ).order_by('-total_appointments')[:5]
    
    top_doctors_data = []
    for doctor in top_doctors:
        top_doctors_data.append({
            'doctor_name': f"{doctor.first_name} {doctor.last_name}".strip() or doctor.username,
            'total_appointments': doctor.total_appointments,
            'completed_appointments': doctor.completed_appointments,
            'completion_rate': round((doctor.completed_appointments / doctor.total_appointments * 100) 
                                   if doctor.total_appointments > 0 else 0, 1)
        })
    
    # Daily appointment trend (last 30 days)
    daily_trend = []
    for i in range(30):
        day = timezone.now().date() - timedelta(days=i)
        day_appointments = Appointment.objects.filter(start__date=day).count()
        daily_trend.append({
            'date': day.strftime('%Y-%m-%d'),
            'appointments': day_appointments
        })
    
    daily_trend.reverse()  # Show oldest to newest
    
    return {
        'period': period,
        'user_statistics': {
            'total_users': total_users,
            'new_users_this_period': new_users,
            'patients': patients_count,
            'doctors': doctors_count,
            'admins': admins_count
        },
        'appointment_statistics': {
            'total_appointments': total_appointments,
            'completed_appointments': completed_appointments,
            'scheduled_appointments': scheduled_appointments,
            'canceled_appointments': canceled_appointments,
            'completion_rate': round((completed_appointments / total_appointments * 100) if total_appointments > 0 else 0, 1),
            'total_session_hours': total_hours,
            'average_appointment_duration': round(avg_duration, 2)
        },
        'subscription_statistics': {
            'breakdown': subscription_breakdown,
            'revenue_data': revenue_data,
            'total_monthly_revenue': total_monthly_revenue
        },
        'appointment_types': list(appointment_types),
        'top_doctors': top_doctors_data,
        'daily_trend': daily_trend,
        'medical_records_created': records_qs.count()
    }