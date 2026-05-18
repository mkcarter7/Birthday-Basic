import os
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from birthdayapi.models import Party, SiteConfig, Subscription


class Command(BaseCommand):
    """
    One-time migration command. Run this ONCE on your existing deployment
    to convert the old env-var-based single-party setup into the new
    database-driven multi-tenant format.

    Usage:
        python manage.py migrate_legacy_party --subdomain my-party

    After running, the party with id=1 will have:
    - A subdomain set (accessible at my-party.1rockstarsocial.com)
    - A SiteConfig row populated from the current NEXT_PUBLIC_* env vars
    - A Subscription row marked active (no payment required for the original party)
    """
    help = 'Migrates the original single-party env-var config to DB-driven SiteConfig.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--subdomain',
            type=str,
            default='my-party',
            help='Subdomain slug for the existing party (e.g. "sarahs-birthday")',
        )
        parser.add_argument(
            '--party-id',
            type=int,
            default=1,
            help='ID of the existing party to migrate (default: 1)',
        )

    def handle(self, *args, **options):
        subdomain = options['subdomain']
        party_id = options['party_id']

        party = Party.objects.filter(id=party_id).first()
        if not party:
            self.stdout.write(self.style.ERROR(f'No party with id={party_id} found.'))
            return

        # Set subdomain and activate
        party.subdomain = subdomain
        party.site_status = 'active'
        party.is_active = True
        if party.date:
            party.expires_at = party.date + timedelta(days=60)
        else:
            party.expires_at = timezone.now() + timedelta(days=60)
        party.save(update_fields=['subdomain', 'site_status', 'is_active', 'expires_at'])

        # Create SiteConfig from env vars (uses defaults if env vars not set)
        config, created = SiteConfig.objects.get_or_create(party=party)
        config.primary_color = os.getenv('NEXT_PUBLIC_PRIMARY_COLOR', '#3B82F6')
        config.secondary_color = os.getenv('NEXT_PUBLIC_SECONDARY_COLOR', '#8B5CF6')
        config.accent_color = os.getenv('NEXT_PUBLIC_ACCENT_COLOR', '#F59E0B')
        config.welcome_message = os.getenv('NEXT_PUBLIC_WELCOME_MESSAGE', 'Join us for an unforgettable celebration!')
        config.background_image_url = os.getenv('NEXT_PUBLIC_BACKGROUND_IMAGE', '')
        config.logged_in_background_url = os.getenv('NEXT_PUBLIC_LOGGED_IN_BACKGROUND_IMAGE', '')
        config.venmo_username = os.getenv('NEXT_PUBLIC_VENMO_USERNAME', '')
        config.facebook_live_url = os.getenv('NEXT_PUBLIC_FACEBOOK_LIVE_URL', '')
        config.registry_url = os.getenv('NEXT_PUBLIC_REGISTRY_URL', '')
        config.save()

        # Create a stub Subscription (no Stripe payment — legacy site)
        sub, _ = Subscription.objects.get_or_create(
            party=party,
            defaults={
                'tier': 'self_service',
                'status': 'active',
                'price_paid': 0,
                'paid_at': timezone.now(),
            }
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Migrated "{party.name}" → subdomain: {subdomain}\n'
                f'  SiteConfig {"created" if created else "updated"}\n'
                f'  Subscription status: {sub.status}'
            )
        )
