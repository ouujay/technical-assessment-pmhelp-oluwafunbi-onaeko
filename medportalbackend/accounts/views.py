from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.contrib.auth import get_user_model
from .serializers import SignupSerializer, MeSerializer
User = get_user_model()

class Register(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = SignupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response({"ok": True, "user": MeSerializer(user).data}, status=201)

class Me(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user).data)
