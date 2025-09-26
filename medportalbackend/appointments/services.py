from datetime import datetime, time, timedelta
from django.utils import timezone
from django.db.models import Q
from .models import AvailabilityTemplate, UnavailableBlock, Appointment
from subscriptions.services import build_subscription_payload

def overlaps(a_start,a_end,b_start,b_end): return not (a_end <= b_start or a_start >= b_end)

def generate_slots_for_date(doctor, date, step_minutes=60):
    weekday = date.weekday()
    window = AvailabilityTemplate.objects.filter(doctor=doctor, weekday=weekday).first()
    if not window: return []

    start_dt = timezone.make_aware(datetime.combine(date, window.start_time))
    end_dt   = timezone.make_aware(datetime.combine(date, window.end_time))

    # remove past portions if date is today
    now = timezone.now()
    cur = max(start_dt, now) if date == now.date() else start_dt

    slots = []
    while cur + timedelta(minutes=step_minutes) <= end_dt:
        slots.append((cur, cur + timedelta(minutes=step_minutes)))
        cur += timedelta(minutes=step_minutes)

    # remove booked
    appts = Appointment.objects.filter(doctor=doctor, status="scheduled", start__date=date)
    booked = [(a.start, a.end) for a in appts]

    # remove unavailable blocks
    blocks = UnavailableBlock.objects.filter(doctor=doctor, start__date=date)
    blocks = [(b.start, b.end) for b in blocks]

    def free(slot):
        s,e = slot
        for bs,be in booked + blocks:
            if overlaps(s,e,bs,be): return False
        return True

    return [slot for slot in slots if free(slot)]

def can_book_appointment(patient):
    sub = build_subscription_payload(patient)
    limit = sub["appointment_limit"]
    remaining = sub["remaining_this_month"]
    if limit is None: return True, None
    return (remaining > 0), {"code":"quota_exceeded","remaining": remaining}
