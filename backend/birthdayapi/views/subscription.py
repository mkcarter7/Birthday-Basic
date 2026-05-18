from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    party_id = serializers.IntegerField(source='party.id', read_only=True)
    party_name = serializers.CharField(source='party.name', read_only=True)
    subdomain = serializers.SlugField(source='party.subdomain', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'party_id', 'party_name', 'subdomain',
            'tier', 'status', 'price_paid',
            'stripe_session_id', 'paid_at', 'created_at',
        ]
        read_only_fields = fields


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for subscriptions.
    The /signup/success page polls this with ?session_id=... to detect activation.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Subscription.objects.select_related('party').filter(
            party__host=self.request.user
        )
        session_id = self.request.query_params.get('session_id')
        if session_id:
            qs = qs.filter(stripe_session_id=session_id)
        return qs
