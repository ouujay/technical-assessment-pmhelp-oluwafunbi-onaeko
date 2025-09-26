from django.contrib import admin

# Register your models here.

# appointments/admin.py
from django.contrib import admin
from .models import AvailabilityTemplate, UnavailableBlock, Appointment

@admin.register(AvailabilityTemplate)
class AvailabilityTemplateAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'get_weekday_display', 'start_time', 'end_time')
    list_filter = ('weekday', 'doctor__role')
    search_fields = ('doctor__username', 'doctor__first_name', 'doctor__last_name')
    ordering = ('doctor', 'weekday', 'start_time')
    
    def get_weekday_display(self, obj):
        weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return weekdays[obj.weekday]
    get_weekday_display.short_description = 'Day of Week'
    
    fieldsets = (
        ('Doctor', {
            'fields': ('doctor',)
        }),
        ('Schedule', {
            'fields': ('weekday', 'start_time', 'end_time')
        }),
    )

@admin.register(UnavailableBlock)
class UnavailableBlockAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'start', 'end', 'reason')
    list_filter = ('start', 'doctor__role')
    search_fields = ('doctor__username', 'doctor__first_name', 'doctor__last_name', 'reason')
    ordering = ('-start',)
    
    fieldsets = (
        ('Doctor', {
            'fields': ('doctor',)
        }),
        ('Unavailable Period', {
            'fields': ('start', 'end', 'reason')
        }),
    )

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'start', 'end', 'status', 'visit_type')
    list_filter = ('status', 'visit_type', 'start', 'doctor__role')
    search_fields = (
        'patient__username', 'patient__first_name', 'patient__last_name',
        'doctor__username', 'doctor__first_name', 'doctor__last_name'
    )
    ordering = ('-start',)
    
    fieldsets = (
        ('Participants', {
            'fields': ('patient', 'doctor')
        }),
        ('Appointment Details', {
            'fields': ('start', 'end', 'status', 'visit_type')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient', 'doctor')

# ================================================================
