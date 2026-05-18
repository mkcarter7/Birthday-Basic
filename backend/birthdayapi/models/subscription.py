from django.db import models

TIER_CHOICES = [
    ('self_service', 'Self-Service ($99)'),
    ('guided', 'Guided ($229)'),
    ('full_service', 'Full Service ($399)'),
]

SUBSCRIPTION_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('cancelled', 'Cancelled'),
    ('expired', 'Expired'),
]

TIER_PRICES = {
    'self_service': 99,
    'guided': 229,
    'full_service': 399,
}


class Subscription(models.Model):
    """
    Tracks the payment and service tier for each event site.
    Created when an event owner starts checkout; activated by Stripe webhook on payment success.
    """
    party = models.OneToOneField(
        'Party',
        on_delete=models.CASCADE,
        related_name='subscription',
    )
    tier = models.CharField(max_length=20, choices=TIER_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_STATUS_CHOICES,
        default='pending',
    )
    price_paid = models.DecimalField(max_digits=8, decimal_places=2)

    # Stripe IDs — stored so we can reconcile payments and issue refunds
    stripe_session_id = models.CharField(max_length=200, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    stripe_customer_id = models.CharField(max_length=200, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'

    def __str__(self):
        return f'{self.party.name} — {self.get_tier_display()} ({self.status})'
