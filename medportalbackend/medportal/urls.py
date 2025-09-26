# medportalbackend/medportal/urls.py - FIXED WITH TRAILING SLASHES

from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import Register, Me
from subscriptions.views import CurrentSubscription, Upgrade
from appointments.views import DoctorSlots, MyAppointments, DoctorAppointments, DoctorsList, AppointmentDetail
from records.views import MyRecords, PatientRecords

# Import admin views
from accounts import admin_views

# Import analytics views
from analytics.views import DoctorAnalytics, SystemAnalytics

urlpatterns = [
    path("admin/", admin.site.urls),

    # ============= API ENDPOINTS (WITH TRAILING SLASHES) =============
    
    # Auth endpoints
    path("api/auth/register/", Register.as_view()),
    path("api/auth/login/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", Me.as_view()),

    # Subscriptions
    path("api/subscriptions/current/", CurrentSubscription.as_view()),
    path("api/subscriptions/upgrade/", Upgrade.as_view()),

    # Doctors
    path("api/doctors/<int:doctor_id>/slots/", DoctorSlots.as_view()),
    path("api/doctors/", DoctorsList.as_view()),

    # Appointments
    path("api/appointments/my/", MyAppointments.as_view()),
    path("api/appointments/my/<int:appointment_id>/", MyAppointments.as_view()),
    path("api/appointments/", DoctorAppointments.as_view()),
    path("api/appointments/<int:appointment_id>/", AppointmentDetail.as_view()),

    # Medical Records
    path("api/medical-records/my/", MyRecords.as_view()),
    path("api/patients/<int:patient_id>/records/", PatientRecords.as_view()),

    # Analytics
    path("api/analytics/practice/", DoctorAnalytics.as_view()),
    path("api/analytics/system/", SystemAnalytics.as_view()),

    # ============= ADMIN ENDPOINTS (WITH TRAILING SLASHES) =============
    
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