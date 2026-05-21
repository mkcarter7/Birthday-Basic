"""
Tests for GameScoreViewSet.

Permission model (from game_score.py):
  - All endpoints require authentication.
  - Regular users can only see their own scores.
  - Staff can see all scores.
  - add_points requires ownership or staff.
  - Level is automatically recalculated when points change.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from birthdayapi.models import GameScore


LIST_URL = '/api/scores/'
MY_SCORES_URL = '/api/scores/my_scores/'
LEADERBOARD_URL = '/api/scores/leaderboard/'


def detail_url(pk):
    return f'/api/scores/{pk}/'


def get_items(data):
    return data if isinstance(data, list) else data.get('results', [])


def add_points_url(pk):
    return f'/api/scores/{pk}/add_points/'


@pytest.fixture
def my_score(db, party, regular_user):
    return GameScore.objects.create(
        user=regular_user,
        party=party,
        total_points=50,
        level=1,
    )


@pytest.fixture
def other_score(db, party, other_user):
    return GameScore.objects.create(
        user=other_user,
        party=party,
        total_points=200,
        level=3,
    )


# ── Authentication guard ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGameScoreAuthRequired:

    def test_unauthenticated_cannot_list(self, client):
        res = client.get(LIST_URL)
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


# ── Queryset scoping ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGameScoreScope:

    def test_regular_user_sees_only_own_scores(
        self, auth_client, my_score, other_score
    ):
        res = auth_client.get(LIST_URL)
        ids = [s['id'] for s in get_items(res.data)]
        assert my_score.pk in ids
        assert other_score.pk not in ids

    def test_staff_sees_all_scores(self, admin_client, my_score, other_score):
        res = admin_client.get(LIST_URL)
        ids = [s['id'] for s in get_items(res.data)]
        assert my_score.pk in ids
        assert other_score.pk in ids

    def test_my_scores_endpoint_returns_only_own(
        self, auth_client, my_score, other_score
    ):
        res = auth_client.get(MY_SCORES_URL)
        assert res.status_code == status.HTTP_200_OK
        ids = [s['id'] for s in res.data['scores']]
        assert my_score.pk in ids
        assert other_score.pk not in ids

    def test_my_scores_totals_correct(self, auth_client, my_score):
        res = auth_client.get(MY_SCORES_URL)
        assert res.data['total_points'] == my_score.total_points
        assert res.data['total_parties'] == 1


# ── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGameScoreCreate:

    def test_authenticated_user_can_create_score(self, auth_client, party):
        res = auth_client.post(LIST_URL, {
            'party': party.pk,
            'total_points': 0,
        }, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        score = GameScore.objects.get(pk=res.data['id'])
        assert score.user.username == 'alice'

    def test_level_calculated_on_create(self, auth_client, party):
        res = auth_client.post(LIST_URL, {
            'party': party.pk,
            'total_points': 150,
        }, format='json')
        score = GameScore.objects.get(pk=res.data['id'])
        assert score.level == 2  # 150 // 100 + 1


# ── add_points action ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAddPoints:

    def test_owner_can_add_points(self, auth_client, my_score):
        res = auth_client.post(add_points_url(my_score.pk), {'points': 50}, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['points_added'] == 50
        my_score.refresh_from_db()
        assert my_score.total_points == 100

    def test_level_updates_after_adding_points(self, auth_client, my_score):
        # my_score starts at 50 points (level 1). Adding 60 → 110 → level 2.
        auth_client.post(add_points_url(my_score.pk), {'points': 60}, format='json')
        my_score.refresh_from_db()
        assert my_score.level == 2

    def test_zero_points_returns_400(self, auth_client, my_score):
        res = auth_client.post(add_points_url(my_score.pk), {'points': 0}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_negative_points_returns_400(self, auth_client, my_score):
        res = auth_client.post(add_points_url(my_score.pk), {'points': -10}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_owner_cannot_add_points(self, auth_client, other_score):
        # regular_user's queryset excludes other_user's scores, so the score
        # is not found → 404 (queryset scoping prevents data leakage).
        res = auth_client.post(add_points_url(other_score.pk), {'points': 10}, format='json')
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_add_points_to_any_score(self, admin_client, my_score):
        res = admin_client.post(add_points_url(my_score.pk), {'points': 25}, format='json')
        assert res.status_code == status.HTTP_200_OK


# ── Leaderboard ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLeaderboard:

    def test_leaderboard_for_party(self, auth_client, party, my_score, other_score):
        res = auth_client.get(LEADERBOARD_URL, {'party': party.pk})
        assert res.status_code == status.HTTP_200_OK
        assert res.data['type'] == 'party'
        # other_score (200 pts) should be ranked before my_score (50 pts)
        ids = [s['id'] for s in res.data['leaderboard']]
        assert ids.index(other_score.pk) < ids.index(my_score.pk)

    def test_overall_leaderboard(self, auth_client, my_score, other_score):
        res = auth_client.get(LEADERBOARD_URL)
        assert res.status_code == status.HTTP_200_OK
        assert res.data['type'] == 'overall'

    def test_leaderboard_for_nonexistent_party(self, auth_client):
        res = auth_client.get(LEADERBOARD_URL, {'party': 99999})
        assert res.status_code == status.HTTP_404_NOT_FOUND
