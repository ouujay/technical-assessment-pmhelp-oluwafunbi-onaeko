# medportal/urls.py - COMPLETE WITH ANALYTICS

from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import Register, Me
from subscriptions.views import CurrentSubscription, Upgrade
from appointments.views import DoctorSlots, MyAppointments, DoctorAppointments, DoctorsList
from records.views import MyRecords, PatientRecords

# Import admin views
from accounts import admin_views

# Import analytics views
from analytics.views import DoctorAnalytics, SystemAnalytics

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth endpoints
    path("auth/register", Register.as_view()),
    path("auth/register/", Register.as_view()),
    path("auth/login", TokenObtainPairView.as_view()),
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh", TokenRefreshView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me", Me.as_view()),
    path("auth/me/", Me.as_view()),

    # Subscriptions
    path("subscriptions/current", CurrentSubscription.as_view()),
    path("subscriptions/current/", CurrentSubscription.as_view()),
    path("subscriptions/upgrade", Upgrade.as_view()),
    path("subscriptions/upgrade/", Upgrade.as_view()),

    # Doctors
    path("doctors/<int:doctor_id>/slots", DoctorSlots.as_view()),
    path("doctors/<int:doctor_id>/slots/", DoctorSlots.as_view()),
    path("doctors", DoctorsList.as_view()),
    path("doctors/", DoctorsList.as_view()),

    # Appointments
    path("appointments/my", MyAppointments.as_view()),
    path("appointments/my/", MyAppointments.as_view()),
    path("appointments", DoctorAppointments.as_view()),
    path("appointments/", DoctorAppointments.as_view()),

    # Medical Records
    path("medical-records/my", MyRecords.as_view()),
    path("medical-records/my/", MyRecords.as_view()),
    path("patients/<int:patient_id>/records", PatientRecords.as_view()),
    path("patients/<int:patient_id>/records/", PatientRecords.as_view()),

    # ============= ANALYTICS ENDPOINTS =============
    
    # Doctor Analytics
    path("analytics/practice", DoctorAnalytics.as_view()),
    path("analytics/practice/", DoctorAnalytics.as_view()),
    
    # System Analytics (for admin)
    path("analytics/system", SystemAnalytics.as_view()),
    path("analytics/system/", SystemAnalytics.as_view()),

    # ============= ADMIN ENDPOINTS =============
    
    # User Management
    path('api/admin/users/', admin_views.admin_users_management),
    path('api/admin/users/<int:user_id>/', admin_views.admin_user_detail),
    
    # Admin Analytics
    path('api/admin/analytics/', admin_views.admin_analytics),
    
    # Subscription Management
    path('api/admin/subscription-plans/', admin_views.admin_subscription_plans),
    path('api/admin/subscription-plans/<int:plan_id>/', admin_views.admin_subscription_plans),
    path('api/admin/users/<int:user_id>/subscription/', admin_views.admin_user_subscription),
]