from django.db import models

TEMPLATE_CHOICES = [
    ('classic', 'Classic'),
    ('modern', 'Modern'),
    ('elegant', 'Elegant'),
    ('playful', 'Playful'),
    ('minimalist', 'Minimalist'),
]


class SiteConfig(models.Model):
    """
    Stores all per-party visual and content settings.
    Replaces the NEXT_PUBLIC_* environment variables used in the single-party setup.
    One row per Party — created automatically when a subscription is activated.
    """
    party = models.OneToOneField(
        'Party',
        on_delete=models.CASCADE,
        related_name='site_config',
    )

    # Colors (CSS hex values like #3B82F6)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#8B5CF6')
    accent_color = models.CharField(max_length=7, default='#F59E0B')

    # Background images (URLs pointing to uploaded or external images)
    background_image_url = models.URLField(blank=True)
    logged_in_background_url = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)

    # Template selection
    template_id = models.CharField(
        max_length=50,
        choices=TEMPLATE_CHOICES,
        default='classic',
    )
    font_family = models.CharField(max_length=100, default='Inter')

    # Feature toggles — host can turn off features they don't want
    enable_photos = models.BooleanField(default=True)
    enable_rsvp = models.BooleanField(default=True)
    enable_games = models.BooleanField(default=True)
    enable_gifts = models.BooleanField(default=True)
    enable_guestbook = models.BooleanField(default=True)
    enable_timeline = models.BooleanField(default=True)

    # Optional overrides for party details shown on the event site
    venue_name = models.CharField(max_length=300, blank=True)
    theme = models.CharField(max_length=200, blank=True)

    # Custom messaging shown to guests
    welcome_message = models.CharField(
        max_length=500,
        default='Join us for an unforgettable celebration!',
    )
    rsvp_message = models.CharField(max_length=500, blank=True)
    gift_message = models.CharField(max_length=500, blank=True)
    thank_you_title = models.CharField(max_length=200, default='Thank You!')
    thank_you_message = models.TextField(blank=True)
    thank_you_submessage = models.TextField(blank=True)

    # Social / payment links
    venmo_username = models.CharField(max_length=100, blank=True)
    facebook_live_url = models.URLField(blank=True)
    registry_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site Config'
        verbose_name_plural = 'Site Configs'

    def __str__(self):
        return f'Config for {self.party.name}'
