from django.core.management.base import BaseCommand
from birthdayapi.utils.expiration import deactivate_expired_parties


class Command(BaseCommand):
    help = 'Deactivates event sites whose 60-day post-event window has passed.'

    def handle(self, *args, **options):
        count = deactivate_expired_parties()
        if count:
            self.stdout.write(
                self.style.SUCCESS(f'Expired {count} partie(s).')
            )
        else:
            self.stdout.write('No parties to expire.')
