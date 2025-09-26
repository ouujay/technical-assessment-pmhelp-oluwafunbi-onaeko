# analytics/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from accounts.permissions import IsAdmin, IsDoctor
from appointments.models import Appointment
from subscriptions.models import UserSubscription
from records.models import MedicalRecord

User = get_user_model()

class DoctorAnalytics(APIView):
    """Analytics for doctors about their practice"""
    permission_classes = [IsAuthenticated, IsDoctor]
    
    def get(self, request):
        period = request.GET.get('period', 'month')
        doctor = request.user
        
        # Calculate date range
        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:  # month
            start_date = now - timedelta(days=30)
        
        # Get appointments data
        appointments = Appointment.objects.filter(
            doctor=doctor,
            start__gte=start_date
        )
        
        total_appointments = appointments.count()
        completed = appointments.filter(status='completed').count()
        scheduled = appointments.filter(status='scheduled').count()
        canceled = appointments.filter(status='canceled').count()
        
        # Get unique patients
        total_patients = appointments.values('patient').distinct().count()
        
        # Calculate hours spent (assuming 1 hour per appointment)
        hours_spent = completed
        
        # Previous period comparison
        prev_start = start_date - (now - start_date)
        prev_appointments = Appointment.objects.filter(
            doctor=doctor,
            start__gte=prev_start,
            start__lt=start_date
        ).count()
        
        change_percentage = 0
        if prev_appointments > 0:
            change_percentage = ((total_appointments - prev_appointments) / prev_appointments) * 100
        
        return Response({
            'total_patients': total_patients,
            'monthly_appointments': total_appointments,
            'completed_appointments': completed,
            'scheduled_appointments': scheduled,
            'canceled_appointments': canceled,
            'hours_spent': hours_spent,
            'monthly_change': f'+{int(change_percentage)}%' if change_percentage > 0 else f'{int(change_percentage)}%',
            'new_patients': total_patients,
            'period': period
        })


class SystemAnalytics(APIView):
    """System-wide analytics for admins"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        period = request.GET.get('period', 'month')
        
        # Calculate date range
        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:  # month
            start_date = now - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        total_patients = User.objects.filter(role='patient').count()
        total_doctors = User.objects.filter(role='doctor').count()
        new_users = User.objects.filter(date_joined__gte=start_date).count()
        
        # Appointment statistics
        total_appointments = Appointment.objects.filter(start__gte=start_date).count()
        completed_appointments = Appointment.objects.filter(
            start__gte=start_date,
            status='completed'
        ).count()
        
        # Subscription statistics
        active_subscriptions = UserSubscription.objects.filter(
            status='active'
        ).count()
        
        # Revenue calculation (mock for now)
        premium_subs = UserSubscription.objects.filter(
            status='active',
            plan__tier='premium'
        ).count()
        basic_subs = UserSubscription.objects.filter(
            status='active',
            plan__tier='basic'
        ).count()
        
        monthly_revenue = (premium_subs * 19.99) + (basic_subs * 9.99)
        
        # Recent activity
        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_activity = []
        
        for user in recent_users:
            hours_ago = int((now - user.date_joined).total_seconds() / 3600)
            if hours_ago < 1:
                time_str = 'Just now'
            elif hours_ago < 24:
                time_str = f'{hours_ago} hours ago'
            else:
                days = hours_ago // 24
                time_str = f'{days} days ago'
            
            recent_activity.append({
                'id': user.id,
                'type': 'user_registered',
                'description': f'New {user.role} registered',
                'user': f'{user.first_name} {user.last_name}' if user.first_name else user.username,
                'timestamp': time_str
            })
        
        return Response({
            'totalUsers': total_users,
            'totalDoctors': total_doctors,
            'totalPatients': total_patients,
            'totalAppointments': total_appointments,
            'monthlyRevenue': monthly_revenue,
            'activeSubscriptions': active_subscriptions,
            'newUsers': new_users,
            'completedAppointments': completed_appointments,
            'recentActivity': recent_activity,
            'period': period
        })


class AdminUsersList(APIView):
    """List users for admin dashboard"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        limit = int(request.GET.get('limit', 10))
        offset = int(request.GET.get('offset', 0))
        role_filter = request.GET.get('role', '')
        
        # Build queryset
        queryset = User.objects.all()
        
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        # Get total count
        total = queryset.count()
        
        # Paginate
        users = queryset.order_by('-date_joined')[offset:offset + limit]
        
        # Format user data
        users_data = []
        for user in users:
            user_info = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            
            # Add appointment count
            if user.role == 'patient':
                user_info['appointments_count'] = user.patient_appointments.count()
            elif user.role == 'doctor':
                user_info['appointments_count'] = user.doctor_appointments.count()
            
            users_data.append(user_info)
        
        return Response({
            'users': users_data,
            'total': total,
            'limit': limit,
            'offset': offset
        })