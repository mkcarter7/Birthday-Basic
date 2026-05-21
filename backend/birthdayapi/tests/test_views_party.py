"""
Tests for PartyViewSet — GET, POST, PUT, DELETE, and check_subdomain.

How we avoid Firebase:
  APIClient.force_authenticate(user=...) bypasses the authentication layer
  entirely and injects a Django User object directly.  The view then sees
  request.user as that user, exactly as if a real token had been validated.

URL conventions (from urls.py):
  router.register(r'api/parties', PartyViewSet, basename='party')
  → GET  /api/parties/          list
  → POST /api/parties/          create
  → GET  /api/parties/{id}/     retrieve
  → PUT  /api/parties/{id}/     update
  → DELETE /api/parties/{id}/   destroy
  → GET  /api/parties/check_subdomain/  custom action
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APIClient

from birthdayapi.models import Party


LIST_URL = '/api/parties/'
SUBDOMAIN_URL = '/api/parties/check_subdomain/'


def detail_url(pk):
    return f'/api/parties/{pk}/'


def get_items(data):
    """Return a flat list whether the response is paginated or a plain list."""
    return data if isinstance(data, list) else data.get('results', [])


# ── List (public) ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyList:

    def test_unauthenticated_can_list(self, client, party):
        res = client.get(LIST_URL)
        assert res.status_code == status.HTTP_200_OK

    def test_list_returns_created_party(self, client, party):
        res = client.get(LIST_URL)
        names = [p['name'] for p in get_items(res.data)]
        assert party.name in names


# ── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyCreate:

    PAYLOAD = {
        'name': 'New Party',
        'description': 'Fun',
        'date': (timezone.now() + timedelta(days=10)).isoformat(),
        'location': '42 Test Ave',
        'subdomain': 'new-party-123',
    }

    def test_unauthenticated_cannot_create(self, client):
        res = client.post(LIST_URL, self.PAYLOAD, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_create(self, auth_client):
        res = auth_client.post(LIST_URL, self.PAYLOAD, format='json')
        assert res.status_code == status.HTTP_201_CREATED

    def test_host_is_set_to_requesting_user(self, auth_client, regular_user):
        res = auth_client.post(LIST_URL, self.PAYLOAD, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        party = Party.objects.get(pk=res.data['id'])
        assert party.host == regular_user


# ── Update ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyUpdate:

    def test_host_can_update_party(self, host_client, party):
        res = host_client.patch(detail_url(party.pk), {'name': 'Renamed'}, format='json')
        assert res.status_code == status.HTTP_200_OK
        party.refresh_from_db()
        assert party.name == 'Renamed'

    def test_non_host_cannot_update(self, auth_client, party):
        res = auth_client.patch(detail_url(party.pk), {'name': 'Hacked'}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update_any_party(self, admin_client, party):
        res = admin_client.patch(detail_url(party.pk), {'name': 'Admin Edit'}, format='json')
        assert res.status_code == status.HTTP_200_OK

    def test_unauthenticated_cannot_update(self, client, party):
        res = client.patch(detail_url(party.pk), {'name': 'Anonymous'}, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyDelete:

    def test_host_can_delete_party(self, host_client, party):
        res = host_client.delete(detail_url(party.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not Party.objects.filter(pk=party.pk).exists()

    def test_non_host_cannot_delete(self, auth_client, party):
        res = auth_client.delete(detail_url(party.pk))
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_delete_any_party(self, admin_client, party):
        res = admin_client.delete(detail_url(party.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT


# ── check_subdomain ──────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCheckSubdomain:

    def test_available_subdomain(self, client):
        res = client.get(SUBDOMAIN_URL, {'subdomain': 'brand-new-party'})
        assert res.status_code == status.HTTP_200_OK
        assert res.data['available'] is True

    def test_taken_subdomain(self, client, party):
        res = client.get(SUBDOMAIN_URL, {'subdomain': party.subdomain})
        assert res.status_code == status.HTTP_200_OK
        assert res.data['available'] is False

    def test_reserved_word_www(self, client):
        res = client.get(SUBDOMAIN_URL, {'subdomain': 'www'})
        assert res.data['available'] is False
        assert 'reserved' in res.data.get('reason', '').lower()

    def test_reserved_word_api(self, client):
        res = client.get(SUBDOMAIN_URL, {'subdomain': 'api'})
        assert res.data['available'] is False

    def test_too_short_subdomain(self, client):
        # Regex requires at least 3 chars
        res = client.get(SUBDOMAIN_URL, {'subdomain': 'ab'})
        assert res.data['available'] is False

    def test_starts_with_hyphen_is_invalid(self, client):
        res = client.get(SUBDOMAIN_URL, {'subdomain': '-bad'})
        assert res.data['available'] is False

    def test_uppercase_is_normalised_and_checked(self, client, party):
        # The view lowercases the input before comparing
        res = client.get(SUBDOMAIN_URL, {'subdomain': party.subdomain.upper()})
        assert res.data['available'] is False

    def test_empty_subdomain(self, client):
        res = client.get(SUBDOMAIN_URL, {'subdomain': ''})
        assert res.data['available'] is False
