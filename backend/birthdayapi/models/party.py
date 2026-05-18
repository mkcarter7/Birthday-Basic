from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

SITE_STATUS_CHOICES = [
    ('pending_payment', 'Pending Payment'),
    ('active', 'Active'),
    ('expired', 'Expired'),
    ('suspended', 'Suspended'),
]

class Party(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=300)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_parties')
    facebook_live_url = models.URLField(blank=True, null=True)
    venmo_username = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    max_guests = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Multi-tenant / SaaS fields
    subdomain = models.SlugField(max_length=100, unique=True, null=True, blank=True)
    custom_domain = models.CharField(max_length=255, unique=True, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    site_status = models.CharField(
        max_length=20,
        choices=SITE_STATUS_CHOICES,
        default='pending_payment',
    )
    
    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'parties'
    
    def __str__(self):
        return self.name
    
    @property
    def total_rsvps(self):
        return self.rsvps.count()
    
    @property
    def attending_count(self):
        return self.rsvps.filter(status='attending').count()
    
    @property
    def is_past(self):
        return self.date < timezone.now()

    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at


class PartyTimelineEvent(models.Model):
    """
    Represents a scheduled item that appears on the public party timeline.
    """

    party = models.ForeignKey(
        Party,
        on_delete=models.CASCADE,
        related_name='timeline_events',
    )
    time = models.TimeField()
    activity = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['time']
        verbose_name = 'Timeline Event'
        verbose_name_plural = 'Timeline Events'

    def __str__(self):
        return f'{self.party.name} – {self.activity} ({self.time})'
