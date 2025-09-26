from django.contrib import admin

# Register your models here.

# ================================================================

# subscriptions/admin.py
from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'price', 'appointment_limit')
    list_filter = ('tier',)
    search_fields = ('name', 'tier')
    ordering = ('tier',)
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('tier', 'name', 'price')
        }),
        ('Features', {
            'fields': ('appointment_limit', 'features')
        }),
    )

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'starts_at', 'ends_at')
    list_filter = ('status', 'plan__tier', 'starts_at')
    search_fields = ('user__username', 'user__email', 'plan__name')
    ordering = ('-starts_at',)
    
    fieldsets = (
        ('Subscription Details', {
            'fields': ('user', 'plan', 'status')
        }),
        ('Dates', {
            'fields': ('starts_at', 'ends_at')
        }),
    )
    
    readonly_fields = ('starts_at',)

# ================================================================
