"""
Tests for RSVPViewSet.

Permission model (from rsvp.py):
  - All endpoints require authentication.
  - Staff (is_staff=True) sees ALL RSVPs.
  - Party hosts see their own RSVPs + RSVPs to their parties.
  - Regular guests see only their own RSVPs.
  - Users can only update/delete their own RSVPs (or hosts can delete from their party).
  - party_summary is visible to staff, party hosts, and users who have an RSVP.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta

from birthdayapi.models import RSVP, Party


LIST_URL = '/api/rsvps/'
SUMMARY_URL = '/api/rsvps/party_summary/'


def detail_url(pk):
    return f'/api/rsvps/{pk}/'


def get_items(data):
    return data if isinstance(data, list) else data.get('results', [])


@pytest.fixture
def rsvp(db, party, regular_user):
    return RSVP.objects.create(party=party, user=regular_user, status='yes')


@pytest.fixture
def other_rsvp(db, party, other_user):
    return RSVP.objects.create(party=party, user=other_user, status='no')


# ── Authentication guard ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPAuthRequired:

    def test_unauthenticated_cannot_list(self, client):
        res = client.get(LIST_URL)
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_cannot_create(self, client, party):
        res = client.post(LIST_URL, {'party': party.pk, 'status': 'yes'}, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPCreate:

    def test_authenticated_user_can_rsvp(self, auth_client, party):
        res = auth_client.post(
            LIST_URL,
            {'party': party.pk, 'status': 'yes', 'guest_count': 2},
            format='json',
        )
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['status'] == 'yes'

    def test_create_without_party_id_returns_400(self, auth_client):
        res = auth_client.post(LIST_URL, {'status': 'yes'}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_rsvp_returns_400(self, auth_client, party, rsvp):
        res = auth_client.post(
            LIST_URL,
            {'party': party.pk, 'status': 'no'},
            format='json',
        )
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already exists' in str(res.data).lower()

    def test_party_at_capacity_returns_400(self, host_client, party, regular_user, other_user):
        # Give the party a max_guests of 1 and fill it
        party.max_guests = 1
        party.save()
        RSVP.objects.create(party=party, user=regular_user, status='yes')

        # Now a third user tries to RSVP
        from django.contrib.auth.models import User
        third = User.objects.create_user(username='third', password='pw')
        c = APIClient()
        c.force_authenticate(user=third)

        res = c.post(LIST_URL, {'party': party.pk, 'status': 'yes'}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'capacity' in str(res.data).lower()


# ── Queryset scoping ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPQuerysetScope:

    def test_regular_user_sees_only_own_rsvps(
        self, auth_client, rsvp, other_rsvp
    ):
        res = auth_client.get(LIST_URL)
        assert res.status_code == status.HTTP_200_OK
        ids = [r['id'] for r in get_items(res.data)]
        assert rsvp.pk in ids
        assert other_rsvp.pk not in ids

    def test_staff_sees_all_rsvps(self, admin_client, rsvp, other_rsvp):
        res = admin_client.get(LIST_URL)
        ids = [r['id'] for r in get_items(res.data)]
        assert rsvp.pk in ids
        assert other_rsvp.pk in ids

    def test_host_sees_their_party_rsvps(self, host_client, rsvp, other_rsvp):
        res = host_client.get(LIST_URL)
        ids = [r['id'] for r in get_items(res.data)]
        # host_user is the host of the party both rsvps belong to
        assert rsvp.pk in ids
        assert other_rsvp.pk in ids


# ── Update ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPUpdate:

    def test_owner_can_update_own_rsvp(self, auth_client, rsvp):
        res = auth_client.patch(detail_url(rsvp.pk), {'status': 'maybe'}, format='json')
        assert res.status_code == status.HTTP_200_OK
        rsvp.refresh_from_db()
        assert rsvp.status == 'maybe'

    def test_non_owner_cannot_update(self, auth_client, other_rsvp):
        # regular_user's queryset excludes other_user's RSVPs entirely,
        # so the view returns 404 (not found) rather than 403 (forbidden).
        # This is intentional: queryset scoping prevents data leakage.
        res = auth_client.patch(detail_url(other_rsvp.pk), {'status': 'yes'}, format='json')
        assert res.status_code == status.HTTP_404_NOT_FOUND


# ── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPDelete:

    def test_owner_can_delete_own_rsvp(self, auth_client, rsvp):
        res = auth_client.delete(detail_url(rsvp.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT

    def test_party_host_can_delete_rsvp(self, host_client, rsvp):
        res = host_client.delete(detail_url(rsvp.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT

    def test_stranger_cannot_delete(self, auth_client, other_rsvp):
        # regular_user's queryset excludes other_user's RSVPs entirely → 404.
        res = auth_client.delete(detail_url(other_rsvp.pk))
        assert res.status_code == status.HTTP_404_NOT_FOUND


# ── party_summary permissions ────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartySummary:

    def test_host_can_view_summary(self, host_client, party):
        res = host_client.get(SUMMARY_URL, {'party_id': party.pk})
        assert res.status_code == status.HTTP_200_OK
        assert 'total_rsvps' in res.data

    def test_staff_can_view_summary(self, admin_client, party):
        res = admin_client.get(SUMMARY_URL, {'party_id': party.pk})
        assert res.status_code == status.HTTP_200_OK

    def test_user_with_rsvp_can_view_summary(self, auth_client, party, rsvp):
        res = auth_client.get(SUMMARY_URL, {'party_id': party.pk})
        assert res.status_code == status.HTTP_200_OK

    def test_uninvited_user_cannot_view_summary(self, auth_client, party):
        # regular_user has no RSVP for this party
        res = auth_client.get(SUMMARY_URL, {'party_id': party.pk})
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_missing_party_id_returns_400(self, auth_client):
        res = auth_client.get(SUMMARY_URL)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_summary_counts_are_correct(self, host_client, party, rsvp, other_rsvp):
        # rsvp = 'yes', other_rsvp = 'no'
        res = host_client.get(SUMMARY_URL, {'party_id': party.pk})
        assert res.data['total_rsvps'] == 2
        assert res.data['attending_count'] == 1
        assert res.data['not_attending_count'] == 1
