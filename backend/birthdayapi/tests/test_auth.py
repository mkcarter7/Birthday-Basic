"""
Unit tests for FirebaseAuthentication.get_or_create_user().

We test this method directly — no HTTP request, no Firebase token.
The method is a plain Python function that takes a uid string and a dict
representing the decoded Firebase token.  We can call it with any dict we want
and inspect what Django User object comes back.

Why no HTTP/Firebase mock?
Because authenticate() (the public entry point) immediately calls
firebase_admin.verify_id_token() which requires a live Firebase project.
get_or_create_user() is all pure Django logic and needs no network,
so we test that piece in isolation.
"""

import pytest
from django.contrib.auth.models import User
from birthday.authentication import FirebaseAuthentication


@pytest.fixture
def auth():
    return FirebaseAuthentication()


# ── New-user creation ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGetOrCreateUser:

    def test_creates_new_user_for_unknown_uid(self, auth):
        user, created = auth.get_or_create_user('uid-new', {'email': 'new@example.com'})
        assert created is True
        assert user.username == 'uid-new'

    def test_returns_existing_user_without_recreating(self, auth):
        User.objects.create_user(username='uid-existing', email='e@example.com')
        user, created = auth.get_or_create_user('uid-existing', {'email': 'e@example.com'})
        assert created is False
        assert User.objects.filter(username='uid-existing').count() == 1

    def test_new_user_email_stored(self, auth):
        user, _ = auth.get_or_create_user('uid-email', {'email': 'test@example.com'})
        assert user.email == 'test@example.com'

    def test_name_split_into_first_and_last(self, auth):
        user, _ = auth.get_or_create_user('uid-name', {
            'email': 'n@example.com',
            'name': 'Jane Doe',
        })
        assert user.first_name == 'Jane'
        assert user.last_name == 'Doe'

    def test_single_name_goes_to_first_name_only(self, auth):
        user, _ = auth.get_or_create_user('uid-single', {
            'email': 's@example.com',
            'name': 'Cher',
        })
        assert user.first_name == 'Cher'
        assert user.last_name == ''

    def test_no_name_field_leaves_names_blank(self, auth):
        user, _ = auth.get_or_create_user('uid-noname', {'email': 'noname@example.com'})
        assert user.first_name == ''
        assert user.last_name == ''

    def test_new_user_is_active(self, auth):
        user, _ = auth.get_or_create_user('uid-active', {'email': 'active@example.com'})
        assert user.is_active is True


# ── Admin email detection ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdminEmailGrantsStaff:
    """
    authentication.py hard-codes mkd.princess@gmail.com as an admin email.
    Any user created or looked up with that email should receive is_staff=True.
    """

    ADMIN_EMAIL = 'mkd.princess@gmail.com'

    def test_admin_email_creates_staff_user(self, auth):
        user, _ = auth.get_or_create_user('uid-admin', {'email': self.ADMIN_EMAIL})
        assert user.is_staff is True

    def test_admin_email_case_insensitive(self, auth):
        user, _ = auth.get_or_create_user('uid-admin-caps', {
            'email': self.ADMIN_EMAIL.upper(),
        })
        assert user.is_staff is True

    def test_non_admin_email_creates_non_staff_user(self, auth):
        user, _ = auth.get_or_create_user('uid-guest', {'email': 'guest@example.com'})
        assert user.is_staff is False

    def test_existing_non_staff_upgraded_when_admin_email_seen(self, auth):
        # Simulate a user who was created before their email was added to
        # the admin list — next login should upgrade them.
        existing = User.objects.create_user(
            username='uid-upgrade',
            email=self.ADMIN_EMAIL,
            is_staff=False,
        )
        user, created = auth.get_or_create_user('uid-upgrade', {'email': self.ADMIN_EMAIL})
        assert created is False
        user.refresh_from_db()
        assert user.is_staff is True
