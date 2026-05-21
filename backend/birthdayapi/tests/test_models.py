"""
Unit tests for model methods and properties.

These tests only exercise Python-level logic — no HTTP, no views.
Each test is small and focused so failures point directly at the broken behavior.

Key concepts you'll see here:
  @pytest.mark.django_db  — tells pytest-django to wrap the test in a
                             transaction so the test database is clean each time.
  pytest.raises(...)      — asserts that a specific exception is raised.
  timezone.now()          — always use Django's timezone-aware helper instead of
                             datetime.now() so DST/UTC differences don't bite you.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError
from django.contrib.auth.models import User

from birthdayapi.models import (
    Party,
    GameScore,
    TriviaQuestion,
    GuestBookEntry,
    RSVP,
    PhotoLike,
    PartyPhoto,
)


# ── Party ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyIsExpired:
    """Party.is_expired depends on expires_at vs. the current moment."""

    def test_no_expiry_is_not_expired(self, party):
        party.expires_at = None
        party.save()
        assert party.is_expired is False

    def test_past_expiry_is_expired(self, party):
        party.expires_at = timezone.now() - timedelta(days=1)
        party.save()
        assert party.is_expired is True

    def test_future_expiry_is_not_expired(self, party):
        party.expires_at = timezone.now() + timedelta(days=1)
        party.save()
        assert party.is_expired is False


@pytest.mark.django_db
class TestPartyIsPast:
    """Party.is_past compares the party's date to now."""

    def test_future_party_is_not_past(self, party):
        # party fixture already has date 30 days from now
        assert party.is_past is False

    def test_past_party_is_past(self, party):
        party.date = timezone.now() - timedelta(days=1)
        party.save()
        assert party.is_past is True


# ── GameScore ────────────────────────────────────────────────────────────────

class TestGameScoreCalculateLevel:
    """
    calculate_level() uses integer division: level = (points // 100) + 1.
    No database needed — we just call the method on an unsaved instance.
    """

    def _score(self, points):
        """Helper: create an in-memory GameScore with the given points."""
        s = GameScore()
        s.total_points = points
        return s

    def test_zero_points_is_level_1(self):
        assert self._score(0).calculate_level() == 1

    def test_99_points_is_level_1(self):
        assert self._score(99).calculate_level() == 1

    def test_100_points_is_level_2(self):
        assert self._score(100).calculate_level() == 2

    def test_199_points_is_level_2(self):
        assert self._score(199).calculate_level() == 2

    def test_200_points_is_level_3(self):
        assert self._score(200).calculate_level() == 3

    def test_550_points_is_level_6(self):
        assert self._score(550).calculate_level() == 6


# ── TriviaQuestion ───────────────────────────────────────────────────────────

class TestTriviaQuestionGetOptions:
    """
    get_options() returns only the non-empty option fields.
    No database needed here either.
    """

    def _question(self, o3='', o4=''):
        q = TriviaQuestion()
        q.option_1 = 'Red'
        q.option_2 = 'Blue'
        q.option_3 = o3
        q.option_4 = o4
        return q

    def test_two_options_when_3_and_4_empty(self):
        assert self._question().get_options() == ['Red', 'Blue']

    def test_three_options_when_only_3_set(self):
        assert self._question(o3='Green').get_options() == ['Red', 'Blue', 'Green']

    def test_four_options_when_all_set(self):
        assert self._question(o3='Green', o4='Yellow').get_options() == [
            'Red', 'Blue', 'Green', 'Yellow'
        ]


@pytest.mark.django_db
class TestTriviaQuestionToDict:
    """to_dict() should return the expected keys and correct options list."""

    def test_to_dict_contains_expected_keys(self, party):
        q = TriviaQuestion.objects.create(
            party=party,
            category='Colors',
            question='What color is the sky?',
            option_1='Blue',
            option_2='Red',
            correct_answer=0,
            points=20,
        )
        d = q.to_dict()
        assert set(d.keys()) == {'id', 'category', 'question', 'options', 'correct_answer', 'points'}

    def test_to_dict_options_matches_get_options(self, party):
        q = TriviaQuestion.objects.create(
            party=party,
            question='Favorite fruit?',
            option_1='Apple',
            option_2='Banana',
            option_3='Mango',
            correct_answer=1,
            points=10,
        )
        assert q.to_dict()['options'] == q.get_options()


# ── GuestBookEntry ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGuestBookEntryIsAuthor:
    """is_author(user) checks object-level ownership."""

    def test_returns_true_for_author(self, party, regular_user):
        entry = GuestBookEntry.objects.create(
            party=party,
            author=regular_user,
            message='Hello!',
        )
        assert entry.is_author(regular_user) is True

    def test_returns_false_for_other_user(self, party, regular_user, other_user):
        entry = GuestBookEntry.objects.create(
            party=party,
            author=regular_user,
            message='Hello!',
        )
        assert entry.is_author(other_user) is False


# ── Uniqueness constraints ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestRSVPUniqueConstraint:
    """RSVP.Meta sets unique_together = ('party', 'user'). A second RSVP for
    the same user+party should raise IntegrityError at the database level."""

    def test_duplicate_rsvp_raises(self, party, regular_user):
        RSVP.objects.create(party=party, user=regular_user, status='yes')
        with pytest.raises(IntegrityError):
            RSVP.objects.create(party=party, user=regular_user, status='no')


@pytest.mark.django_db
class TestPhotoLikeUniqueConstraint:
    """PhotoLike.Meta sets unique_together = ('user', 'photo').
    Liking the same photo twice should raise IntegrityError."""

    def test_duplicate_like_raises(self, party, regular_user, host_user):
        photo = PartyPhoto.objects.create(
            party=party,
            image='party_photos/fake.jpg',
            uploaded_by=host_user,
        )
        PhotoLike.objects.create(user=regular_user, photo=photo)
        with pytest.raises(IntegrityError):
            PhotoLike.objects.create(user=regular_user, photo=photo)
