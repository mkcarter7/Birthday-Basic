from datetime import timedelta
from django.utils import timezone


def set_party_expiry(party):
    """
    Called immediately after a payment is confirmed.
    Sets expires_at to 60 days after the event date, then marks the party active.

    Why 60 days after the event (not after payment)?
    Because the value to the customer — having a live site for guests — centers
    on the event itself. A site bought 2 weeks before the event should stay up
    well after it, regardless of when the payment happened.
    """
    if party.date:
        party.expires_at = party.date + timedelta(days=60)
    else:
        # Fallback: if date somehow isn't set yet, expire 60 days from now
        party.expires_at = timezone.now() + timedelta(days=60)

    party.site_status = 'active'
    party.is_active = True
    party.save(update_fields=['expires_at', 'site_status', 'is_active'])


def deactivate_expired_parties():
    """
    Scans the database for parties whose expires_at is in the past.
    Marks them expired and inactive. Returns the count of deactivated parties.

    This function is called by the expire_parties management command,
    which Railway runs on a nightly cron schedule.
    """
    from birthdayapi.models import Party  # local import avoids circular import at module load

    now = timezone.now()
    expired_qs = Party.objects.filter(
        expires_at__lt=now,
        site_status='active',
    )
    count = expired_qs.count()
    expired_qs.update(site_status='expired', is_active=False)
    return count
