"""
Tests for TriviaViewSet.

Key behaviours:
  - GET /api/trivia/questions/ is public (no auth required).
  - POST /api/trivia/submit/ requires authentication.
  - Correct answers earn the question's points; wrong answers earn nothing.
  - Submitting updates (or creates) the user's GameScore for the party.
  - Accuracy percentage is calculated correctly.
"""

import pytest
from rest_framework import status

from birthdayapi.models import GameScore, TriviaQuestion


QUESTIONS_URL = '/api/trivia/questions/'
SUBMIT_URL = '/api/trivia/submit/'
CATEGORIES_URL = '/api/trivia/categories/'


@pytest.fixture
def question(db, party):
    return TriviaQuestion.objects.create(
        party=party,
        category='Colors',
        question='What color is the sky?',
        option_1='Blue',
        option_2='Red',
        option_3='Green',
        option_4='Yellow',
        correct_answer=0,  # 'Blue' is correct
        points=20,
        is_active=True,
    )


@pytest.fixture
def second_question(db, party):
    return TriviaQuestion.objects.create(
        party=party,
        category='Animals',
        question='What sound does a cow make?',
        option_1='Moo',
        option_2='Woof',
        correct_answer=0,  # 'Moo' is correct
        points=10,
        is_active=True,
    )


# ── GET /api/trivia/questions/ ───────────────────────────────────────────────

@pytest.mark.django_db
class TestTriviaQuestions:

    def test_unauthenticated_can_get_questions(self, client, party, question):
        res = client.get(QUESTIONS_URL, {'party': party.pk})
        assert res.status_code == status.HTTP_200_OK

    def test_returns_party_questions(self, client, party, question):
        res = client.get(QUESTIONS_URL, {'party': party.pk})
        assert res.data['total_questions'] == 1
        assert res.data['questions'][0]['question'] == question.question

    def test_missing_party_id_returns_400(self, client):
        res = client.get(QUESTIONS_URL)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_party_returns_404(self, client):
        res = client.get(QUESTIONS_URL, {'party': 99999})
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_count_param_limits_results(self, client, party, question, second_question):
        res = client.get(QUESTIONS_URL, {'party': party.pk, 'count': 1})
        assert res.data['total_questions'] == 1

    def test_inactive_questions_excluded(self, client, party, question):
        question.is_active = False
        question.save()
        res = client.get(QUESTIONS_URL, {'party': party.pk})
        assert res.data['total_questions'] == 0


# ── GET /api/trivia/categories/ ─────────────────────────────────────────────

@pytest.mark.django_db
class TestTriviaCategories:

    def test_returns_list_of_categories(self, client, question, second_question):
        res = client.get(CATEGORIES_URL)
        assert res.status_code == status.HTTP_200_OK
        assert 'categories' in res.data

    def test_categories_contains_question_category(self, client, question):
        res = client.get(CATEGORIES_URL)
        assert question.category in res.data['categories']


# ── POST /api/trivia/submit/ ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestTriviaSubmit:

    def test_unauthenticated_cannot_submit(self, client, party, question):
        payload = {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 0}],
        }
        res = client.post(SUBMIT_URL, payload, format='json')
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_missing_party_id_returns_400(self, auth_client):
        res = auth_client.post(SUBMIT_URL, {'answers': []}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_answers_returns_400(self, auth_client, party):
        res = auth_client.post(SUBMIT_URL, {'party': party.pk}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_party_returns_404(self, auth_client):
        res = auth_client.post(SUBMIT_URL, {
            'party': 99999,
            'answers': [{'question_id': 1, 'answer': 0}],
        }, format='json')
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_correct_answer_earns_points(self, auth_client, party, question):
        res = auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 0}],  # correct
        }, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['results']['points_earned'] == question.points
        assert res.data['results']['correct_answers'] == 1

    def test_wrong_answer_earns_no_points(self, auth_client, party, question):
        res = auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 1}],  # wrong
        }, format='json')
        assert res.data['results']['points_earned'] == 0
        assert res.data['results']['correct_answers'] == 0

    def test_accuracy_is_calculated(self, auth_client, party, question, second_question):
        res = auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [
                {'question_id': question.pk, 'answer': 0},         # correct
                {'question_id': second_question.pk, 'answer': 1},  # wrong
            ],
        }, format='json')
        assert res.data['results']['accuracy'] == 50.0

    def test_score_created_on_first_submit(self, auth_client, party, question, regular_user):
        auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 0}],
        }, format='json')
        assert GameScore.objects.filter(user=regular_user, party=party).exists()

    def test_score_accumulates_on_second_submit(
        self, auth_client, party, question, regular_user
    ):
        auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 0}],
        }, format='json')
        auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': question.pk, 'answer': 0}],
        }, format='json')
        score = GameScore.objects.get(user=regular_user, party=party)
        assert score.total_points == question.points * 2

    def test_score_level_updated_after_submit(
        self, auth_client, party, regular_user
    ):
        # Create a question worth 200 points so level jumps above 1 in one submit
        big_q = TriviaQuestion.objects.create(
            party=party,
            question='Big question?',
            option_1='Yes',
            option_2='No',
            correct_answer=0,
            points=200,
            is_active=True,
        )
        auth_client.post(SUBMIT_URL, {
            'party': party.pk,
            'answers': [{'question_id': big_q.pk, 'answer': 0}],
        }, format='json')
        score = GameScore.objects.get(user=regular_user, party=party)
        assert score.level == 3  # 200 // 100 + 1
