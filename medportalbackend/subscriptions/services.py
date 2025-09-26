from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime
from calendar import monthrange
from .models import SubscriptionPlan, UserSubscription
from appointments.models import Appointment

ORDER = {"free":0,"basic":1,"premium":2}

def month_bounds(dt: datetime):
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_day = monthrange(dt.year, dt.month)[1]
    end = dt.replace(day=end_day, hour=23, minute=59, second=59, microsecond=999999)
    return start, end

def build_subscription_payload(user):
    us = getattr(user, "subscription", None)
    if not us:
        return {"tier":"free","appointment_limit":2,"used_this_month":0,"remaining_this_month":2,"features":{}}
    limit = us.plan.appointment_limit
    start,end = month_bounds(timezone.now())
    used = Appointment.objects.filter(
        patient=user, status="scheduled", start__gte=start, start__lte=end
    ).count()
    remaining = None if limit is None else max(0, limit - used)
    return {
        "tier": us.plan.tier,
        "appointment_limit": limit,
        "used_this_month": used,
        "remaining_this_month": remaining,
        "features": us.plan.features,
    }

def upgrade_user_plan(user, plan_code: str):
    plan = SubscriptionPlan.objects.get(tier=plan_code)
    us, _ = UserSubscription.objects.get_or_create(user=user, defaults={"plan": plan})
    if us.plan and ORDER[plan.tier] <= ORDER[us.plan.tier]:
        raise ValueError("Choose a higher plan to upgrade.")
    us.plan = plan; us.status = UserSubscription.Status.ACTIVE; us.ends_at = None; us.save()
    return us
