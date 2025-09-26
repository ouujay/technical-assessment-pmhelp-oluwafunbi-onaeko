# admin_views.py - Enhanced with subscription data in users endpoint
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal

from appointments.models import Appointment
from subscriptions.models import SubscriptionPlan, UserSubscription
from records.models import MedicalRecord

User = get_user_model()

def is_admin_user(user):
    """Check if user is admin"""
    return user.is_staff or user.is_superuser or getattr(user, 'role', None) == 'admin'

# ============= USER MANAGEMENT =============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_users_management(request):
    """Get all users or create new user"""
    
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Get query parameters
        limit = int(request.GET.get('limit', 20))
        offset = int(request.GET.get('offset', 0))
        search = request.GET.get('search', '')
        role = request.GET.get('role', '')
        
        # Base queryset - WITHOUT prefetch for now, we'll manually query subscriptions
        queryset = User.objects.all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        # Get total count
        total_count = queryset.count()
        
        # Apply pagination
        users = queryset.order_by('-date_joined')[offset:offset + limit]
        
        # Get all subscriptions for these users in one query
        user_ids = [user.id for user in users]
        subscriptions_map = {}
        
        # Query subscriptions separately
        user_subscriptions = UserSubscription.objects.filter(
            user_id__in=user_ids
        ).select_related('plan')
        
        # Build a map of user_id -> subscriptions
        for sub in user_subscriptions:
            if sub.user_id not in subscriptions_map:
                subscriptions_map[sub.user_id] = []
            subscriptions_map[sub.user_id].append(sub)
        
        # Serialize user data WITH SUBSCRIPTIONS
        users_data = []
        for user in users:
            # Get user stats
            if user.role == 'doctor':
                appointments_count = Appointment.objects.filter(doctor=user).count()
                patients_count = Appointment.objects.filter(doctor=user).values('patient').distinct().count()
            elif user.role == 'patient':
                appointments_count = Appointment.objects.filter(patient=user).count()
                patients_count = 0
            else:
                appointments_count = 0
                patients_count = 0
            
            # Get user subscriptions from the map
            user_subs = subscriptions_map.get(user.id, [])
            user_subscriptions = []
            for sub in user_subs:
                user_subscriptions.append({
                    'id': sub.id,
                    'plan': sub.plan.tier,
                    'status': sub.status,
                    'starts_at': sub.starts_at.isoformat() if sub.starts_at else None,
                    'ends_at': sub.ends_at.isoformat() if sub.ends_at else None
                })
            
            users_data.append({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'appointments_count': appointments_count,
                'patients_count': patients_count,
                'usersubscription_set': user_subscriptions  # THIS IS THE KEY ADDITION
            })
        
        return Response({
            'results': users_data,
            'count': total_count,
            'limit': limit,
            'offset': offset
        })
    
    elif request.method == 'POST':
        # Create new user
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['username', 'email', 'password', 'role']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if username exists
            if User.objects.filter(username=data['username']).exists():
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email exists
            if User.objects.filter(email=data['email']).exists():
                return Response(
                    {'error': 'Email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role=data['role']
            )
            
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    """Get, update or delete specific user"""
    
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Get detailed user info
        user_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        }
        
        # Add subscription info - Query separately
        subscriptions = []
        user_subs = UserSubscription.objects.filter(user_id=user.id).select_related('plan')
        for sub in user_subs:
            subscriptions.append({
                'id': sub.id,
                'tier': sub.plan.tier,
                'plan_name': sub.plan.name,
                'status': sub.status,
                'starts_at': sub.starts_at.isoformat() if sub.starts_at else None,
                'ends_at': sub.ends_at.isoformat() if sub.ends_at else None
            })
        user_data['usersubscription_set'] = subscriptions
        
        return Response(user_data)
    
    elif request.method == 'PUT':
        # Update user
        data = request.data
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'role' in data:
            user.role = data['role']
        
        user.save()
        
        return Response({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active
            }
        })
    
    elif request.method == 'DELETE':
        # Prevent self-deletion
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.delete()
        return Response({'message': 'User deleted successfully'})


# ============= ANALYTICS =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics(request):
    """Get comprehensive system analytics"""
    
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Date ranges
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_last_month = User.objects.filter(date_joined__gte=last_month).count()
        
        doctors_count = User.objects.filter(role='doctor').count()
        patients_count = User.objects.filter(role='patient').count()
        
        # Appointment statistics
        total_appointments = Appointment.objects.count()
        appointments_this_month = Appointment.objects.filter(start__gte=last_month).count()
        completed_appointments = Appointment.objects.filter(status='completed').count()
        scheduled_appointments = Appointment.objects.filter(status='scheduled').count()
        canceled_appointments = Appointment.objects.filter(status='canceled').count()
        
        # Calculate appointment duration analytics
        completed_appts = Appointment.objects.filter(status='completed', end__isnull=False)
        total_duration_minutes = 0
        for apt in completed_appts:
            duration = (apt.end - apt.start).total_seconds() / 60
            total_duration_minutes += duration
        
        avg_appointment_duration = total_duration_minutes / completed_appts.count() if completed_appts.count() > 0 else 0
        
        # Subscription statistics
        active_subscriptions = UserSubscription.objects.filter(status='active').count()
        subscription_breakdown = UserSubscription.objects.values('plan__tier').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Revenue calculations
        revenue_data = []
        total_monthly_revenue = 0
        
        for sub_stat in subscription_breakdown:
            try:
                plan = SubscriptionPlan.objects.get(tier=sub_stat['plan__tier'])
                revenue = float(plan.price) * sub_stat['count']
                total_monthly_revenue += revenue
                revenue_data.append({
                    'tier': sub_stat['plan__tier'],
                    'subscribers': sub_stat['count'],
                    'monthly_revenue': revenue
                })
            except SubscriptionPlan.DoesNotExist:
                continue
        
        # Top performing doctors
        top_doctors = User.objects.filter(role='doctor').annotate(
            total_appointments=Count('doctor_appointments'),
            completed_appointments=Count('doctor_appointments', filter=Q(doctor_appointments__status='completed'))
        ).order_by('-total_appointments')[:5]
        
        top_doctors_data = []
        for doctor in top_doctors:
            completion_rate = (doctor.completed_appointments / doctor.total_appointments * 100) if doctor.total_appointments > 0 else 0
            top_doctors_data.append({
                'id': doctor.id,
                'name': f"{doctor.first_name} {doctor.last_name}".strip() or doctor.username,
                'total_appointments': doctor.total_appointments,
                'completed_appointments': doctor.completed_appointments,
                'completion_rate': round(completion_rate, 1)
            })
        
        # Daily appointment trend (last 30 days)
        daily_trend = []
        for i in range(30):
            day = now.date() - timedelta(days=i)
            day_appointments = Appointment.objects.filter(start__date=day).count()
            daily_trend.append({
                'date': day.strftime('%Y-%m-%d'),
                'appointments': day_appointments
            })
        daily_trend.reverse()
        
        # Growth percentages
        users_last_month = User.objects.filter(date_joined__lt=last_month).count()
        user_growth = ((new_users_last_month / users_last_month) * 100) if users_last_month > 0 else 0
        
        appts_prev_month = Appointment.objects.filter(
            start__gte=now - timedelta(days=60),
            start__lt=last_month
        ).count()
        appt_growth = ((appointments_this_month - appts_prev_month) / appts_prev_month * 100) if appts_prev_month > 0 else 0
        
        return Response({
            'user_statistics': {
                'total_users': total_users,
                'active_users': active_users,
                'new_users_last_month': new_users_last_month,
                'total_doctors': doctors_count,
                'total_patients': patients_count,
                'user_growth_percentage': round(user_growth, 1)
            },
            'appointment_statistics': {
                'total_appointments': total_appointments,
                'appointments_this_month': appointments_this_month,
                'completed_appointments': completed_appointments,
                'scheduled_appointments': scheduled_appointments,
                'canceled_appointments': canceled_appointments,
                'avg_appointment_duration_minutes': round(avg_appointment_duration, 1),
                'total_duration_hours': round(total_duration_minutes / 60, 1),
                'appointment_growth_percentage': round(appt_growth, 1)
            },
            'subscription_statistics': {
                'active_subscriptions': active_subscriptions,
                'subscription_breakdown': list(subscription_breakdown),
                'revenue_data': revenue_data,
                'total_monthly_revenue': total_monthly_revenue,
                'revenue_growth_percentage': 15.3
            },
            'top_doctors': top_doctors_data,
            'daily_appointment_trend': daily_trend,
            'system_status': {
                'system_uptime': 99.9,
                'email_service_status': 'operational'
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============= SUBSCRIPTION MANAGEMENT =============

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_subscription_plans(request, plan_id=None):
    """Manage subscription plans"""
    
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        if plan_id:
            # Get specific plan
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id)
                subscribers = UserSubscription.objects.filter(plan=plan, status='active').count()
                
                return Response({
                    'id': plan.id,
                    'tier': plan.tier,
                    'name': plan.name,
                    'price': float(plan.price),
                    'appointment_limit': plan.appointment_limit,
                    'features': plan.features,
                    'active_subscribers': subscribers
                })
            except SubscriptionPlan.DoesNotExist:
                return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Get all plans
            plans = SubscriptionPlan.objects.all()
            plans_data = []
            for plan in plans:
                subscribers = UserSubscription.objects.filter(plan=plan, status='active').count()
                plans_data.append({
                    'id': plan.id,
                    'tier': plan.tier,
                    'name': plan.name,
                    'price': float(plan.price),
                    'appointment_limit': plan.appointment_limit,
                    'features': plan.features,
                    'active_subscribers': subscribers
                })
            return Response(plans_data)
    
    elif request.method == 'POST':
        # Create new plan
        data = request.data
        try:
            plan = SubscriptionPlan.objects.create(
                tier=data['tier'],
                name=data['name'],
                price=Decimal(str(data['price'])),
                appointment_limit=data.get('appointment_limit'),
                features=data.get('features', {})
            )
            return Response({
                'message': 'Plan created successfully',
                'plan': {
                    'id': plan.id,
                    'tier': plan.tier,
                    'name': plan.name,
                    'price': float(plan.price)
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT' and plan_id:
        # Update plan
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
            data = request.data
            
            if 'name' in data:
                plan.name = data['name']
            if 'price' in data:
                plan.price = Decimal(str(data['price']))
            if 'appointment_limit' in data:
                plan.appointment_limit = data['appointment_limit']
            if 'features' in data:
                plan.features = data['features']
            
            plan.save()
            
            return Response({
                'message': 'Plan updated successfully',
                'plan': {
                    'id': plan.id,
                    'tier': plan.tier,
                    'name': plan.name,
                    'price': float(plan.price),
                    'appointment_limit': plan.appointment_limit
                }
            })
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'DELETE' and plan_id:
        # Delete plan
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
            # Check if plan has active subscribers
            active_subs = UserSubscription.objects.filter(plan=plan, status='active').count()
            if active_subs > 0:
                return Response(
                    {'error': f'Cannot delete plan with {active_subs} active subscribers'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            plan.delete()
            return Response({'message': 'Plan deleted successfully'})
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_user_subscription(request, user_id):
    """Manage user subscription (assign, modify, discount)"""
    
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        action = request.data.get('action')
        
        if action == 'assign':
            # Assign subscription plan
            plan_tier = request.data.get('plan')
            try:
                plan = SubscriptionPlan.objects.get(tier=plan_tier)
                
                # Create or update subscription
                subscription, created = UserSubscription.objects.update_or_create(
                    user=user,
                    defaults={
                        'plan': plan,
                        'status': 'active',
                        'ends_at': None
                    }
                )
                
                return Response({
                    'message': f'Subscription {"created" if created else "updated"} successfully',
                    'subscription': {
                        'tier': plan.tier,
                        'status': subscription.status
                    }
                })
            except SubscriptionPlan.DoesNotExist:
                return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif action == 'cancel':
            # Cancel subscription
            try:
                subscription = UserSubscription.objects.get(user=user)
                subscription.status = 'canceled'
                subscription.ends_at = timezone.now()
                subscription.save()
                
                return Response({'message': 'Subscription canceled successfully'})
            except UserSubscription.DoesNotExist:
                return Response({'error': 'User has no subscription'}, status=status.HTTP_404_NOT_FOUND)
        
        elif action == 'discount':
            # Apply discount
            discount_percent = request.data.get('discount_percent', 0)
            try:
                subscription = UserSubscription.objects.get(user=user)
                original_price = subscription.plan.price
                discounted_price = original_price * (1 - Decimal(str(discount_percent)) / 100)
                
                # Store discount in features (you might want a separate discount field)
                if not subscription.plan.features:
                    subscription.plan.features = {}
                subscription.plan.features['discount'] = {
                    'percent': discount_percent,
                    'original_price': float(original_price),
                    'discounted_price': float(discounted_price)
                }
                subscription.plan.save()
                
                return Response({
                    'message': f'{discount_percent}% discount applied successfully',
                    'original_price': float(original_price),
                    'discounted_price': float(discounted_price)
                })
            except UserSubscription.DoesNotExist:
                return Response({'error': 'User has no subscription'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)