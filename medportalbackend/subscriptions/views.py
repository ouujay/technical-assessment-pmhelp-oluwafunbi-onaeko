from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsPatient, IsAdmin
from .models import SubscriptionPlan, UserSubscription
from .services import build_subscription_payload, upgrade_user_plan

class CurrentSubscription(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(build_subscription_payload(request.user))

class Upgrade(APIView):
    permission_classes = [IsAuthenticated, IsPatient]
    def post(self, request):
        target = request.data.get("plan")
        if target not in {"basic","premium"}:
            return Response({"detail":"Invalid plan"}, status=400)
        try:
            upgrade_user_plan(request.user, target)
        except SubscriptionPlan.DoesNotExist:
            return Response({"detail":"Plan not found"}, status=404)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        data = build_subscription_payload(request.user)
        data["payment"] = {"simulated": True}
        return Response(data)

class AdminSetUserPlan(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def post(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        plan_code = request.data.get("plan")
        user = User.objects.get(id=user_id)
        upgrade_user_plan(user, plan_code)
        return Response(build_subscription_payload(user))
