"""
Tests for GuestBookEntryViewSet.

Permission model (from guest_book.py):
  - Anyone (including unauthenticated) can READ entries (GET).
  - Only authenticated users can CREATE entries (POST).
  - Only the entry's author, a staff admin, or the party host can UPDATE or DELETE.
"""

import pytest
from rest_framework import status

from birthdayapi.models import GuestBookEntry


LIST_URL = '/api/guestbook/'
MY_ENTRIES_URL = '/api/guestbook/my_entries/'


def detail_url(pk):
    return f'/api/guestbook/{pk}/'


def get_items(data):
    return data if isinstance(data, list) else data.get('results', [])


@pytest.fixture
def entry(db, party, regular_user):
    return GuestBookEntry.objects.create(
        party=party,
        author=regular_user,
        name='Alice',
        message='Great party!',
    )


@pytest.fixture
def other_entry(db, party, other_user):
    return GuestBookEntry.objects.create(
        party=party,
        author=other_user,
        name='Bob',
        message='Had so much fun!',
    )


# ── Public reads ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGuestBookRead:

    def test_unauthenticated_can_list(self, client, entry):
        res = client.get(LIST_URL)
        assert res.status_code == status.HTTP_200_OK

    def test_list_contains_entry(self, client, entry):
        res = client.get(LIST_URL)
        messages = [e['message'] for e in get_items(res.data)]
        assert entry.message in messages

    def test_filter_by_party(self, client, entry):
        res = client.get(LIST_URL, {'party': entry.party.pk})
        assert res.status_code == status.HTTP_200_OK
        ids = [e['id'] for e in get_items(res.data)]
        assert entry.pk in ids

    def test_search_by_message(self, client, entry):
        res = client.get(LIST_URL, {'search': 'Great'})
        assert res.status_code == status.HTTP_200_OK


# ── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGuestBookCreate:

    def test_unauthenticated_cannot_create(self, client, party):
        res = client.post(LIST_URL, {
            'party': party.pk,
            'message': 'I snuck in!',
        }, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_create(self, auth_client, party):
        res = auth_client.post(LIST_URL, {
            'party': party.pk,
            'message': 'Love the party!',
        }, format='json')
        assert res.status_code == status.HTTP_201_CREATED

    def test_author_set_to_requesting_user(self, auth_client, party, regular_user):
        res = auth_client.post(LIST_URL, {
            'party': party.pk,
            'message': 'My message',
        }, format='json')
        entry = GuestBookEntry.objects.get(pk=res.data['id'])
        assert entry.author == regular_user


# ── Update ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGuestBookUpdate:

    def test_author_can_update_own_entry(self, auth_client, entry):
        res = auth_client.patch(detail_url(entry.pk), {'message': 'Updated!'}, format='json')
        assert res.status_code == status.HTTP_200_OK
        entry.refresh_from_db()
        assert entry.message == 'Updated!'

    def test_non_author_cannot_update(self, auth_client, other_entry):
        res = auth_client.patch(detail_url(other_entry.pk), {'message': 'Hacked!'}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update_any_entry(self, admin_client, entry):
        res = admin_client.patch(detail_url(entry.pk), {'message': 'Admin edit'}, format='json')
        assert res.status_code == status.HTTP_200_OK

    def test_unauthenticated_cannot_update(self, client, entry):
        res = client.patch(detail_url(entry.pk), {'message': 'No auth'}, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGuestBookDelete:

    def test_author_can_delete_own_entry(self, auth_client, entry):
        res = auth_client.delete(detail_url(entry.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not GuestBookEntry.objects.filter(pk=entry.pk).exists()

    def test_admin_can_delete_any_entry(self, admin_client, entry):
        res = admin_client.delete(detail_url(entry.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT

    def test_party_host_can_delete_entry_from_their_party(self, host_client, entry):
        res = host_client.delete(detail_url(entry.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT

    def test_stranger_cannot_delete(self, auth_client, other_entry):
        # regular_user is not the author, admin, or host
        res = auth_client.delete(detail_url(other_entry.pk))
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_delete(self, client, entry):
        res = client.delete(detail_url(entry.pk))
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


# ── my_entries action ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMyEntries:

    def test_returns_only_requesting_users_entries(self, auth_client, entry, other_entry):
        res = auth_client.get(MY_ENTRIES_URL)
        assert res.status_code == status.HTTP_200_OK
        ids = [e['id'] for e in res.data]
        assert entry.pk in ids
        assert other_entry.pk not in ids

    def test_unauthenticated_gets_401(self, client):
        res = client.get(MY_ENTRIES_URL)
        assert res.status_code == status.HTTP_401_UNAUTHORIZED
