"""
Tests for PartyPhotoViewSet.

We skip upload tests (they need multipart/ImageField + Pillow + real files)
and focus on the permission-heavy actions: likes, unlikes, delete, toggle_featured.

Permission model (from photo.py):
  - Anyone can list/retrieve.
  - Authenticated users can like/unlike.
  - Only the uploader or a staff admin can delete.
  - Only the party host can toggle_featured.
"""

import pytest
from rest_framework import status

from birthdayapi.models import PartyPhoto, PhotoLike


LIST_URL = '/api/photos/'
GALLERY_URL = '/api/photos/party_gallery/'


def detail_url(pk):
    return f'/api/photos/{pk}/'


def like_url(pk):
    return f'/api/photos/{pk}/like/'


def unlike_url(pk):
    return f'/api/photos/{pk}/unlike/'


def featured_url(pk):
    return f'/api/photos/{pk}/toggle_featured/'


def get_items(data):
    return data if isinstance(data, list) else data.get('results', [])


# ── Shared photo fixture ─────────────────────────────────────────────────────

@pytest.fixture
def photo(db, party, regular_user):
    """A photo uploaded by regular_user for the test party."""
    return PartyPhoto.objects.create(
        party=party,
        image='party_photos/fake.jpg',
        caption='Test photo',
        uploaded_by=regular_user,
    )


@pytest.fixture
def host_photo(db, party, host_user):
    """A photo uploaded by the party host."""
    return PartyPhoto.objects.create(
        party=party,
        image='party_photos/host_fake.jpg',
        caption='Host photo',
        uploaded_by=host_user,
    )


# ── List (public) ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPhotoList:

    def test_unauthenticated_can_list(self, client, photo):
        res = client.get(LIST_URL)
        assert res.status_code == status.HTTP_200_OK

    def test_list_contains_photo(self, client, photo):
        res = client.get(LIST_URL)
        ids = [p['id'] for p in get_items(res.data)]
        assert photo.pk in ids

    def test_filter_by_party(self, client, photo):
        res = client.get(LIST_URL, {'party': photo.party.pk})
        assert res.status_code == status.HTTP_200_OK

    def test_party_gallery_requires_party_id(self, client):
        res = client.get(GALLERY_URL)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_party_gallery_returns_photos(self, client, photo):
        res = client.get(GALLERY_URL, {'party_id': photo.party.pk})
        assert res.status_code == status.HTTP_200_OK
        assert 'photos' in res.data


# ── Like ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPhotoLike:

    def test_unauthenticated_cannot_like(self, client, photo):
        res = client.post(like_url(photo.pk))
        # DRF returns 403 when IsAuthenticated rejects an anonymous request
        # (no credentials provided, so the permission class is the gatekeeper).
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_like(self, auth_client, photo, regular_user):
        res = auth_client.post(like_url(photo.pk))
        assert res.status_code == status.HTTP_201_CREATED
        # Verify the like was persisted in the database rather than relying on
        # the response's likes_count field (which can lag due to prefetch caching).
        assert PhotoLike.objects.filter(user=regular_user, photo=photo).exists()

    def test_liking_again_returns_200_not_201(self, auth_client, photo, regular_user):
        PhotoLike.objects.create(user=regular_user, photo=photo)
        res = auth_client.post(like_url(photo.pk))
        assert res.status_code == status.HTTP_200_OK
        assert res.data['message'] == 'Photo already liked'


# ── Unlike ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPhotoUnlike:

    def test_unauthenticated_cannot_unlike(self, client, photo):
        res = client.delete(unlike_url(photo.pk))
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_unlike_a_liked_photo(
        self, auth_client, photo, regular_user
    ):
        PhotoLike.objects.create(user=regular_user, photo=photo)
        res = auth_client.delete(unlike_url(photo.pk))
        assert res.status_code == status.HTTP_200_OK
        assert photo.likes.count() == 0

    def test_unliking_a_non_liked_photo_returns_400(self, auth_client, photo):
        res = auth_client.delete(unlike_url(photo.pk))
        assert res.status_code == status.HTTP_400_BAD_REQUEST


# ── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPhotoDelete:

    def test_uploader_can_delete_own_photo(self, auth_client, photo):
        res = auth_client.delete(detail_url(photo.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT
        assert not PartyPhoto.objects.filter(pk=photo.pk).exists()

    def test_admin_can_delete_any_photo(self, admin_client, photo):
        res = admin_client.delete(detail_url(photo.pk))
        assert res.status_code == status.HTTP_204_NO_CONTENT

    def test_non_uploader_cannot_delete(self, auth_client, host_photo):
        # auth_client is regular_user; host_photo belongs to host_user
        res = auth_client.delete(detail_url(host_photo.pk))
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_delete(self, client, photo):
        res = client.delete(detail_url(photo.pk))
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ── toggle_featured ──────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestToggleFeatured:

    def test_party_host_can_feature_a_photo(self, host_client, photo):
        assert photo.is_featured is False
        res = host_client.post(featured_url(photo.pk))
        assert res.status_code == status.HTTP_200_OK
        assert res.data['is_featured'] is True

    def test_toggle_twice_turns_off(self, host_client, photo):
        host_client.post(featured_url(photo.pk))
        res = host_client.post(featured_url(photo.pk))
        assert res.data['is_featured'] is False

    def test_non_host_cannot_feature(self, auth_client, photo):
        # auth_client is regular_user, not the party host
        res = auth_client.post(featured_url(photo.pk))
        assert res.status_code == status.HTTP_403_FORBIDDEN
