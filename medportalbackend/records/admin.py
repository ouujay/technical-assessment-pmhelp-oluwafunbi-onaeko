from django.contrib import admin

# Register your models here.

# records/admin.py
from django.contrib import admin
from .models import MedicalRecord

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'title', 'created_at')
    list_filter = ('created_at', 'doctor__role')
    search_fields = (
        'patient__username', 'patient__first_name', 'patient__last_name',
        'doctor__username', 'doctor__first_name', 'doctor__last_name',
        'title', 'notes'
    )
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Participants', {
            'fields': ('patient', 'doctor')
        }),
        ('Record Details', {
            'fields': ('title', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient', 'doctor')

# ================================================================
