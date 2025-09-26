from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view): return getattr(request.user, "role", None) == "admin"

class IsDoctor(BasePermission):
    def has_permission(self, request, view): return getattr(request.user, "role", None) == "doctor"

class IsPatient(BasePermission):
    def has_permission(self, request, view): return getattr(request.user, "role", None) == "patient"
