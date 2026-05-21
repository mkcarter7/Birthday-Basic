"""
Shared fixtures for all test modules.

pytest-django gives us `db` access via @pytest.mark.django_db on each test.
The fixtures here set up the most common database objects so individual tests
don't have to repeat the same boilerplate.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from birthdayapi.models import Party


# ── APIClient ────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def auth_client(regular_user):
    """DRF client pre-authenticated as a regular (non-staff) user."""
    c = APIClient()
    c.force_authenticate(user=regular_user)
    return c


@pytest.fixture
def admin_client(admin_user):
    """DRF client pre-authenticated as a staff/admin user."""
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.fixture
def host_client(host_user):
    """DRF client pre-authenticated as the party host."""
    c = APIClient()
    c.force_authenticate(user=host_user)
    return c


# ── Users ────────────────────────────────────────────────────────────────────

@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username='alice',
        email='alice@example.com',
        password='pass',
        is_staff=False,
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username='bob',
        email='bob@example.com',
        password='pass',
        is_staff=False,
    )


@pytest.fixture
def host_user(db):
    return User.objects.create_user(
        username='charlie',
        email='charlie@example.com',
        password='pass',
        is_staff=False,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='pass',
        is_staff=True,
    )


# ── Party ────────────────────────────────────────────────────────────────────

@pytest.fixture
def party(db, host_user):
    return Party.objects.create(
        name='Test Party',
        description='A great party',
        date=timezone.now() + timedelta(days=30),
        location='123 Main St',
        host=host_user,
        subdomain='test-party',
        site_status='active',
        is_active=True,
        is_public=True,
    )
