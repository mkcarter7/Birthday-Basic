import stripe
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from ..models import Party, Subscription, SiteConfig
from ..utils.expiration import set_party_expiry


TIER_PRICES = {
    'self_service': 99_00,   # Stripe uses cents: 9900 = $99.00
    'guided': 229_00,
    'full_service': 399_00,
}

TIER_LABELS = {
    'self_service': 'Self-Service Event Site',
    'guided': 'Guided Event Site',
    'full_service': 'Full Service Event Site',
}


class CreateCheckoutSessionView(APIView):
    """
    Creates a Stripe Checkout Session for purchasing an event site tier.

    POST /api/checkout/create-session/
    Body: { "party_id": 1, "tier": "self_service" }
    Returns: { "checkout_url": "https://checkout.stripe.com/..." }

    The frontend redirects the customer to checkout_url.
    After payment, Stripe redirects back to /signup/success?session_id=...
    and also fires the webhook to /api/webhooks/stripe/.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        party_id = request.data.get('party_id')
        tier = request.data.get('tier')
        template_id = request.data.get('template_id', 'classic')
        subdomain = request.data.get('subdomain', '').strip().lower()

        if tier not in TIER_PRICES:
            return Response(
                {'error': f'Invalid tier. Choose from: {list(TIER_PRICES.keys())}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            party = Party.objects.get(id=party_id, host=request.user)
        except Party.DoesNotExist:
            return Response(
                {'error': 'Party not found or you are not the host.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Set subdomain if provided and not already claimed
        if subdomain and not party.subdomain:
            if Party.objects.filter(subdomain=subdomain).exclude(id=party.id).exists():
                return Response(
                    {'error': 'That subdomain is already taken. Please choose another.'},
                    status=status.HTTP_409_CONFLICT,
                )
            party.subdomain = subdomain
            party.save(update_fields=['subdomain'])

        # Prevent double-purchasing
        if hasattr(party, 'subscription') and party.subscription.status == 'active':
            return Response(
                {'error': 'This event site is already active.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        platform_domain = getattr(settings, 'PLATFORM_DOMAIN', '1rockstarsocial.com')
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # If a Stripe price ID is configured for this tier, use it.
        # Otherwise fall back to a dynamic price (unit_amount) — useful in dev.
        price_id = settings.STRIPE_PRICE_IDS.get(tier)

        session_params = {
            'mode': 'payment',
            'customer_email': request.user.email,
            'success_url': f'https://{platform_domain}/signup/success?session_id={{CHECKOUT_SESSION_ID}}',
            'cancel_url': f'https://{platform_domain}/signup?step=6&cancelled=true',
            'metadata': {
                'party_id': str(party.id),
                'tier': tier,
                'user_id': str(request.user.id),
                'template_id': template_id,
            },
        }

        if price_id:
            session_params['line_items'] = [{'price': price_id, 'quantity': 1}]
        else:
            session_params['line_items'] = [{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': TIER_PRICES[tier],
                    'product_data': {'name': TIER_LABELS[tier]},
                },
                'quantity': 1,
            }]

        try:
            session = stripe.checkout.Session.create(**session_params)
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        # Create or update the Subscription record while payment is pending
        Subscription.objects.update_or_create(
            party=party,
            defaults={
                'tier': tier,
                'status': 'pending',
                'price_paid': TIER_PRICES[tier] / 100,
                'stripe_session_id': session.id,
            },
        )

        return Response({'checkout_url': session.url})


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Receives and processes events sent by Stripe after payment.

    POST /api/webhooks/stripe/

    This endpoint:
    1. Verifies the request genuinely came from Stripe (signature check)
    2. On checkout.session.completed: marks the Subscription active,
       stamps expires_at on the Party, and creates a default SiteConfig.

    Must be exempt from CSRF because Stripe sends raw POST requests,
    not browser form submissions with CSRF tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=400)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            self._handle_payment_success(session)

        # Always return 200 to Stripe — even for events we don't handle.
        # A non-200 response causes Stripe to retry the webhook repeatedly.
        return Response({'received': True})

    def _handle_payment_success(self, session):
        """Activates the party and creates its SiteConfig after payment."""
        stripe_session_id = session.get('id')
        payment_intent_id = session.get('payment_intent', '')

        try:
            sub = Subscription.objects.select_related('party').get(
                stripe_session_id=stripe_session_id,
            )
        except Subscription.DoesNotExist:
            # This can happen if the webhook fires before our DB write finishes.
            # Stripe will retry; by then the record will exist.
            return

        sub.status = 'active'
        sub.paid_at = timezone.now()
        sub.stripe_payment_intent_id = payment_intent_id
        sub.save(update_fields=['status', 'paid_at', 'stripe_payment_intent_id'])

        # Stamp the expiry date and flip is_active=True on the Party
        set_party_expiry(sub.party)

        # Ensure a SiteConfig exists with sensible defaults
        template_id = session.get('metadata', {}).get('template_id', 'classic')
        SiteConfig.objects.get_or_create(
            party=sub.party,
            defaults={'template_id': template_id},
        )
